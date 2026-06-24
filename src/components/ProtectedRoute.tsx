import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { createLoginRedirectPath } from "../utils/authRedirect";
import "../pages/authCallback.css";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="auth-callback">
        <p className="auth-callback__message">로딩 중...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={createLoginRedirectPath(
          location.pathname,
          location.search,
          location.hash
        )}
        replace
      />
    );
  }

  return <Outlet />;
}
