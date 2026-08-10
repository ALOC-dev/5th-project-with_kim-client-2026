import { apiRequest } from './apiClient';

const neighborhoodPriceCache = new Map();
const neighborhoodPriceRequests = new Map();

export async function getNeighborhoodPriceStatistics(houseId) {
  return apiRequest(`/api/house-statistics/neighborhood-prices/by-house/${houseId}`);
}

export async function getNeighborhoodPriceStatisticsByCodes(sggCd, emdCd) {
  const params = new URLSearchParams({ sggCd: String(sggCd), emdCd: String(emdCd) });
  return apiRequest(`/api/house-statistics/neighborhood-prices?${params}`);
}

export function getCachedNeighborhoodPriceStatistics(houseId) {
  const key = `house:${houseId}`;
  if (neighborhoodPriceCache.has(key)) return Promise.resolve(neighborhoodPriceCache.get(key));
  if (neighborhoodPriceRequests.has(key)) return neighborhoodPriceRequests.get(key);

  const request = getNeighborhoodPriceStatistics(houseId)
    .then((statistics) => {
      neighborhoodPriceCache.set(key, statistics);
      return statistics;
    })
    .finally(() => neighborhoodPriceRequests.delete(key));

  neighborhoodPriceRequests.set(key, request);
  return request;
}

export function getCachedNeighborhoodPriceStatisticsByCodes(sggCd, emdCd) {
  const key = `area:${sggCd}:${emdCd}`;
  if (neighborhoodPriceCache.has(key)) return Promise.resolve(neighborhoodPriceCache.get(key));
  if (neighborhoodPriceRequests.has(key)) return neighborhoodPriceRequests.get(key);

  const request = getNeighborhoodPriceStatisticsByCodes(sggCd, emdCd)
    .then((statistics) => {
      neighborhoodPriceCache.set(key, statistics);
      return statistics;
    })
    .finally(() => neighborhoodPriceRequests.delete(key));

  neighborhoodPriceRequests.set(key, request);
  return request;
}

export function clearNeighborhoodPriceCache() {
  neighborhoodPriceCache.clear();
  neighborhoodPriceRequests.clear();
}

export function buildNeighborhoodPriceSummary(listing, statistics) {
  const comparison = getComparisonValues(listing, statistics);
  if (!comparison) return null;

  const { currentPrice, averagePrice, marketPrefix, listingCount } = comparison;
  if (!isPositiveNumber(currentPrice) || !isPositiveNumber(averagePrice)) return null;

  const difference = Math.round(((Number(currentPrice) - Number(averagePrice)) / Number(averagePrice)) * 100);
  return {
    differenceLabel: `${difference > 0 ? '+' : ''}${difference}%`,
    marketPriceLabel: `${marketPrefix}${formatWonInManwon(averagePrice)}만원`,
    neighborhoodName: statistics.neighborhoodName || '',
    listingCount: Number(listingCount) || 0,
  };
}

function getComparisonValues(listing, statistics) {
  if (!listing || !statistics) return null;
  if (listing.dealType === '월세') {
    return {
      currentPrice: listing.monthlyRentAmount,
      averagePrice: statistics.averageMonthlyRent,
      marketPrefix: '월 ',
      listingCount: statistics.monthlyRentListingCount,
    };
  }
  if (listing.dealType === '전세') {
    return {
      currentPrice: listing.depositAmount,
      averagePrice: statistics.averageJeonseDeposit,
      marketPrefix: '전세 ',
      listingCount: statistics.jeonseListingCount,
    };
  }
  return null;
}

function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function formatWonInManwon(value) {
  const amount = Number(value) / 10000;
  return amount.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
}
