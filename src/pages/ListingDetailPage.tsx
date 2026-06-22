import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { allListings } from "../data/mockListings";
import { readDraftListingsForDisplay } from "../services/prototypeStorage";
import {
  rememberRecentViewedListing,
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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isGalleryControlsVisible, setIsGalleryControlsVisible] = useState(false);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const thumbnailTrackRef = useRef<HTMLDivElement>(null);
  const galleryControlsTimerRef = useRef<number | null>(null);

  const images = listing.imageUrls?.length ? listing.imageUrls : [listing.imageUrl];
  const selectedImage = images[selectedImageIndex] ?? images[0] ?? listing.imageUrl;
  const optionItems = listing.options ?? ["옷장", "냉장고", "싱크대", "전자레인지"];
  const isFavorite = favoriteIds.includes(listing.id);
  const hasMultipleImages = images.length > 1;

  const clearGalleryControlsTimer = () => {
    if (galleryControlsTimerRef.current === null) return;

    window.clearTimeout(galleryControlsTimerRef.current);
    galleryControlsTimerRef.current = null;
  };

  const showGalleryControls = () => {
    if (!hasMultipleImages) return;

    clearGalleryControlsTimer();
    setIsGalleryControlsVisible(true);
  };

  const hideGalleryControls = () => {
    clearGalleryControlsTimer();
    setIsGalleryControlsVisible(false);
  };

  const showGalleryControlsTemporarily = () => {
    if (!hasMultipleImages) return;

    clearGalleryControlsTimer();
    setIsGalleryControlsVisible(true);
    galleryControlsTimerRef.current = window.setTimeout(() => {
      setIsGalleryControlsVisible(false);
      galleryControlsTimerRef.current = null;
    }, 1800);
  };

  const selectImage = (index: number) => {
    const boundedIndex = Math.min(Math.max(index, 0), images.length - 1);

    setSelectedImageIndex(boundedIndex);
    galleryTrackRef.current?.children
      .item(boundedIndex)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    thumbnailTrackRef.current?.children
      .item(boundedIndex)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  };

  const handleGalleryScroll = () => {
    const galleryTrack = galleryTrackRef.current;
    if (!galleryTrack) return;

    const nextIndex = Math.round(galleryTrack.scrollLeft / galleryTrack.clientWidth);
    if (nextIndex !== selectedImageIndex) {
      setSelectedImageIndex(Math.min(Math.max(nextIndex, 0), images.length - 1));
    }
  };

  useEffect(() => {
    if (listingId && listing.id === listingId) {
      rememberRecentViewedListing(listing.id);
    }
  }, [listing.id, listingId]);

  useEffect(() => {
    setSelectedImageIndex(0);
    galleryTrackRef.current?.scrollTo({ left: 0 });
    thumbnailTrackRef.current?.scrollTo({ left: 0 });
  }, [listing.id]);

  useEffect(() => {
    return () => {
      clearGalleryControlsTimer();
    };
  }, []);

  return (
    <main className="listing-detail">
      <div className="listing-detail__frame">
        <header className="listing-detail__topbar">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
        </header>

        <section
          className={`listing-detail__gallery${isGalleryControlsVisible ? " is-gallery-controls-visible" : ""}`}
          aria-label="매물 사진"
          onPointerEnter={showGalleryControls}
          onPointerLeave={hideGalleryControls}
          onPointerDown={(event) => {
            if (event.pointerType !== "mouse") showGalleryControlsTemporarily();
          }}
          onPointerMove={(event) => {
            if (event.pointerType !== "mouse") showGalleryControlsTemporarily();
          }}
        >
          <div
            ref={galleryTrackRef}
            className="listing-detail__gallery-track"
            onScroll={handleGalleryScroll}
          >
            {images.map((image, index) => (
              <img
                key={`${listing.id}-${image}-${index}`}
                src={image}
                alt={`${listing.type} 사진 ${index + 1}`}
              />
            ))}
          </div>
          {hasMultipleImages && (
            <div
              ref={thumbnailTrackRef}
              className="listing-detail__thumbnail-track"
              aria-label="매물 사진 목록"
            >
              {images.map((image, index) => (
                <button
                  type="button"
                  key={`${listing.id}-thumb-${image}-${index}`}
                  className={index === selectedImageIndex ? "is-selected" : ""}
                  aria-label={`${index + 1}번 사진 보기`}
                  aria-current={index === selectedImageIndex}
                  onClick={() => selectImage(index)}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
          <div className="listing-detail__gallery-count">
            {selectedImageIndex + 1} / {images.length}
          </div>
        </section>

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
          <button type="button" onClick={() => navigate(`/chat?listing=${listing.id}`)}>
            채팅하기
          </button>
        </div>
      </div>
    </main>
  );
}

function optionIconFor(label: string) {
  const text = label.replace(/\s+/g, "").toLowerCase();

  if (text.includes("소파") || text.includes("의자")) return <SofaIcon />;
  if (text.includes("테이블") || text.includes("식탁")) return <TableIcon />;
  if (text.includes("스탠드") || text.includes("조명")) return <LampIcon />;
  if (text.includes("블라인드")) return <BlindIcon />;
  if (text.includes("냉장고")) return <FridgeIcon />;
  if (text.includes("세탁기")) return <WasherIcon />;
  if (text.includes("전자레인지")) return <MicrowaveIcon />;
  if (text.includes("인덕션") || text.includes("가스레인지")) return <CooktopIcon />;
  if (text.includes("에어컨")) return <AirconIcon />;
  if (text.includes("책상")) return <DeskIcon />;
  if (text.includes("옷장") || text.includes("붙박이장")) return <ClosetIcon />;
  if (text.includes("침대")) return <BedIcon />;
  if (text.includes("수납")) return <StorageIcon />;
  if (text.includes("주차")) return <ParkingIcon />;
  if (text.includes("반려동물")) return <PetIcon />;

  return <OptionDefaultIcon />;
}

function OptionSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function SofaIcon() {
  return (
    <OptionSvg>
      <path d="M6.5 11.5V9.2A3.2 3.2 0 019.7 6h4.6a3.2 3.2 0 013.2 3.2v2.3" />
      <path d="M5.5 11.5h13a2.5 2.5 0 012.5 2.5v3.2H3V14a2.5 2.5 0 012.5-2.5z" />
      <path d="M5 17.2v2" />
      <path d="M19 17.2v2" />
    </OptionSvg>
  );
}

function TableIcon() {
  return (
    <OptionSvg>
      <path d="M4 9.5h16" />
      <path d="M6.5 9.5v8" />
      <path d="M17.5 9.5v8" />
      <path d="M8 17.5h8" />
      <path d="M8 6.5h8" />
    </OptionSvg>
  );
}

function LampIcon() {
  return (
    <OptionSvg>
      <path d="M9 4h6l2 6H7l2-6z" />
      <path d="M12 10v8" />
      <path d="M8.5 20h7" />
      <path d="M10 18h4" />
    </OptionSvg>
  );
}

function BlindIcon() {
  return (
    <OptionSvg>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <path d="M5 8h14" />
      <path d="M5 12h14" />
      <path d="M5 16h14" />
      <path d="M16 4v16" />
    </OptionSvg>
  );
}

function FridgeIcon() {
  return (
    <OptionSvg>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M7 10h10" />
      <path d="M10 6.5v1.5" />
      <path d="M10 13.5v2" />
    </OptionSvg>
  );
}

function WasherIcon() {
  return (
    <OptionSvg>
      <rect x="6" y="3.5" width="12" height="17" rx="2" />
      <circle cx="12" cy="13" r="4" />
      <path d="M9 6.8h1" />
      <path d="M13 6.8h2" />
    </OptionSvg>
  );
}

function MicrowaveIcon() {
  return (
    <OptionSvg>
      <rect x="4" y="7" width="16" height="10" rx="2" />
      <rect x="7" y="9.5" width="7" height="5" rx="1" />
      <path d="M17 10h.01" />
      <path d="M17 14h.01" />
    </OptionSvg>
  );
}

function CooktopIcon() {
  return (
    <OptionSvg>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <circle cx="10" cy="10" r="2" />
      <circle cx="14.5" cy="14.5" r="2.5" />
    </OptionSvg>
  );
}

function AirconIcon() {
  return (
    <OptionSvg>
      <rect x="4.5" y="5.5" width="15" height="6" rx="2" />
      <path d="M8 14c-.8.7-.8 1.5 0 2.2" />
      <path d="M12 14c-.8.7-.8 1.5 0 2.2" />
      <path d="M16 14c-.8.7-.8 1.5 0 2.2" />
      <path d="M7 9h10" />
    </OptionSvg>
  );
}

function DeskIcon() {
  return (
    <OptionSvg>
      <path d="M5 10h14" />
      <path d="M7 10v8" />
      <path d="M17 10v8" />
      <path d="M9 6h6a2 2 0 012 2v2H7V8a2 2 0 012-2z" />
    </OptionSvg>
  );
}

function ClosetIcon() {
  return (
    <OptionSvg>
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M12 4v16" />
      <path d="M10 12h.01" />
      <path d="M14 12h.01" />
    </OptionSvg>
  );
}

function BedIcon() {
  return (
    <OptionSvg>
      <path d="M5 7v11" />
      <path d="M19 11v7" />
      <path d="M5 11h11a3 3 0 013 3v4H5v-7z" />
      <path d="M7 9h4" />
    </OptionSvg>
  );
}

function StorageIcon() {
  return (
    <OptionSvg>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <path d="M5 10h14" />
      <path d="M5 15h14" />
      <path d="M11 7.5h2" />
      <path d="M11 12.5h2" />
      <path d="M11 17.5h2" />
    </OptionSvg>
  );
}

function ParkingIcon() {
  return (
    <OptionSvg>
      <path d="M8.5 19V5h5a4 4 0 010 8h-5" />
    </OptionSvg>
  );
}

function PetIcon() {
  return (
    <OptionSvg>
      <circle cx="8" cy="8" r="1.6" />
      <circle cx="12" cy="6.8" r="1.6" />
      <circle cx="16" cy="8" r="1.6" />
      <circle cx="7" cy="12.2" r="1.5" />
      <circle cx="17" cy="12.2" r="1.5" />
      <path d="M8.8 17.4c0-2 1.4-3.4 3.2-3.4s3.2 1.4 3.2 3.4c0 1.2-.8 1.9-1.8 1.5-.9-.4-1.9-.4-2.8 0-1 .4-1.8-.3-1.8-1.5z" />
    </OptionSvg>
  );
}

function OptionDefaultIcon() {
  return (
    <OptionSvg>
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <path d="M9 10h6" />
      <path d="M9 14h4" />
    </OptionSvg>
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
