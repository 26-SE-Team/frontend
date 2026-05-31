import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { resetPrototypeFallbackStorage } from "./prototypeStorage";
import {
  authStorage,
  createPrototypeSession,
  type AuthTokens,
  type AuthUser,
} from "./authService";

describe("authStorage prototype session", () => {
  beforeEach(resetPrototypeFallbackStorage);
  afterEach(resetPrototypeFallbackStorage);

  it("stores and reads local prototype auth tokens", () => {
    const tokens: AuthTokens = {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    };
    const user: AuthUser = {
      id: "user-1",
      email: "user@stayview.local",
      nickname: "테스터",
      provider: "google",
    };

    authStorage.setSession(tokens, user);

    assert.equal(authStorage.getAccessToken(), tokens.accessToken);
    assert.equal(authStorage.getRefreshToken(), tokens.refreshToken);
    assert.deepEqual(authStorage.getUser(), user);
  });

  it("creates a deterministic localStorage-backed prototype session without API", () => {
    const user = createPrototypeSession("kakao");

    assert.equal(user.provider, "kakao");
    assert.match(authStorage.getAccessToken() ?? "", /prototype-kakao/);
    assert.deepEqual(authStorage.getUser(), user);
  });

  it("clears all local auth data after each user test sandbox", () => {
    createPrototypeSession("google");

    authStorage.clear();

    assert.equal(authStorage.getAccessToken(), null);
    assert.equal(authStorage.getRefreshToken(), null);
    assert.equal(authStorage.getUser(), null);
  });
});
