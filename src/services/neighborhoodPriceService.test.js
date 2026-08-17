import { apiRequest } from './apiClient';
import {
  buildNeighborhoodPriceSummary,
  clearNeighborhoodPriceCache,
  getCachedNeighborhoodPriceStatisticsByCodes,
  getCachedNeighborhoodPriceStatistics,
} from './neighborhoodPriceService';

jest.mock('./apiClient', () => ({ apiRequest: jest.fn() }));

beforeEach(() => {
  clearNeighborhoodPriceCache();
  apiRequest.mockReset();
});

test('같은 매물의 주변 시세는 한 번만 호출하고 메모리에서 재사용한다', async () => {
  const response = { neighborhoodName: '전농동', averageMonthlyRent: 480000 };
  apiRequest.mockResolvedValue(response);

  await expect(getCachedNeighborhoodPriceStatistics(3)).resolves.toEqual(response);
  await expect(getCachedNeighborhoodPriceStatistics('3')).resolves.toEqual(response);

  expect(apiRequest).toHaveBeenCalledTimes(1);
  expect(apiRequest).toHaveBeenCalledWith('/api/house-statistics/neighborhood-prices/by-house/3');
});

test('시군구와 읍면동 코드로 시세 분석 통계를 조회하고 재사용한다', async () => {
  const response = { neighborhoodName: '이문동', averageMonthlyRent: 480000 };
  apiRequest.mockResolvedValue(response);

  await expect(getCachedNeighborhoodPriceStatisticsByCodes('11230', '11000')).resolves.toEqual(response);
  await expect(getCachedNeighborhoodPriceStatisticsByCodes(11230, 11000)).resolves.toEqual(response);

  expect(apiRequest).toHaveBeenCalledTimes(1);
  expect(apiRequest).toHaveBeenCalledWith('/api/house-statistics/neighborhood-prices?sggCd=11230&emdCd=11000');
});

test('월세 매물은 평균 월 임대료와 비교한 요약을 만든다', () => {
  const summary = buildNeighborhoodPriceSummary(
    { dealType: '월세', monthlyRentAmount: 450000 },
    { neighborhoodName: '전농동', averageMonthlyRent: 480000, monthlyRentListingCount: 12 },
  );

  expect(summary).toEqual({
    differenceLabel: '-6%',
    marketPriceLabel: '월 48만원',
    neighborhoodName: '전농동',
    listingCount: 12,
  });
});

test('전세 매물은 평균 전세 보증금과 비교한 요약을 만든다', () => {
  const summary = buildNeighborhoodPriceSummary(
    { dealType: '전세', depositAmount: 130000000 },
    { neighborhoodName: '휘경동', averageJeonseDeposit: 140000000, jeonseListingCount: 7 },
  );

  expect(summary).toEqual({
    differenceLabel: '-7%',
    marketPriceLabel: '전세 14,000만원',
    neighborhoodName: '휘경동',
    listingCount: 7,
  });
});

test('houseId로 조회한 인근 전세 시세는 만원 미만 소수점을 버린다', () => {
  const summary = buildNeighborhoodPriceSummary(
    { dealType: '전세', depositAmount: 400000000 },
    { neighborhoodName: '휘경동', averageJeonseDeposit: 371217000, jeonseListingCount: 9 },
  );

  expect(summary.marketPriceLabel).toBe('전세 37,121만원');
});
