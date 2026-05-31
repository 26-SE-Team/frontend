import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { allListings, findListingById } from "../data/mockListings";
import {
  readFavoriteListingIds,
  toggleFavoriteListing,
} from "../services/prototypeStorage";
import "./listingDetail.css";

export function ListingDetailPage() {
  const navigate = useNavigate();
  const { listingId } = useParams();

  const listing = useMemo(
    () => findListingById(listingId) ?? allListings[0],
    [listingId]
  );
  const [favoriteIds, setFavoriteIds] = useState(() => readFavoriteListingIds());

  const images = listing.imageUrls?.length ? listing.imageUrls : [listing.imageUrl];
  const selectedImage = images[0] ?? listing.imageUrl;
  const optionItems = listing.options ?? ["옷장", "냉장고", "싱크대", "전자레인지"];
  const isFavorite = favoriteIds.includes(listing.id);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <div className="listing-detail__gallery-count">1 / {images.length}</div>
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
          </section>

          <nav className="listing-detail__tabs" aria-label="상세 정보 바로가기">
            <button type="button" onClick={() => scrollTo("price-info")}>
              가격정보
            </button>
            <button type="button" onClick={() => scrollTo("detail-info")}>
              상세정보
            </button>
            <button type="button" onClick={() => scrollTo("option-info")}>
              옵션
            </button>
            <button type="button" onClick={() => scrollTo("viewer-info")}>
              공간보기
            </button>
            <button type="button" onClick={() => scrollTo("analysis-info")}>
              AI 분석
            </button>
          </nav>

          <section className="listing-detail__section" id="option-info">
            <h2>옵션</h2>
            <div className="listing-detail__options">
              {optionItems.map((option) => (
                <span key={option}>{option}</span>
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

          <section className="listing-detail__section" id="analysis-info">
            <h2>AI 공간 분석 리포트</h2>
            <div className="listing-detail__analysis" />
          </section>
        </div>

        <div className="listing-detail__actionbar">
          <button
            type="button"
            aria-label={isFavorite ? "관심 매물 해제" : "관심 매물 저장"}
            aria-pressed={isFavorite}
            onClick={() => setFavoriteIds(toggleFavoriteListing(listing.id))}
          >
            <HeartIcon />
          </button>
          <button type="button" aria-label="비대면 계약">
            <ContractIcon />
          </button>
          <button type="button" onClick={() => navigate("/chat")}>
            채팅하기
          </button>
        </div>
      </div>
    </main>
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

function HeartIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="#ff5b70" strokeWidth="1.9" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
    </svg>
  );
}

function ContractIcon() {
  return (
    <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
      <path d="M7 10V8a5 5 0 0110 0v2" />
      <rect x="5" y="10" width="14" height="10" rx="2" />
    </svg>
  );
}
