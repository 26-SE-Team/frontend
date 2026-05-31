import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "../components/home/BottomNav";
import { useAuth } from "../contexts/AuthContext";
import {
  type BrokerCertificationStatus,
  isBrokerUser,
  isCertifiedBroker,
} from "../services/authService";
import "./mypage.css";

interface CertificationStatusView {
  title: string;
  description: string;
  ctaLabel?: string;
}

export function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isBroker = useMemo(() => isBrokerUser(user), [user]);
  const isCertified = useMemo(() => isCertifiedBroker(user), [user]);
  const certificationStatus = user?.brokerCertificationStatus ?? "not-required";
  const certificationView = isBroker
    ? getCertificationStatusView(certificationStatus)
    : null;
  const displayName = user?.nickname?.trim() || "홍길동";
  const roleLabel = isBroker ? "중개인 계정" : "임차인 계정";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <main className="mypage">
      <div className="mypage__frame">
        <header className="mypage__header">
          <h1>
            {displayName}
            <small>{roleLabel}</small>
          </h1>

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
          {certificationView && !isCertified && (
            <section className="mypage-cert-warning" role="status" aria-live="polite">
              <h2>{certificationView.title}</h2>
              <p>{certificationView.description}</p>
              {certificationView.ctaLabel && (
                <button type="button" onClick={() => navigate("/certification")}>
                  {certificationView.ctaLabel}
                </button>
              )}
            </section>
          )}

          <section className="mypage-menu" aria-label="내 계정 메뉴">
            {isBroker ? (
              <>
                <button type="button" onClick={() => navigate("/listing/new")}>
                  <span>매물 등록</span>
                  <ChevronIcon />
                </button>
                <button type="button" onClick={() => navigate("/my-listings")}>
                  <span>내가 올린 매물</span>
                  <ChevronIcon />
                </button>
                <button type="button" onClick={() => navigate("/chat")}>
                  <span>상담 채팅</span>
                  <ChevronIcon />
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => navigate("/stored")}>
                  <span>관심 매물</span>
                  <ChevronIcon />
                </button>
                <button type="button" onClick={() => navigate("/chat")}>
                  <span>채팅</span>
                  <ChevronIcon />
                </button>
              </>
            )}
          </section>

          <section className="mypage-menu mypage-menu--spaced" aria-label="서비스 메뉴">
            <button type="button">
              <span>문의하기</span>
              <ChevronIcon />
            </button>

            <div className="mypage-menu__static">
              <span>앱 버전</span>
              <strong>0.0.1 beta</strong>
            </div>

            <button
              type="button"
              className="mypage-menu__logout"
              onClick={handleLogout}
            >
              <span>로그아웃</span>
              <ChevronIcon />
            </button>
          </section>
        </div>

        <BottomNav active="mypage" />
      </div>
    </main>
  );
}

function getCertificationStatusView(
  status: BrokerCertificationStatus
): CertificationStatusView | null {
  switch (status) {
    case "approved":
    case "not-required":
      return null;
    case "pending":
      return {
        title: "중개인 인증이 진행 중이에요",
        description: "제출한 정보를 확인하고 있습니다. 승인되면 매물 등록 기능이 열립니다.",
      };
    case "rejected":
      return {
        title: "인증 정보를 다시 확인해 주세요",
        description: "입력한 정보나 첨부 서류를 확인한 뒤 다시 제출해 주세요.",
        ctaLabel: "다시 제출하기",
      };
    case "required":
    default:
      return {
        title: "중개인 인증이 필요해요",
        description: "중개인 인증을 완료하면 매물 등록과 내 매물 관리를 사용할 수 있습니다.",
        ctaLabel: "정보 입력하기",
      };
  }
}

function BellIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06a2 2 0 01-2.83 2.83l-.06-.06A1.7 1.7 0 0015 19.4a1.7 1.7 0 00-1 1.55V21a2 2 0 01-4 0v-.09A1.7 1.7 0 009 19.4a1.7 1.7 0 00-1.88.34l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.7 1.7 0 004.6 15a1.7 1.7 0 00-1.55-1H3a2 2 0 010-4h.09A1.7 1.7 0 004.6 9a1.7 1.7 0 00-.34-1.88l-.06-.06a2 2 0 012.83-2.83l.06.06A1.7 1.7 0 009 4.6a1.7 1.7 0 001-1.55V3a2 2 0 014 0v.09A1.7 1.7 0 0015 4.6a1.7 1.7 0 001.88-.34l.06-.06a2 2 0 012.83 2.83l-.06.06A1.7 1.7 0 0019.4 9a1.7 1.7 0 001.55 1H21a2 2 0 010 4h-.09A1.7 1.7 0 0019.4 15z" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
