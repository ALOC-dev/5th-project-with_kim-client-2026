import './RatingStars.css';

export default function RatingStars({ rating, compact = false }) {
  const fullStars = Math.round(rating);
  return <span className={`rating-stars ${compact ? 'rating-stars--compact' : ''}`} aria-label={`${rating}점`}>{'★'.repeat(fullStars)}{'☆'.repeat(5 - fullStars)}</span>;
}
