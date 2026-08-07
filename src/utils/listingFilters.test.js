import { matchesListingFilters } from './listingFilters';

const baseFilters = {
  dealType: '전체',
  depositLimit: 3000,
  jeonseLimit: 20000,
  rentLimit: 60,
  roomType: '전체',
  walking: '전체',
  safety: '전체',
  options: { elevator: false, parking: false, cctv: false, pets: false },
};

test('전체 거래 유형에서도 월세 보증금과 전세금을 독립적으로 제한한다', () => {
  const monthlyInRange = { dealType: '월세', deposit: '3,000', rent: '60', roomNumber: 1 };
  const monthlyOverDeposit = { dealType: '월세', deposit: '4,000', rent: '60', roomNumber: 1 };
  const jeonseInRange = { dealType: '전세', deposit: '20,000', rent: null, roomNumber: 1 };
  const jeonseOverLimit = { dealType: '전세', deposit: '25,000', rent: null, roomNumber: 1 };

  expect(matchesListingFilters(monthlyInRange, baseFilters)).toBe(true);
  expect(matchesListingFilters(monthlyOverDeposit, baseFilters)).toBe(false);
  expect(matchesListingFilters(jeonseInRange, baseFilters)).toBe(true);
  expect(matchesListingFilters(jeonseOverLimit, baseFilters)).toBe(false);
});
