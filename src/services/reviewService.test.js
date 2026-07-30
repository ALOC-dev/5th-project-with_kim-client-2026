import { deleteListingReview, getListingReviews, updateListingReview } from './reviewService';

test('loads reviews for the selected house', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => [],
  });

  await getListingReviews(7);

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/houses/7/reviews', expect.objectContaining({ method: 'GET' }));
});

test('creates a review for the selected house', async () => {
  const { createListingReview } = await import('./reviewService');
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: 5 }),
  });

  await createListingReview(7, { cleanlinessRating: 5, managementRating: 4, locationRating: 5, priceRating: 4, text: '채광이 좋아요.' });

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/houses/7/reviews', expect.objectContaining({ method: 'POST', body: JSON.stringify({ cleanlinessRating: 5, managementRating: 4, locationRating: 5, priceRating: 4, text: '채광이 좋아요.' }) }));
});

test('updates my review for the selected house', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ id: 5 }),
  });

  await updateListingReview(7, 5, { cleanlinessRating: 4, managementRating: 4, locationRating: 5, priceRating: 4, text: '수정한 리뷰입니다.' });

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/reviews/5', expect.objectContaining({ method: 'PUT', body: JSON.stringify({ cleanlinessRating: 4, managementRating: 4, locationRating: 5, priceRating: 4, text: '수정한 리뷰입니다.' }) }));
});

test('deletes my review for the selected house', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 204,
    json: async () => null,
  });

  await deleteListingReview(7, 5);

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/reviews/5', expect.objectContaining({ method: 'DELETE' }));
});
