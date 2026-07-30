import { apiRequest } from './apiClient';

export async function getListingReviews(listingId) {
  return apiRequest(`/api/houses/${listingId}/reviews`);
}

export async function createListingReview(listingId, review) {
  return apiRequest(`/api/houses/${listingId}/reviews`, { method: 'POST', body: review });
}

export async function updateListingReview(listingId, reviewId, review) {
  return apiRequest(`/api/reviews/${reviewId}`, { method: 'PUT', body: review });
}

export async function deleteListingReview(listingId, reviewId) {
  return apiRequest(`/api/reviews/${reviewId}`, { method: 'DELETE' });
}
