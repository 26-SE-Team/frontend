import { Link, useNavigate } from "react-router-dom";
import { readDraftListingsForDisplay } from "../services/prototypeStorage";
import type { Listing } from "../types/listing";
import "./myListings.css";

export function MyListingsPage() {
  const navigate = useNavigate();
  const myListings: Listing[] = readDraftListingsForDisplay();

  return (
    <main className="my-listings-page">
      <div className="my-listings-page__frame">
        <header className="my-listings-page__header">
          <button type="button" onClick={() => navigate(-1)} aria-label="뒤로가기">
            <BackIcon />
          </button>
          <h1>내가 올린 매물</h1>
        </header>

        <section className="my-listings-list" aria-label="내가 올린 매물 목록">
          {myListings.length === 0 ? (
            <p className="my-listings-list__empty">아직 등록한 매물이 없습니다.</p>
          ) : (
            myListings.map((listing) => (
              <Link to={`/listing/${listing.id}`} className="my-listings-list__item" key={listing.id}>
                <img src={listing.imageUrl} alt={`${listing.type} 매물`} />
                <span>
                  <strong>{listing.price}</strong>
                  <span>{listing.type}</span>
                  <span>{listing.info}</span>
                </span>
              </Link>
            ))
          )}
        </section>

        <button
          type="button"
          className="my-listings-page__register"
          onClick={() => navigate("/listing/new")}
        >
          매물 등록하기
        </button>
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
