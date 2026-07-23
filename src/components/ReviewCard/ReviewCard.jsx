import RatingStars from '../RatingStars';
import StatusBadge from '../StatusBadge';
import './ReviewCard.css';

export default function ReviewCard({ review }) {
  return <article className="review-card"><div className="review-card__head"><span className="review-card__avatar">{review.initial}</span><div><div className="review-card__name">{review.name} <StatusBadge tone="green">실거주 인증</StatusBadge></div><div><RatingStars rating={review.rating} compact /> <span>{review.period}</span></div></div></div><p>{review.text}</p></article>;
}
