import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createLoginRedirectPath,
  getPostLoginRedirectFromSearch,
  normalizePostLoginRedirect,
} from "./authRedirect";

describe("authRedirect", () => {
  it("preserves the protected internal route a user originally requested", () => {
    assert.equal(
      createLoginRedirectPath("/viewer", "?listing=replica-room-1"),
      "/login?redirect=%2Fviewer%3Flisting%3Dreplica-room-1"
    );
  });

  it("accepts only internal application paths as post-login redirects", () => {
    assert.equal(
      getPostLoginRedirectFromSearch("?redirect=%2Fviewer%3Flisting%3Drec-1"),
      "/viewer?listing=rec-1"
    );
    assert.equal(normalizePostLoginRedirect("https://evil.test/viewer"), "/home");
    assert.equal(normalizePostLoginRedirect("//evil.test/viewer"), "/home");
    assert.equal(normalizePostLoginRedirect("/login?redirect=/viewer"), "/home");
  });
});
