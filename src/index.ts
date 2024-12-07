import * as core from "@actions/core";
import * as github from "@actions/github";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { glob } from "glob";
import { exec as execCallback, getExecOutput } from "@actions/exec";

async function run(): Promise<void> {
  try {
    const docsFolder = core.getInput("docs-folder", { required: true });
    const token = core.getInput("github-token", { required: true });
    const context = github.context;

    // Clone the wiki repository
    const wikiUrl = `https://x-access-token:${token}@github.com/${context.repo.owner}/${context.repo.repo}.wiki.git`;

    try {
      await exec("git", ["clone", wikiUrl, "wiki-repo"]);
    } catch (error) {
      core.setFailed(
        "Failed to clone wiki repository. Please make sure:\n" +
          "1. Wiki is enabled in your repository settings (Settings -> Features -> Wikis)\n" +
          "2. You have created the first wiki page (Home page) in your repository\n" +
          "3. The GITHUB_TOKEN has sufficient permissions\n\n" +
          "Error details: " +
          error
      );
      return;
    }

    // Get all markdown and image files
    const markdownFiles = await glob(`${docsFolder}/**/*.md`);
    const imageFiles = await glob(`${docsFolder}/**/*.{png,jpg,jpeg,gif,svg}`);

    core.debug(`Found ${markdownFiles.length} markdown files`);
    core.debug(`Found ${imageFiles.length} image files`);

    // Copy images to wiki repository
    for (const imagePath of imageFiles) {
      const relativePath = path.relative(docsFolder, imagePath);
      const destPath = path.join("wiki-repo", relativePath);

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.copyFile(imagePath, destPath);
    }

    // Process and copy markdown files
    for (const mdFile of markdownFiles) {
      const relativePath = path.relative(docsFolder, mdFile);
      const destPath = path.join("wiki-repo", relativePath);

      let content = await fs.readFile(mdFile, "utf8");

      // Add debug logging
      core.debug(`Processing file: ${mdFile}`);
      core.debug(`Original content: ${content}`);

      // Update image links to use wiki format
      content = updateImageLinks(content, docsFolder);

      core.debug(`Updated content: ${content}`);

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, content);
    }

    // Commit and push changes
    await exec("git", ["-C", "wiki-repo", "add", "."]);

    // Check if there are any changes
    const { stdout } = await getExecOutput("git", [
      "-C",
      "wiki-repo",
      "status",
      "--porcelain",
    ]);
    if (!stdout) {
      core.info("No changes to commit to wiki");
      return;
    }

    await exec("git", [
      "-C",
      "wiki-repo",
      "config",
      "user.name",
      "GitHub Action",
    ]);
    await exec("git", [
      "-C",
      "wiki-repo",
      "config",
      "user.email",
      "action@github.com",
    ]);
    await exec("git", [
      "-C",
      "wiki-repo",
      "commit",
      "-m",
      "Update wiki content",
    ]);
    await exec("git", ["-C", "wiki-repo", "push"]);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

function updateImageLinks(content: string, replacePath: string): string {
  // Escape any special RegExp characters in the replacePath
  const escapedPath = replacePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Update image markdown links to use correct wiki paths
  return content.replace(/!\[(.*?)\]\((.*?)\)/g, (match, alt, imagePath) => {
    if (imagePath.startsWith("http")) {
      return match; // Don't modify external URLs
    }

    const cleanPath = imagePath
      .replace(/^\/+/, "") // Remove leading slashes
      .replace(new RegExp(`^${escapedPath}/?`), "") // Remove replacePath and optional trailing slash
      .replace(new RegExp(`^/?${escapedPath}/?`), ""); // Also try with optional leading slash

    return `![${alt}](${cleanPath})`;
  });
}

async function exec(command: string, args: string[]): Promise<void> {
  await execCallback(command, args);
}

run();

export { updateImageLinks };
