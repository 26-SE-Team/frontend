import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/home/BottomNav";
import { useAuth } from "../contexts/AuthContext";
import "./mypage.css";

export function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const displayName = user?.nickname?.trim() || "홍길동";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="mypage">
      <div className="mypage__frame">
        <header className="mypage__header">
          <div className="mypage__header-actions">
            <button type="button" aria-label="알림">
              <BellIcon />
            </button>
            <button type="button" aria-label="설정">
              <GearIcon />
            </button>
          </div>
          <h1>{displayName} 님</h1>
        </header>

        <div className="mypage__content">
          <section className="mypage-menu" aria-label="회원 메뉴">
            <button type="button">
              <span>프로필</span>
              <ChevronIcon />
            </button>
            <button type="button" onClick={() => navigate("/stored")}>
              <span>관심 매물</span>
              <ChevronIcon />
            </button>
          </section>

          <section className="mypage-section" aria-labelledby="broker-menu-title">
            <h2 id="broker-menu-title">중개사 전용</h2>
            <div className="mypage-menu">
              <button type="button" onClick={() => navigate("/certification")}>
                <span>중개사 인증</span>
              </button>
              <button type="button" onClick={() => navigate("/my-listings")}>
                <span>내가 올린 매물 보기</span>
              </button>
            </div>
          </section>

          <section className="mypage-section" aria-labelledby="version-title">
            <h2 id="version-title">현재 앱 버전</h2>
            <div className="mypage-version">
              <span>5.20.1</span>
              <span>최신 버전입니다.</span>
            </div>
          </section>

          <section className="mypage-legal" aria-label="약관">
            <button type="button">이용약관</button>
            <button type="button">개인정보 처리방침</button>
            <button type="button">회사소개</button>
          </section>

          <p className="mypage-hours">
            평일 10:00 ~ 18:30 (토, 일, 공휴일 휴무)
            <br />
            점심시간 12:30 ~ 13:30
          </p>

          <button type="button" className="mypage-contract">
            비대면 계약조회
          </button>

          <div className="mypage-support">
            <button type="button">고객센터</button>
            <button type="button">광고문의</button>
          </div>

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
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 1.55V21a2 2 0 01-4 0v-.09A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1H3a2 2 0 010-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 012.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.09A1.7 1.7 0 0015 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 012.83 2.83l-.06.06A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.55 1H21a2 2 0 010 4h-.09A1.7 1.7 0 0019.4 15z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
