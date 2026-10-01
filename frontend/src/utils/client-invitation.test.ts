import { beforeEach, describe, expect, it } from "vitest";
import {
  clearClientInvitationToken,
  prepareClientInvitation,
  readClientInvitationToken,
} from "./client-invitation";

beforeEach(() => {
  clearClientInvitationToken();
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("private client invitation URL", () => {
  it("removes the token from the URL before telemetry and remembers the invitation language", () => {
    const token = "a".repeat(43);
    window.history.replaceState(
      null,
      "",
      `/client-invitation#token=${token}&lang=en`,
    );
    prepareClientInvitation();
    expect(window.location.hash).toBe("");
    expect(readClientInvitationToken()).toBe(token);
    expect(localStorage.getItem("naki-language")).toBe("en");
  });
  it("keeps a valid pending invitation when returning from sign-in", () => {
    window.history.replaceState(
      null,
      "",
      `/client-invitation#token=${"a".repeat(43)}`,
    );
    prepareClientInvitation();
    prepareClientInvitation();
    expect(readClientInvitationToken()).toBe("a".repeat(43));
  });
  it("does not reuse an older invitation when a malformed new link is opened", () => {
    window.history.replaceState(
      null,
      "",
      `/client-invitation#token=${"a".repeat(43)}`,
    );
    prepareClientInvitation();
    window.history.replaceState(null, "", "/client-invitation#token=invalid");
    prepareClientInvitation();
    expect(readClientInvitationToken()).toBe("");
    expect(window.location.hash).toBe("");
  });
});
