import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "../components/home/BottomNav";
import { useAuth } from "../contexts/AuthContext";
import {
  type BrokerCertificationStatus,
  isCertifiedBroker,
  updateCurrentAuthUser,
} from "../services/authService";
import {
  readDraftListingsForDisplay,
  readLatestCertificationDraft,
} from "../services/prototypeStorage";
import "./mypage.css";

interface CertificationStatusView {
  title: string;
  description: string;
}

export function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, setUser } = useAuth();

  const isCertified = useMemo(() => isCertifiedBroker(user), [user]);
  const certificationStatus = user?.brokerCertificationStatus ?? "not-required";
  const redirectedFromBrokerFeature = Boolean(
    (location.state as { from?: string } | null)?.from
  );
  const effectiveCertificationStatus =
    certificationStatus === "not-required" && redirectedFromBrokerFeature
      ? "required"
      : certificationStatus;
  const certificationView =
    effectiveCertificationStatus !== "not-required"
      ? getCertificationStatusView(effectiveCertificationStatus)
      : null;
  const brokerListings = useMemo(
    () => (isCertified ? readDraftListingsForDisplay() : []),
    [isCertified]
  );
  const certificationDraft = useMemo(() => readLatestCertificationDraft(), []);
  const displayName = user?.nickname?.trim() || "홍길동";

  const startBrokerApplication = () => {
    const nextUser = updateCurrentAuthUser({
      accountMode: "tenant",
      brokerCertificationStatus: "required",
      isBrokerCertified: false,
    });

    if (nextUser) setUser(nextUser);
    navigate("/certification");
  };

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
            <small>내 정보</small>
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
          <BrokerAccessPanel
            isCertified={isCertified}
            certificationView={certificationView}
            listingCount={brokerListings.length}
            certificationOfficeName={certificationDraft?.officeName}
            onApply={startBrokerApplication}
            onRegister={() => navigate("/listing/new")}
            onOpenCertification={() => navigate("/certification")}
            onOpenListings={() => navigate("/my-listings")}
          />

          <section className="mypage-menu" aria-label="내 계정 메뉴">
            <button type="button" onClick={() => navigate("/stored")}>
              <span>관심 매물</span>
              <ChevronIcon />
            </button>
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

interface BrokerAccessPanelProps {
  isCertified: boolean;
  certificationView: CertificationStatusView | null;
  listingCount: number;
  certificationOfficeName?: string;
  onApply: () => void;
  onRegister: () => void;
  onOpenCertification: () => void;
  onOpenListings: () => void;
}

function BrokerAccessPanel({
  isCertified,
  certificationView,
  listingCount,
  certificationOfficeName,
  onApply,
  onRegister,
  onOpenCertification,
  onOpenListings,
}: BrokerAccessPanelProps) {
  const statusText = isCertified
    ? "중개사 인증 완료"
    : (certificationView?.title ?? "중개사 인증이 필요해요");
  const statusDescription = isCertified
    ? certificationOfficeName
      ? `${certificationOfficeName} 정보로 인증되어 있습니다.`
      : "인증된 명의로 매물을 등록하고 관리할 수 있습니다."
    : (certificationView?.description ??
      "중개사 인증을 완료하면 매물 등록과 내 매물 관리를 사용할 수 있습니다.");

  return (
    <section className="mypage-broker" aria-labelledby="mypage-broker-title">
      <div className="mypage-broker__header">
        <div>
          <span>{statusText}</span>
          <h2 id="mypage-broker-title">중개사 메뉴</h2>
        </div>
        {isCertified ? (
          <button
            type="button"
            className="mypage-broker__register"
            onClick={onRegister}
            aria-label="매물 등록하기"
          >
            매물 등록
          </button>
        ) : (
          <button
            type="button"
            className="mypage-broker__apply"
            onClick={onApply}
          >
            중개사 신청
          </button>
        )}
      </div>

      <p>{statusDescription}</p>

      {isCertified ? (
        <div className="mypage-broker__menu" aria-label="중개사 메뉴">
          <button type="button" onClick={onOpenCertification}>
            <span>중개사 인증 정보 보기</span>
            <ChevronIcon />
          </button>
          <button type="button" onClick={onOpenListings}>
            <span>내가 올린 매물 보기</span>
            <strong>{listingCount}개</strong>
            <ChevronIcon />
          </button>
        </div>
      ) : (
        <button
          type="button"
          className="mypage-broker__primary"
          onClick={onApply}
        >
          중개사 인증 시작하기
        </button>
      )}
    </section>
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
        title: "중개사 인증이 진행 중이에요",
        description: "제출한 정보를 확인하고 있습니다. 승인되면 매물 등록 기능이 열립니다.",
      };
    case "rejected":
      return {
        title: "인증 정보를 다시 확인해 주세요",
        description: "입력한 정보나 첨부 서류를 확인한 뒤 다시 제출해 주세요.",
      };
    case "required":
    default:
      return {
        title: "중개사 인증이 필요해요",
        description: "중개사 인증을 완료하면 매물 등록과 내 매물 관리를 사용할 수 있습니다.",
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
