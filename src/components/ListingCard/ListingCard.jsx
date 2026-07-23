import RatingStars from '../RatingStars';
import StatusBadge from '../StatusBadge';
import './ListingCard.css';

export default function ListingCard({ listing, isFavorite, isSelected, onSelect, onFavorite, compareSelected, onCompare }) {
  const price = listing.rent ? `보증금 ${listing.deposit} / 월 ${listing.rent}` : `전세 ${listing.deposit}`;
  return (
    <article className={`listing-card ${isSelected ? 'listing-card--selected' : ''}`}>
      <button className="listing-card__photo" onClick={() => onSelect(listing)} aria-label={`${listing.title} 상세 보기`}><span>{listing.title.slice(0, 1)}</span><StatusBadge tone="blue">안전 {listing.safetyScore}</StatusBadge></button>
      <div className="listing-card__body"><div className="listing-card__tags"><StatusBadge tone="green">집주인 인증</StatusBadge><StatusBadge>{listing.dealType}</StatusBadge></div><button className="listing-card__title" onClick={() => onSelect(listing)}>{listing.title}</button><strong>{price}</strong><p>{listing.address} · 도보 {listing.walkingMinutes}분</p><div className="listing-card__meta"><RatingStars rating={listing.rating} compact /><span>리뷰 {listing.reviews}</span><em>시세 대비 {listing.marketDiff}</em></div></div>
      <div className="listing-card__actions">{onCompare && <label><input type="checkbox" checked={compareSelected} onChange={() => onCompare(listing.id)} /> 비교</label>}<button className={isFavorite ? 'listing-card__heart is-active' : 'listing-card__heart'} onClick={() => onFavorite(listing.id)} aria-label="찜하기">♥</button></div>
    </article>
  );
}
