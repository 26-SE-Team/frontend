import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "../components/home/BottomNav";
import { useAuth } from "../contexts/AuthContext";
import {
  type BrokerCertificationStatus,
  isCertifiedBroker,
} from "../services/authService";
import { readDraftListingsForDisplay } from "../services/prototypeStorage";
import type { Listing } from "../types/listing";
import "./mypage.css";

interface CertificationStatusView {
  title: string;
  description: string;
  ctaLabel?: string;
}

export function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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
  const displayName = user?.nickname?.trim() || "홍길동";

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

          {isCertified && (
            <BrokerListingsOverview
              listings={brokerListings}
              onRegister={() => navigate("/listing/new")}
              onOpenAll={() => navigate("/my-listings")}
              onOpenListing={(listingId) => navigate(`/listing/${listingId}`)}
            />
          )}

          <section className="mypage-menu" aria-label="내 계정 메뉴">
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

interface BrokerListingsOverviewProps {
  listings: Listing[];
  onRegister: () => void;
  onOpenAll: () => void;
  onOpenListing: (listingId: string) => void;
}

function BrokerListingsOverview({
  listings,
  onRegister,
  onOpenAll,
  onOpenListing,
}: BrokerListingsOverviewProps) {
  return (
    <section className="mypage-listings" aria-labelledby="mypage-listings-title">
      <div className="mypage-listings__header">
        <div className="mypage-listings__title">
          <span>중개인 인증 완료</span>
          <h2 id="mypage-listings-title">내가 올린 매물</h2>
        </div>
        <div className="mypage-listings__actions">
          {listings.length > 0 && (
            <button
              type="button"
              className="mypage-listings__text-button"
              onClick={onOpenAll}
            >
              전체
            </button>
          )}
          <button
            type="button"
            className="mypage-listings__register"
            onClick={onRegister}
            aria-label="매물 등록하기"
          >
            <PlusIcon />
            등록
          </button>
        </div>
      </div>

      {listings.length > 0 ? (
        <div className="mypage-listings__rail" aria-label="내가 올린 매물 목록">
          {listings.map((listing) => (
            <button
              type="button"
              key={listing.id}
              className="mypage-listings__card"
              onClick={() => onOpenListing(listing.id)}
              aria-label={`${listing.price} ${listing.type} 상세 보기`}
            >
              <img src={listing.imageUrl} alt={`${listing.type} 매물`} />
              <span>
                <strong>{listing.price}</strong>
                <span>{listing.location ?? listing.type}</span>
                <small>{listing.info}</small>
              </span>
            </button>
          ))}
        </div>
      ) : (
        <button
          type="button"
          className="mypage-listings__empty"
          onClick={onRegister}
        >
          <strong>등록된 매물이 없습니다.</strong>
          <span>새 매물을 등록하면 이곳에서 바로 관리할 수 있어요.</span>
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

function PlusIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      aria-hidden
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}
