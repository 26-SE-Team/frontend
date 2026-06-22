import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { allListings } from "../data/mockListings";
import { readDraftListingsForDisplay } from "../services/prototypeStorage";
import {
  findOrCreatePrototypeChatRoom,
  recordRecentlyViewedListing,
  readFavoriteListingIds,
  toggleFavoriteListing,
} from "../services/prototypeStorage";
import "./listingDetail.css";

export function ListingDetailPage() {
  const navigate = useNavigate();
  const { listingId } = useParams();

  const listing = useMemo(() => {
    const allCatalog = [...allListings, ...readDraftListingsForDisplay()];
    const local = allCatalog.find((item) => item.id === listingId);
    return local ?? allCatalog[0];
  }, [listingId]);
  const [favoriteIds, setFavoriteIds] = useState(() => readFavoriteListingIds());
  const [selectedImageState, setSelectedImageState] = useState({
    listingId: listing.id,
    index: 0,
  });

  const images = listing.imageUrls?.length ? listing.imageUrls : [listing.imageUrl];
  const selectedImageIndex =
    selectedImageState.listingId === listing.id ? selectedImageState.index : 0;
  const selectedImage = images[selectedImageIndex] ?? images[0] ?? listing.imageUrl;
  const hasMultipleImages = images.length > 1;
  const optionItems = listing.options ?? ["옷장", "냉장고", "싱크대", "전자레인지"];
  const isFavorite = favoriteIds.includes(listing.id);

  useEffect(() => {
    recordRecentlyViewedListing(listing.id);
  }, [listing.id]);

  const moveImage = (direction: -1 | 1) => {
    setSelectedImageState((current) => ({
      listingId: listing.id,
      index:
        ((current.listingId === listing.id ? current.index : 0) +
          direction +
          images.length) %
        images.length,
    }));
  };

  const openListingChat = () => {
    findOrCreatePrototypeChatRoom(listing);
    navigate(`/chat?listing=${listing.id}`);
  };

  return (
    <main className="listing-detail">
      <div className="listing-detail__frame">
        <header className="listing-detail__topbar">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
        </header>

        <section className="listing-detail__gallery" aria-label="매물 사진">
          <img src={selectedImage} alt={`${listing.type} 대표 사진`} />
          <div className="listing-detail__gallery-count">
            {selectedImageIndex + 1} / {images.length}
          </div>
          {hasMultipleImages && (
            <>
              <button
                type="button"
                className="listing-detail__gallery-nav listing-detail__gallery-nav--prev"
                aria-label="이전 사진"
                onClick={() => moveImage(-1)}
              >
                <ChevronIcon direction="left" />
              </button>
              <button
                type="button"
                className="listing-detail__gallery-nav listing-detail__gallery-nav--next"
                aria-label="다음 사진"
                onClick={() => moveImage(1)}
              >
                <ChevronIcon direction="right" />
              </button>
            </>
          )}
        </section>
        {hasMultipleImages && (
          <div className="listing-detail__thumbs" aria-label="매물 사진 선택">
            {images.map((image, index) => (
              <button
                type="button"
                key={image}
                className={
                  index === selectedImageIndex
                    ? "listing-detail__thumb is-active"
                    : "listing-detail__thumb"
                }
                aria-label={`${index + 1}번째 사진 보기`}
                aria-pressed={index === selectedImageIndex}
                onClick={() => setSelectedImageState({ listingId: listing.id, index })}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="listing-detail__content">
          <section className="listing-detail__summary">
            <h1>{listing.price}</h1>
          </section>

          <section className="listing-detail__section" id="price-info">
            <h2>가격 정보</h2>
            <InfoRow label="월세" value={listing.price.replace("월세 ", "")} />
            <InfoRow label="관리비" value={listing.managementFee ?? "매월 5만 원"} />
          </section>

          <section className="listing-detail__section" id="detail-info">
            <h2>상세 정보</h2>
            <InfoRow label="방종류" value={listing.type} />
            <InfoRow label="해당층/건물층" value={listing.floor ?? listing.info} />
            <InfoRow label="전용/공급면적" value={`${listing.size ?? "26.44m²"} / 33.05m²`} />
            <InfoRow label="방 수/욕실 수" value="1개 / 1개" />
            <InfoRow label="엘리베이터" value="있음" />
            {listing.brokerName && (
              <InfoRow
                label="등록 중개인"
                value={`${listing.brokerName}${listing.brokerOfficeName ? ` · ${listing.brokerOfficeName}` : ""}`}
              />
            )}
          </section>

          <section className="listing-detail__section" id="option-info">
            <h2>옵션</h2>
            <div className="listing-detail__options">
              {optionItems.map((option) => (
                <span key={option} className="listing-detail__option">
                  <span className="listing-detail__option-icon" aria-hidden>
                    {optionIconFor(option)}
                  </span>
                  <span>{option}</span>
                </span>
              ))}
            </div>
          </section>

          <section className="listing-detail__section" id="viewer-info">
            <h2>공간 보기</h2>
            <button
              type="button"
              className="listing-detail__viewer"
              aria-label="공간 보기"
              onClick={() => navigate(`/viewer?listing=${listing.id}`)}
            >
              <img src={selectedImage} alt="" />
            </button>
          </section>
        </div>

        <div className="listing-detail__actionbar">
          <button
            type="button"
            aria-label={isFavorite ? "관심 매물 해제" : "관심 매물 저장"}
            aria-pressed={isFavorite}
            onClick={() => setFavoriteIds(toggleFavoriteListing(listing.id))}
          >
            <HeartIcon filled={isFavorite} />
          </button>
          <button type="button" onClick={openListingChat}>
            채팅하기
          </button>
        </div>
      </div>
    </main>
  );
}

function optionIconFor(label: string) {
  const text = label.replace(/\s+/g, "").toLowerCase();

  if (text.includes("소파") || text.includes("의자")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M5 8h14a3 3 0 013 3v7a1 1 0 01-1 1h-1" />
        <path d="M4 8v11" />
        <path d="M20 8v11" />
        <path d="M5 8c0-2.5 1.8-4 4-4h6c2.2 0 4 1.5 4 4" />
      </svg>
    );
  }

  if (text.includes("테이블")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 12h16" />
        <path d="M6 9V6a1 1 0 011-1h10a1 1 0 011 1v3" />
        <path d="M4 12v6a1 1 0 001 1h14a1 1 0 001-1v-6" />
        <path d="M9 12v4" />
        <path d="M15 12v4" />
      </svg>
    );
  }

  if (text.includes("냉장고")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 3h12a2 2 0 012 2v14a1 1 0 01-1 1h-1v-1a1 1 0 10-2 0v1h-6v-1a1 1 0 10-2 0v1H7a1 1 0 01-1-1V5a2 2 0 012-2z" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
      </svg>
    );
  }

  if (text.includes("조명") || text.includes("에어컨") || text.includes("스탠드")) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 2l4 6h-8l4-6z" />
        <path d="M10 11v2" />
        <path d="M14 11v2" />
        <path d="M12 13v9" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="listing-detail__row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  const points = direction === "left" ? "15 18 9 12 15 6" : "9 18 15 12 9 6";

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
      <polyline points={points} />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill={filled ? "#ff5b70" : "none"}
      stroke="#ff5b70"
      strokeWidth="1.9"
      aria-hidden
    >
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}
