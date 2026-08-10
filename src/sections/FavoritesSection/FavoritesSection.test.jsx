import { render, screen, waitFor } from '@testing-library/react';
import { buildNeighborhoodPriceSummary, getCachedNeighborhoodPriceStatistics, getComparedListings } from '../../services';
import FavoritesSection from './FavoritesSection';

jest.mock('../../services', () => ({
  buildNeighborhoodPriceSummary: jest.fn(),
  getCachedNeighborhoodPriceStatistics: jest.fn(),
  getComparedListings: jest.fn(),
}));

const listings = [
  { id: '3', title: '휘경동 월세', address: '휘경동 1-1', dealType: '월세', deposit: '500', rent: '48', area: '20㎡', floor: '3층', direction: '남향', maintenance: '월 5만원', reviews: 0, rating: 0, marketDiff: '정보 없음', safetyScore: null, risk: { level: '미확인' }, agent: { name: '정보 없음' } },
  { id: '8', title: '전농동 전세', address: '전농동 2-2', dealType: '전세', deposit: '13,000', rent: null, area: '24㎡', floor: '5층', direction: '동향', maintenance: '월 4만원', reviews: 0, rating: 0, marketDiff: '정보 없음', safetyScore: 7, risk: { level: '주의' }, agent: { name: '정보 없음' } },
];

beforeEach(() => {
  getComparedListings.mockReset();
  getComparedListings.mockResolvedValue(listings);
  getCachedNeighborhoodPriceStatistics.mockReset();
  getCachedNeighborhoodPriceStatistics.mockResolvedValue({ averageMonthlyRent: 480000 });
  buildNeighborhoodPriceSummary.mockReset();
  buildNeighborhoodPriceSummary.mockImplementation((listing) => ({
    differenceLabel: listing.id === '3' ? '-6%' : '-7%',
    marketPriceLabel: listing.id === '3' ? '월 48만원' : '전세 14,000만원',
  }));
});

test('선택한 매물 ID를 비교 API로 조회해 응답 기반 표를 보여준다', async () => {
  render(<FavoritesSection listings={listings} favorites={['3', '8']} compareIds={['3', '8']} registryUploads={{}} onSelect={jest.fn()} onFavorite={jest.fn()} onCompare={jest.fn()} />);

  await waitFor(() => expect(getComparedListings).toHaveBeenCalledWith(['3', '8']));
  expect(await screen.findByRole('heading', { name: '선택 매물 비교' })).toBeInTheDocument();
  expect(screen.getByText('월 5만원')).toBeInTheDocument();
  expect(screen.getByText('24㎡')).toBeInTheDocument();
  expect(screen.getByText('동향')).toBeInTheDocument();
  expect(await screen.findByText('시세 대비 -6%')).toBeInTheDocument();
});

test('한 개만 선택하면 비교 API를 호출하지 않는다', async () => {
  render(<FavoritesSection listings={listings} favorites={['3', '8']} compareIds={['3']} registryUploads={{}} onSelect={jest.fn()} onFavorite={jest.fn()} onCompare={jest.fn()} />);

  expect(getComparedListings).not.toHaveBeenCalled();
  expect(screen.queryByRole('heading', { name: '선택 매물 비교' })).not.toBeInTheDocument();
  expect(await screen.findByText('시세 대비 -6%')).toBeInTheDocument();
});

test('찜한 매물의 주변 시세를 조회해 카드와 비교 표에 표시한다', async () => {
  render(<FavoritesSection listings={listings} favorites={['3', '8']} compareIds={['3', '8']} registryUploads={{}} onSelect={jest.fn()} onFavorite={jest.fn()} onCompare={jest.fn()} />);

  expect(await screen.findByText('시세 대비 -6%')).toBeInTheDocument();
  expect(getCachedNeighborhoodPriceStatistics).toHaveBeenCalledWith('3');
  expect(screen.getByText('인근 시세 월 48만원')).toBeInTheDocument();
  expect(screen.getAllByText('-6%').length).toBeGreaterThan(0);
  expect(screen.getAllByText('월 48만원').length).toBeGreaterThan(0);
});
