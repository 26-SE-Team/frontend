import type { Listing } from "../../types/listing";
import { ListingCard } from "./ListingCard";

interface ListingSectionProps {
  title: string;
  listings: Listing[];
  hideWhenEmpty?: boolean;
}

export function ListingSection({
  title,
  listings,
  hideWhenEmpty = false,
}: ListingSectionProps) {
  if (hideWhenEmpty && listings.length === 0) {
    return null;
  }

  const sectionId = `section-${title.replace(/\s/g, "-")}`;

  return (
    <section className="home-section" aria-labelledby={sectionId}>
      <h2 id={sectionId} className="home-section__title">
        {title}
      </h2>
      {listings.length > 0 ? (
        <div className="home-section__grid">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <p className="home-section__empty">해당 섹션에 검색 결과가 없습니다.</p>
      )}
    </section>
  );
}
