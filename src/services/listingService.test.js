import { buildHouseSearchParams, getListingDetail, getListings } from './listingService';

test('loads the first 30 houses through the deployed house search API', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ content: [{ houseId: 1, address: '서울특별시 동대문구 전농동', deposit: 5000000, monthlyRent: 550000, managementFee: 60000, contractType: 'MONTHLY', direction: 'SOUTH', roomNumber: 1, area: 24.2, floor: 3 }] }),
  });

  const listings = await getListings();

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/houses/search?page=0&size=30', expect.objectContaining({ method: 'GET' }));
  expect(listings).toHaveLength(1);
  expect(listings[0]).toMatchObject({ id: '1', dealType: '월세', deposit: '500', rent: '55', area: '24.2㎡', floor: '3층', roomType: '원룸', direction: '남향', maintenance: '월 6만원', features: ['남향'] });
});

test('converts visible filter values into house search query parameters', () => {
  const params = buildHouseSearchParams({
    dealType: '월세', depositLimit: 1000, rentLimit: 60, roomType: '원룸', options: { parking: true },
  });

  expect(params.toString()).toBe('page=0&size=30&contractType=MONTHLY&maxDeposit=10000000&maxMonthlyRent=600000&minRoomNumber=1&maxRoomNumber=1&minParking=1');
});

test('loads a selected listing through its house detail endpoint', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ houseId: 7, address: '서울 동대문구 휘경동 43-12', deposit: 10000000, monthlyRent: 700000, contractType: 'MONTHLY' }),
  });

  const listing = await getListingDetail('7');

  expect(global.fetch).toHaveBeenCalledWith('https://www.sibang.site/api/houses/7', expect.objectContaining({ method: 'GET' }));
  expect(listing).toMatchObject({ id: '7', deposit: '1,000', rent: '70' });
});
