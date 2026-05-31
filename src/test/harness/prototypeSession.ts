import type { AuthUser } from "../../services/authService";
import { getPrototypeStorage } from "../../services/prototypeStorage";

const ACCESS_TOKEN_KEY = "stayview_access_token";
const REFRESH_TOKEN_KEY = "stayview_refresh_token";
const USER_KEY = "stayview_user";

export const prototypeTestUser: AuthUser = {
  id: "test-user",
  email: "tester@stayview.local",
  nickname: "홍길동",
  provider: "google",
  accountMode: "tenant",
  brokerCertificationStatus: "not-required",
};

export function seedPrototypeSession(user: AuthUser = prototypeTestUser) {
  const storage = getPrototypeStorage();
  storage.setItem(ACCESS_TOKEN_KEY, "test-access-token");
  storage.setItem(REFRESH_TOKEN_KEY, "test-refresh-token");
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearPrototypeSession() {
  const storage = getPrototypeStorage();
  storage.removeItem(ACCESS_TOKEN_KEY);
  storage.removeItem(REFRESH_TOKEN_KEY);
  storage.removeItem(USER_KEY);
}
