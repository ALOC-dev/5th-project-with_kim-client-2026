import { useEffect, useState } from 'react';
import { getListingReviews } from '../services';

const ratingFields = ['cleanlinessRating', 'managementRating', 'locationRating', 'priceRating'];

function maskUsername(username) {
  if (!username) return '익명';
  if (username.length === 1) return `${username}*`;
  if (username.length === 2) return `${username[0]}*`;
  return `${username[0]}*${username.at(-1)}`;
}

function formatCreatedAt(createdAt) {
  if (!createdAt) return '작성일 정보 없음';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '작성일 정보 없음';
  return `${date.getFullYear()}년 작성`;
}

function getReviewUserId(review) {
  const userId = review.userId ?? review.writerId ?? review.memberId ?? review.authorId ?? review.user?.id ?? review.writer?.id ?? review.member?.id;
  return userId === undefined || userId === null ? null : String(userId);
}

function getReviewOwnership(review) {
  return Boolean(review.isMine ?? review.myReview ?? review.mine ?? review.owner ?? review.ownedByMe ?? review.editable);
}

function getFloorLabel(floorType) {
  const labels = {
    LOW: '저층',
    MIDDLE: '중층',
    MID: '중층',
    HIGH: '고층',
    BASEMENT: '반지하',
    ROOFTOP: '옥탑',
  };
  return labels[floorType] || floorType || '';
}

function getResidenceLabel(review) {
  if (review.residenceLabel || review.residenceInfo) return review.residenceLabel || review.residenceInfo;

  const residentLabel = review.currentResident || review.isCurrentResident
    ? '현재 거주자'
    : review.pastResident || review.isPastResident
      ? '이전 거주자'
      : '';
  const floorLabel = getFloorLabel(review.floorType ?? review.floorLevel);
  return [residentLabel, floorLabel].filter(Boolean).join(' / ');
}

export function mapListingReview(review) {
  const ratingValues = Object.fromEntries(ratingFields.map((field) => [field, Number(review[field]) || 0]));
  const ratings = Object.values(ratingValues).filter((value) => value > 0);
  const rating = ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0;
  const name = maskUsername(review.username);
  const imageUrls = [review.imageUrl1, review.imageUrl2, review.imageUrl3].filter(Boolean);

  return {
    id: String(review.id),
    userId: getReviewUserId(review),
    isMine: getReviewOwnership(review),
    ratings: ratingValues,
    initial: name.slice(0, 1),
    name,
    rating,
    text: review.text || '등록된 리뷰 내용이 없습니다.',
    imageUrls,
    residenceLabel: getResidenceLabel(review),
    period: formatCreatedAt(review.createdAt),
  };
}

export function getAverageRating(reviews) {
  if (!reviews.length) return 0;
  return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
}

export function useListingReviews(houseId) {
  const [loadedHouseId, setLoadedHouseId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    if (!houseId) {
      setLoadedHouseId(null);
      setReviews([]);
      setError('');
      return () => { active = false; };
    }

    setIsLoading(true);
    setError('');
    getListingReviews(houseId)
      .then((response) => {
        if (!active) return;
        setReviews((response || []).map(mapListingReview));
        setLoadedHouseId(houseId);
      })
      .catch(() => {
        if (!active) return;
        setReviews([]);
        setLoadedHouseId(houseId);
        setError('리뷰를 불러오지 못했습니다.');
      })
      .finally(() => { if (active) setIsLoading(false); });

    return () => { active = false; };
  }, [houseId, reloadKey]);

  const isCurrentHouse = loadedHouseId === houseId;
  const currentReviews = isCurrentHouse ? reviews : [];
  return { reviews: currentReviews, averageRating: getAverageRating(currentReviews), isLoading: Boolean(houseId) && (!isCurrentHouse || isLoading), error: isCurrentHouse ? error : '', refetch: () => setReloadKey((key) => key + 1) };
}
