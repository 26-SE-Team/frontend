import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../pages/authCallback.css";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="auth-callback">
        <p className="auth-callback__message">로딩 중...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
