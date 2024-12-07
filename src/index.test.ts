import { describe, it, expect } from "vitest";
import { updateImageLinks } from "./index";

describe("Wiki Publisher", () => {
  it("should update relative image paths correctly", () => {
    const testCases = [
      {
        content: "![Test Image](/docs/subfolder/images/test.png)",
        relativePath: "docs",
        expected: "![Test Image](subfolder/images/test.png)",
      },
      {
        content: "![Test Image](/docs/test.png)",
        relativePath: "docs",
        expected: "![Test Image](test.png)",
      },
      {
        content: "![Test Image](../images/test.png)",
        relativePath: "docs",
        expected: "![Test Image](../images/test.png)",
      },
      {
        content: "![Test Image](./images/test.png)",
        relativePath: "docs",
        expected: "![Test Image](./images/test.png)",
      },
      {
        content: "![Test Image](wiki/images/test.png)",
        relativePath: "wiki",
        expected: "![Test Image](images/test.png)",
      },
    ];

    for (const { content, relativePath, expected } of testCases) {
      const result = updateImageLinks(content, relativePath);
      expect(result).toBe(expected);
    }
  });

  it("should not modify external image links", () => {
    const content = "![External Image](https://example.com/image.png)";
    const relativePath = "docs";

    const result = updateImageLinks(content, relativePath);
    expect(result).toBe(content);
  });

  it("should handle multiple images in the same document", () => {
    const content = [
      "![Image 1](/docs/images/test1.png)",
      "Some text",
      "![Image 2](images/test2.png)",
      "More text",
      "![External](https://example.com/image.png)",
    ].join("\n");

    const expected = [
      "![Image 1](images/test1.png)",
      "Some text",
      "![Image 2](images/test2.png)",
      "More text",
      "![External](https://example.com/image.png)",
    ].join("\n");

    const result = updateImageLinks(content, "docs");
    expect(result).toBe(expected);
  });
});
