import { getAverageRating, mapListingReview } from './useListingReviews';

test('maps review ratings to a display-friendly average', () => {
  const review = mapListingReview({
    id: 3,
    userId: 7,
    username: '정수민',
    cleanlinessRating: 5,
    managementRating: 4,
    locationRating: 5,
    priceRating: 4,
    text: '채광이 좋아요.',
    createdAt: '2026-07-28T10:00:00',
  });

  expect(review).toMatchObject({ id: '3', userId: '7', name: '정*민', initial: '정', rating: 4.5, text: '채광이 좋아요.' });
  expect(getAverageRating([review, { rating: 3.5 }])).toBe(4);
});

test('maps ownership and residence metadata from the review response', () => {
  const review = mapListingReview({
    id: 4,
    username: '아이유',
    myReview: true,
    currentResident: true,
    floorType: 'LOW',
    createdAt: '2023-09-12T10:00:00',
    cleanlinessRating: 5,
    managementRating: 5,
    locationRating: 5,
    priceRating: 5,
    text: '좋았어요.',
  });

  expect(review).toMatchObject({
    isMine: true,
    name: '아*유',
    initial: '아',
    residenceLabel: '현재 거주자 / 저층',
    period: '2023년 작성',
  });
});
