import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { allListings } from "../data/mockListings";
import {
  readFavoriteListingIds,
  removeFavoriteListing,
} from "../services/prototypeStorage";
import type { Listing } from "../types/listing";
import "./stored.css";

export function StoredPage() {
  const navigate = useNavigate();
  const [favoriteIds, setFavoriteIds] = useState(() => readFavoriteListingIds());
  const storedListings = favoriteIds
    .map((listingId) => allListings.find((listing) => listing.id === listingId))
    .filter((listing): listing is Listing => Boolean(listing));

  return (
    <main className="stored-page">
      <div className="stored-page__frame">
        <header className="stored-page__header">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
          <h1>관심 매물</h1>
        </header>

        <section className="stored-list" aria-label="관심 매물 목록">
          {storedListings.map((listing) => (
            <article className="stored-list__item" key={listing.id}>
              <Link to={`/listing/${listing.id}`} className="stored-list__link">
                <img src={listing.imageUrl} alt={`${listing.type} 매물`} />
                <span className="stored-list__copy">
                  <strong>{listing.price}</strong>
                  <span>{listing.type}</span>
                  <span>{listing.info}</span>
                </span>
              </Link>
              <button
                type="button"
                aria-label="관심 해제"
                onClick={() =>
                  setFavoriteIds(removeFavoriteListing(listing.id))
                }
              >
                <HeartIcon />
              </button>
            </article>
          ))}
          {storedListings.length === 0 && (
            <p className="stored-list__empty">저장한 관심 매물이 없습니다.</p>
          )}
        </section>
      </div>
    </main>
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
