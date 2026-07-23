import { apiRequest } from './apiClient';

export async function getListingReviews(listingId) {
  return apiRequest(`/api/houses/${listingId}/reviews`);
}

export async function createListingReview(listingId, review) {
  return apiRequest(`/api/houses/${listingId}/reviews`, { method: 'POST', body: review });
}
