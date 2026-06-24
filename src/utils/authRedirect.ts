const POST_LOGIN_REDIRECT_KEY = "stayview_post_login_redirect";
const DEFAULT_REDIRECT = "/home";

export function normalizePostLoginRedirect(target: string | null | undefined) {
  const value = target?.trim();

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT;
  }

  if (value === "/" || value.startsWith("/login")) {
    return DEFAULT_REDIRECT;
  }

  return value;
}

export function createLoginRedirectPath(pathname: string, search = "", hash = "") {
  const target = normalizePostLoginRedirect(`${pathname}${search}${hash}`);
  return `/login?redirect=${encodeURIComponent(target)}`;
}

export function getPostLoginRedirectFromSearch(search: string) {
  return normalizePostLoginRedirect(new URLSearchParams(search).get("redirect"));
}

export function rememberPostLoginRedirect(search: string) {
  const target = getPostLoginRedirectFromSearch(search);
  if (target === DEFAULT_REDIRECT || typeof window === "undefined") return;
  window.sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, target);
}

export function consumeRememberedPostLoginRedirect() {
  if (typeof window === "undefined") return DEFAULT_REDIRECT;

  const target = normalizePostLoginRedirect(
    window.sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY)
  );
  window.sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  return target;
}
