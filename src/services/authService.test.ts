import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { resetPrototypeFallbackStorage } from "./prototypeStorage";
import {
  authStorage,
  createPrototypeSession,
  isCertifiedBroker,
  setBrokerCertificationStatus,
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
      accountMode: "tenant",
      brokerCertificationStatus: "not-required",
      isBrokerCertified: false,
    };

    authStorage.setSession(tokens, user);

    assert.equal(authStorage.getAccessToken(), tokens.accessToken);
    assert.equal(authStorage.getRefreshToken(), tokens.refreshToken);
    assert.deepEqual(authStorage.getUser(), user);
  });

  it("creates a deterministic localStorage-backed prototype session without API", () => {
    const user = createPrototypeSession("kakao");

    assert.equal(user.provider, "kakao");
    assert.equal(user.accountMode, "tenant");
    assert.equal(user.brokerCertificationStatus, "not-required");
    assert.equal(authStorage.getUser()?.isBrokerCertified, false);
    assert.match(authStorage.getAccessToken() ?? "", /prototype-kakao/);
    assert.equal(authStorage.getUser()?.provider, user.provider);
    assert.equal(authStorage.getUser()?.accountMode, user.accountMode);
    assert.equal(
      authStorage.getUser()?.brokerCertificationStatus,
      user.brokerCertificationStatus
    );
  });

  it("clears all local auth data after each user test sandbox", () => {
    createPrototypeSession("google");

    authStorage.clear();

    assert.equal(authStorage.getAccessToken(), null);
    assert.equal(authStorage.getRefreshToken(), null);
    assert.equal(authStorage.getUser(), null);
  });

  it("stores email registration sessions as tenant-first users", () => {
    authStorage.setSession(
      {
        accessToken: "registered-access",
      },
      {
        id: "registered-user",
        email: "agent@example.com",
        nickname: "가입자",
        provider: "email",
        accountMode: "tenant",
        brokerCertificationStatus: "not-required",
        isBrokerCertified: false,
      }
    );

    assert.equal(authStorage.getUser()?.provider, "email");
    assert.equal(authStorage.getUser()?.accountMode, "tenant");
    assert.equal(authStorage.getUser()?.brokerCertificationStatus, "not-required");
  });

  it("approves broker certification in the local session", () => {
    createPrototypeSession("google");

    const updatedUser = setBrokerCertificationStatus("approved");

    assert.equal(updatedUser?.accountMode, "broker");
    assert.equal(updatedUser?.brokerCertificationStatus, "approved");
    assert.equal(updatedUser?.isBrokerCertified, true);
    assert.equal(isCertifiedBroker(authStorage.getUser()), true);
  });
});
