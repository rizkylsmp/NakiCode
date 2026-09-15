import { describe, expect, it } from "vitest";
import { isAllowedRevisionAttachmentName } from "../routes/uploads";

describe("revision attachment validation", () => {
  it.each([
    "screenshot.png",
    "brief.pdf",
    "catatan.docx",
    "data.xlsx",
    "presentasi.pptx",
    "source.zip",
    "README.md",
  ])("accepts safe work file %s", (filename) => {
    expect(isAllowedRevisionAttachmentName(filename)).toBe(true);
  });

  it.each(["script.js", "page.html", "vector.svg", "program.exe", "no-extension"])(
    "rejects potentially unsafe file %s",
    (filename) => {
      expect(isAllowedRevisionAttachmentName(filename)).toBe(false);
    },
  );
});
