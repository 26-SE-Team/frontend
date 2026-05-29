import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { allListings, findListingById } from "../data/mockListings";
import "./listingDetail.css";

export function ListingDetailPage() {
  const navigate = useNavigate();
  const { listingId } = useParams();
  const [galleryState, setGalleryState] = useState({ listingId: "", index: 0 });

  const listing = useMemo(
    () => findListingById(listingId) ?? allListings[0],
    [listingId]
  );

  const images = listing.imageUrls?.length ? listing.imageUrls : [listing.imageUrl];
  const selectedImageIndex =
    galleryState.listingId === listing.id
      ? Math.min(galleryState.index, images.length - 1)
      : 0;
  const selectedImage = images[selectedImageIndex] ?? images[0];

  return (
    <main className="listing-detail">
      <div className="listing-detail__frame">
        <header className="listing-detail__topbar">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
          <button type="button" aria-label="저장">
            <HeartIcon />
          </button>
        </header>

        <section className="listing-detail__gallery" aria-label="매물 사진">
          <img src={selectedImage} alt={`${listing.type} 대표 사진`} />
          <div className="listing-detail__gallery-count">
            {selectedImageIndex + 1} / {images.length}
          </div>
          {images.length > 1 && (
            <div className="listing-detail__thumbs" aria-label="사진 선택">
              {images.map((image, index) => (
                <button
                  key={image}
                  type="button"
                  className={index === selectedImageIndex ? "is-active" : ""}
                  onClick={() => setGalleryState({ listingId: listing.id, index })}
                  aria-label={`${index + 1}번 사진 보기`}
                >
                  <img src={image} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="listing-detail__content">
          <section className="listing-detail__summary">
            <p className="listing-detail__location">{listing.location}</p>
            <h1>{listing.price}</h1>
            <p>
              {listing.type} · {listing.info}
            </p>
          </section>

          <section className="listing-detail__facts" aria-label="기본 정보">
            <div>
              <span>면적</span>
              <strong>{listing.size ?? "21m²"}</strong>
            </div>
            <div>
              <span>층수</span>
              <strong>{listing.floor ?? listing.info}</strong>
            </div>
            <div>
              <span>관리비</span>
              <strong>{listing.managementFee ?? "확인 필요"}</strong>
            </div>
          </section>

          <section className="listing-detail__section">
            <h2>생활 환경</h2>
            <p>{listing.station ?? "인근 역과 생활 편의시설 접근성이 좋은 매물입니다."}</p>
            <div className="listing-detail__chips">
              {(listing.highlights ?? ["3D 보기", "채팅 문의", "즉시 입주"]).map(
                (highlight) => (
                  <span key={highlight}>{highlight}</span>
                )
              )}
            </div>
          </section>

          <section className="listing-detail__section">
            <h2>옵션</h2>
            <div className="listing-detail__options">
              {(listing.options ?? ["에어컨", "냉장고", "세탁기"]).map((option) => (
                <span key={option}>{option}</span>
              ))}
            </div>
          </section>

          <button
            type="button"
            className="listing-detail__viewer"
            onClick={() => navigate(`/viewer?listing=${listing.id}`)}
          >
            <CubeIcon />
            <span>
              <strong>3D 공간 보기</strong>
              <small>로컬 모델 또는 Gaussian scene으로 확인</small>
            </span>
          </button>
        </div>

        <div className="listing-detail__actionbar">
          <button type="button" aria-label="저장">
            <HeartIcon />
          </button>
          <button type="button" aria-label="공유">
            <ShareIcon />
          </button>
          <button type="button" onClick={() => navigate("/chat")}>
            채팅하기
          </button>
        </div>
      </div>
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4" />
      <path d="M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3.3 7.5L12 12l8.7-4.5" />
      <path d="M12 22V12" />
    </svg>
  );
}
