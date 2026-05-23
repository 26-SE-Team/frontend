import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/home/BottomNav";
import { useAuth } from "../contexts/AuthContext";
import "./mypage.css";

export function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="mypage">
      <div className="mypage__frame">
        <header className="mypage__header">
          <h1>마이페이지</h1>
          <div className="mypage__header-actions">
            <button type="button" aria-label="알림">
              <BellIcon />
            </button>
            <button type="button" aria-label="설정">
              <GearIcon />
            </button>
          </div>
        </header>

        <div className="mypage__content">
          <section className="mypage-profile" aria-label="프로필">
            <div className="mypage-profile__avatar">
              {(user?.nickname ?? "S").slice(0, 1)}
            </div>
            <div>
              <p className="mypage-profile__name">
                {user?.nickname ?? "StayView 사용자"}
              </p>
              <p className="mypage-profile__meta">
                {user?.email ?? "prototype@stayview.local"}
              </p>
            </div>
            <span className="mypage-profile__badge">프로토타입</span>
          </section>

          <section className="mypage-stats" aria-label="활동 요약">
            <div>
              <strong>8</strong>
              <span>관심 매물</span>
            </div>
            <div>
              <strong>3</strong>
              <span>문의 중</span>
            </div>
            <div>
              <strong>1</strong>
              <span>등록 매물</span>
            </div>
          </section>

          <section className="mypage-menu" aria-label="주요 메뉴">
            <button type="button" onClick={() => navigate("/listing/new")}>
              <span className="mypage-menu__icon">
                <HomePlusIcon />
              </span>
              <span>
                <strong>내 매물 등록</strong>
                <small>사진과 3D 모델 파일을 함께 관리</small>
              </span>
            </button>
            <button type="button">
              <span className="mypage-menu__icon">
                <ShieldIcon />
              </span>
              <span>
                <strong>중개사 인증</strong>
                <small>시연용 인증 대기 상태</small>
              </span>
            </button>
            <button type="button" onClick={() => navigate("/viewer")}>
              <span className="mypage-menu__icon">
                <CubeIcon />
              </span>
              <span>
                <strong>3D 모델 관리</strong>
                <small>로컬 GLB, PLY, Gaussian scene 확인</small>
              </span>
            </button>
          </section>

          <section className="mypage-links" aria-label="서비스 메뉴">
            <button type="button">고객센터</button>
            <button type="button">약관 및 개인정보처리방침</button>
            <button type="button">광고 문의</button>
          </section>

          <button type="button" className="mypage__logout" onClick={handleLogout}>
            로그아웃
          </button>
        </div>

        <BottomNav active="mypage" />
      </div>
    </main>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 1.55V21a2 2 0 01-4 0v-.09A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1H3a2 2 0 010-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 012.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.09A1.7 1.7 0 0015 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 012.83 2.83l-.06.06A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.55 1H21a2 2 0 010 4h-.09A1.7 1.7 0 0019.4 15z" />
    </svg>
  );
}

function HomePlusIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M12 14v5" />
      <path d="M9.5 16.5h5" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-5" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3.3 7.5L12 12l8.7-4.5" />
      <path d="M12 22V12" />
    </svg>
  );
}
