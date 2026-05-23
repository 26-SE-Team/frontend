import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StayViewLogo } from "../components/start/StayViewLogo";
import { SearchBar } from "../components/home/SearchBar";
import { ListingSection } from "../components/home/ListingSection";
import { BottomNav } from "../components/home/BottomNav";
import { recommendedListings, recentListings } from "../data/mockListings";
import { filterListings } from "../utils/filterListings";
import "./home.css";

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const filteredRecommended = useMemo(
    () => filterListings(recommendedListings, query),
    [query]
  );

  const filteredRecent = useMemo(
    () => filterListings(recentListings, query),
    [query]
  );

  const isSearching = query.trim().length > 0;
  const totalResults = filteredRecommended.length + filteredRecent.length;

  return (
    <main className="home">
      <div className="home__frame">
        <header className="home__header">
          <StayViewLogo />
          <SearchBar value={query} onChange={setQuery} />
        </header>

        <div className="home__content">
          {isSearching && (
            <p className="home-search-status" aria-live="polite">
              &quot;{query.trim()}&quot; 검색 결과 {totalResults}건
            </p>
          )}

          {isSearching && totalResults === 0 ? (
            <div className="home-empty">
              <p className="home-empty__title">검색 결과가 없습니다</p>
              <p className="home-empty__desc">
                매물 유형, 가격, 지역, 층수 등으로 다시 검색해보세요.
              </p>
            </div>
          ) : (
            <>
              <ListingSection
                title={isSearching ? "추천 매물 검색 결과" : "추천 매물"}
                listings={filteredRecommended}
                hideWhenEmpty={isSearching}
              />
              <ListingSection
                title={isSearching ? "최근 본 매물 검색 결과" : "최근 본 매물"}
                listings={filteredRecent}
                hideWhenEmpty={isSearching}
              />
            </>
          )}

          <button
            type="button"
            className="home__register-btn"
            onClick={() => navigate("/listing/new")}
          >
            매물 등록하기
          </button>
        </div>

        <BottomNav active="home" />
      </div>
    </main>
  );
}
