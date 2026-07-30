import { useLayoutEffect, useRef, useState } from 'react';
import RatingStars from '../RatingStars';
import StatusBadge from '../StatusBadge';
import './ReviewCard.css';

export default function ReviewCard({ review, isMine = false, onEdit, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const textRef = useRef(null);
  const textId = `review-${review.id}-text`;
  const textClassName = `review-card__text ${isExpanded ? 'is-expanded' : 'is-collapsed'}`;

  useLayoutEffect(() => {
    const textElement = textRef.current;

    if (!textElement || isExpanded) {
      return undefined;
    }

    const updateOverflowState = () => {
      setCanExpand(textElement.scrollHeight > textElement.clientHeight + 1);
    };

    updateOverflowState();
    window.addEventListener('resize', updateOverflowState);

    return () => {
      window.removeEventListener('resize', updateOverflowState);
    };
  }, [isExpanded, review.text]);

  return <article className={`review-card ${isMine ? 'is-mine' : ''}`}>
    <div className="review-card__head">
      <span className="review-card__avatar">{review.initial}</span>
      <div className="review-card__identity">
        <div className="review-card__name">{review.name}{isMine && <StatusBadge>내 리뷰</StatusBadge>}</div>
        {review.residenceLabel && <span className="review-card__residence">{review.residenceLabel}</span>}
        {!review.residenceLabel && <div className="review-card__rating"><RatingStars rating={review.rating} compact /></div>}
      </div>
      <span className="review-card__date">{review.period}</span>
      {isMine && <div className="review-card__actions"><button type="button" onClick={() => onEdit?.(review)} aria-label="리뷰 수정">수정</button><button type="button" onClick={() => onDelete?.(review)} aria-label="리뷰 삭제">삭제</button></div>}
    </div>
    {review.residenceLabel && <div className="review-card__rating review-card__rating--below"><RatingStars rating={review.rating} compact /></div>}
    <p id={textId} ref={textRef} className={textClassName}>{review.text}</p>
    {canExpand && <button className="review-card__more review-card__more--inline" type="button" aria-expanded={isExpanded} aria-controls={textId} onClick={() => setIsExpanded((expanded) => !expanded)}>{isExpanded ? '접기' : '더 보기'}</button>}
  </article>;
}
