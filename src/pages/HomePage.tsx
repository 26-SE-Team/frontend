import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./authCallback.css";

export function HomePage() {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <main className="auth-callback">
        <p className="auth-callback__message">로딩 중...</p>
      </main>
    );
  }

  return (
    <main className="auth-callback auth-callback--home">
      <h1 className="auth-callback__title">StayView</h1>
      <p className="auth-callback__message">
        {user?.nickname || user?.email || "로그인"} 님, 환영합니다.
      </p>
      {user?.provider && (
        <p className="auth-callback__sub">
          {user.provider === "kakao" ? "카카오" : "Google"} 계정으로 로그인됨
        </p>
      )}
      <button type="button" className="auth-callback__btn" onClick={handleLogout}>
        로그아웃
      </button>
    </main>
  );
}
