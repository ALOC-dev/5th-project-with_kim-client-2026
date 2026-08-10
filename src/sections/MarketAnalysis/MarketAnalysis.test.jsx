import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { getCachedNeighborhoodPriceStatisticsByCodes } from '../../services';
import MarketAnalysis from './MarketAnalysis';

jest.mock('../../services', () => ({
  getCachedNeighborhoodPriceStatisticsByCodes: jest.fn(),
}));

const statistics = {
  neighborhoodName: '이문동',
  monthlyRentListingCount: 11,
  averageMonthlyDeposit: 5000000,
  averageMonthlyRent: 480000,
  averageMonthlyManagementFee: 50000,
  jeonseListingCount: 7,
  averageJeonseDeposit: 130000000,
  averageJeonseManagementFee: 40000,
  saleListingCount: 3,
  averageSalePrice: 320000000,
  averageSaleManagementFee: 60000,
};

beforeEach(() => {
  getCachedNeighborhoodPriceStatisticsByCodes.mockReset();
  getCachedNeighborhoodPriceStatisticsByCodes.mockResolvedValue(statistics);
});

test('기본 휘경동 코드로 시세를 조회하고 실제 평균 금액을 표시한다', async () => {
  render(<MarketAnalysis />);

  expect(screen.getByLabelText('시세 분석 지역')).toHaveValue('10900');
  await waitFor(() => expect(getCachedNeighborhoodPriceStatisticsByCodes).toHaveBeenCalledWith('11230', '10900'));
  expect(await screen.findByText('보증금 500만원 / 월 48만원')).toBeInTheDocument();
  expect(screen.getByText('13,000만원')).toBeInTheDocument();
  expect(screen.getByText('32,000만원')).toBeInTheDocument();
  expect(screen.getByText('월세 매물 11개')).toBeInTheDocument();
});

test('지역을 바꾸면 해당 읍면동 코드로 다시 조회한다', async () => {
  render(<MarketAnalysis />);
  await screen.findByText('보증금 500만원 / 월 48만원');

  fireEvent.change(screen.getByLabelText('시세 분석 지역'), { target: { value: '10400' } });

  await waitFor(() => expect(getCachedNeighborhoodPriceStatisticsByCodes).toHaveBeenLastCalledWith('11230', '10400'));
});

test('보증금과 매매가는 백만원 단위로, 월세는 만원 단위로 올림한다', async () => {
  getCachedNeighborhoodPriceStatisticsByCodes.mockResolvedValue({
    ...statistics,
    averageMonthlyDeposit: 5000001,
    averageMonthlyRent: 480001,
    averageJeonseDeposit: 112300001,
    averageSalePrice: 321000001,
    averageMonthlyManagementFee: 50001,
  });

  render(<MarketAnalysis />);

  expect(await screen.findByText('보증금 600만원 / 월 49만원')).toBeInTheDocument();
  expect(screen.getByText('11,300만원')).toBeInTheDocument();
  expect(screen.getByText('32,200만원')).toBeInTheDocument();
  expect(screen.getAllByText('평균 관리비 6만원')).toHaveLength(2);
});
