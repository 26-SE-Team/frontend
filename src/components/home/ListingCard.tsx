import type { Listing } from "../../types/listing";
import { Link } from "react-router-dom";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link to={`/listing/${listing.id}`} className="home-card">
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
    </Link>
  );
}
