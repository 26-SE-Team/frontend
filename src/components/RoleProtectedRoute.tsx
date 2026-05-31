import type { ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  isBrokerUser,
  isCertifiedBroker,
} from "../services/authService";
import "./RoleProtectedRoute.css";

interface RoleProtectedRouteProps {
  mode: "broker" | "tenant";
  requireCertifiedBroker?: boolean;
  redirectTo?: string;
  children: ReactNode;
}

export function RoleProtectedRoute({
  mode,
  requireCertifiedBroker = false,
  redirectTo,
  children,
}: RoleProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const resetLogin = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <main className="role-gate">
        <div className="role-gate__frame">
          <p className="role-gate__eyebrow">권한 확인 중</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (mode === "broker" && !isBrokerUser(user)) {
    return (
      <main className="role-gate">
        <div className="role-gate__frame">
          <section className="role-gate__panel" aria-labelledby="role-gate-title">
            <p className="role-gate__eyebrow">중개인 전용</p>
            <h1 id="role-gate-title">중개인 계정으로 이용할 수 있는 기능입니다.</h1>
            <p>
              매물 등록, 내 매물 관리, 중개인 인증은 중개인 계정에서만
              사용할 수 있습니다.
            </p>
            <div className="role-gate__actions">
              <button type="button" onClick={() => navigate(redirectTo ?? "/home", { replace: true })}>
                홈으로
              </button>
              <button type="button" onClick={resetLogin}>
                계정 다시 선택
              </button>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (mode === "tenant" && isBrokerUser(user)) {
    return (
      <Navigate
        to={redirectTo ?? "/home"}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (requireCertifiedBroker && !isCertifiedBroker(user)) {
    return (
      <Navigate
        to="/mypage"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}
