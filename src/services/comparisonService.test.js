import { apiRequest } from './apiClient';
import { getComparedListings } from './comparisonService';

jest.mock('./apiClient', () => ({ apiRequest: jest.fn() }));

test('최대 3개의 houseIds를 반복 쿼리로 보내고 매물 모델로 변환한다', async () => {
  apiRequest.mockResolvedValue([
    { houseId: 3, address: '서울 동대문구 휘경동 1-1', contractType: 'MONTHLY', deposit: 5000000, monthlyRent: 480000, area: 20, floor: 3, direction: 'SOUTH' },
    { houseId: 8, address: '서울 동대문구 전농동 2-2', contractType: 'JEONSE', deposit: 130000000, area: 24, floor: 5, direction: 'EAST' },
  ]);

  const listings = await getComparedListings(['3', 8, 9, 10]);

  expect(apiRequest).toHaveBeenCalledWith('/api/houses/compare?houseIds=3&houseIds=8&houseIds=9');
  expect(listings).toMatchObject([
    { id: '3', dealType: '월세', rent: '48', deposit: '500' },
    { id: '8', dealType: '전세', deposit: '13,000' },
  ]);
});
