import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { StayViewLogo } from "../components/start/StayViewLogo";
import { SearchBar } from "../components/home/SearchBar";
import { ListingSection } from "../components/home/ListingSection";
import { BottomNav } from "../components/home/BottomNav";
import { recommendedListings, recentListings } from "../data/mockListings";
import { filterListings } from "../utils/filterListings";
import { useAuth } from "../contexts/AuthContext";
import { isBrokerUser } from "../services/authService";
import "./home.css";

export function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const isBroker = isBrokerUser(user);

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
  const homeCopy = isBroker
    ? {
        searchPlaceholder: "주소, 매물 유형 검색",
        recentTitle: "최근 확인한 매물",
        emptyDescription: "주소, 매물 유형, 가격 조건을 다시 확인해보세요.",
      }
    : {
        searchPlaceholder: "지역, 매물 유형 검색",
        recentTitle: "최근 본 매물",
        emptyDescription: "지역, 가격, 방 종류를 다시 검색해보세요.",
      };

  return (
    <main className="home">
      <div className="home__frame">
        <header className="home__header">
          <div className="home__header-top">
            <StayViewLogo />
            {isBroker && (
              <button
                type="button"
                className="home__register-chip"
                onClick={() => navigate("/listing/new")}
                aria-label="매물 등록하기"
              >
                매물 등록
              </button>
            )}
          </div>
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder={homeCopy.searchPlaceholder}
          />
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
                {homeCopy.emptyDescription}
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
                title={isSearching ? `${homeCopy.recentTitle} 검색 결과` : homeCopy.recentTitle}
                listings={filteredRecent}
                hideWhenEmpty={isSearching}
              />
            </>
          )}
        </div>

        <BottomNav active="home" />
      </div>
    </main>
  );
}
