import { renderHook, waitFor } from '@testing-library/react';
import { getCachedListings, readCachedListings } from '../services';
import { useListings } from './useListings';

jest.mock('../services', () => ({
  getCachedListings: jest.fn(),
  readCachedListings: jest.fn(),
}));

beforeEach(() => {
  getCachedListings.mockReset();
  readCachedListings.mockReset();
});

test('renders a cached search result synchronously without loading', () => {
  const filters = { dealType: '전체' };
  const center = { lat: 37.583866, lng: 127.058777 };
  readCachedListings.mockReturnValue([{ id: '1', title: '기억한 매물' }]);

  const { result } = renderHook(() => useListings(filters, center));

  expect(result.current.listings).toEqual([{ id: '1', title: '기억한 매물' }]);
  expect(result.current.isLoading).toBe(false);
  expect(getCachedListings).not.toHaveBeenCalled();
});

test('지도 중심 이동 검색이 빈 결과를 반환해도 기존 매물을 유지한다', async () => {
  getCachedListings
    .mockResolvedValueOnce([{ id: '1', title: '회기 원룸' }])
    .mockResolvedValueOnce([]);

  const filters = { dealType: '전체' };
  const { result, rerender } = renderHook(
    ({ center }) => useListings(filters, center),
    { initialProps: { center: { lat: 37.583866, lng: 127.058777 } } },
  );

  await waitFor(() => expect(result.current.listings).toEqual([{ id: '1', title: '회기 원룸' }]));

  rerender({ center: { lat: 37.59, lng: 127.06 } });

  await waitFor(() => expect(getCachedListings).toHaveBeenCalledTimes(2));

  expect(result.current.listings).toEqual([{ id: '1', title: '회기 원룸' }]);
});

test('지도 중심 이동 검색 결과는 기존 지도 매물과 합쳐서 보여준다', async () => {
  getCachedListings
    .mockResolvedValueOnce([{ id: '1', title: '회기 원룸' }])
    .mockResolvedValueOnce([{ id: '2', title: '휘경 원룸' }]);

  const filters = { dealType: '전체' };
  const { result, rerender } = renderHook(
    ({ center }) => useListings(filters, center),
    { initialProps: { center: { lat: 37.583866, lng: 127.058777 } } },
  );

  await waitFor(() => expect(result.current.listings).toEqual([{ id: '1', title: '회기 원룸' }]));

  rerender({ center: { lat: 37.59, lng: 127.06 } });

  await waitFor(() => expect(result.current.listings).toEqual([
    { id: '1', title: '회기 원룸' },
    { id: '2', title: '휘경 원룸' },
  ]));
});
