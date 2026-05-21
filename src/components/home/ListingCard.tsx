import type { Listing } from "../../types/listing";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <article className="home-card">
      <div className="home-card__image-wrap">
        <img
          src={listing.imageUrl}
          alt={`${listing.type} 매물`}
          className="home-card__image"
          loading="lazy"
        />
      </div>
      <p className="home-card__price">{listing.price}</p>
      <p className="home-card__type">{listing.type}</p>
      <p className="home-card__info">{listing.info}</p>
    </article>
  );
}
