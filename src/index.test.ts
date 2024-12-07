import { describe, it, expect } from "vitest";
import { updateImageLinks } from "./index";

describe("Wiki Publisher", () => {
  it("should update relative image links correctly", () => {
    const content = "![Test Image](images/test.png)";
    const relativePath = "docs/subfolder";

    const result = updateImageLinks(content, relativePath);
    expect(result).toBe("![Test Image](docs/subfolder/images/test.png)");
  });

  it("should not modify external image links", () => {
    const content = "![External Image](https://example.com/image.png)";
    const relativePath = "docs";

    const result = updateImageLinks(content, relativePath);
    expect(result).toBe(content);
  });
});
