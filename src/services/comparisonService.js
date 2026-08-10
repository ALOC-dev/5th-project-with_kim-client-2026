import { apiRequest } from './apiClient';
import { mapHouseToListing } from './listingService';

const comparisonCache = new Map();

export async function getComparedListings(houseIds = []) {
  const ids = Array.from(new Set(houseIds.map(String))).slice(0, 3);
  if (ids.length < 2) return [];

  const cacheKey = ids.join(',');
  if (comparisonCache.has(cacheKey)) return comparisonCache.get(cacheKey);

  const params = new URLSearchParams();
  ids.forEach((id) => params.append('houseIds', id));

  const request = apiRequest(`/api/houses/compare?${params}`)
    .then((response) => (Array.isArray(response) ? response : []).map(mapHouseToListing))
    .catch((error) => {
      comparisonCache.delete(cacheKey);
      throw error;
    });

  comparisonCache.set(cacheKey, request);
  return request;
}

export function clearComparisonCache() {
  comparisonCache.clear();
}
