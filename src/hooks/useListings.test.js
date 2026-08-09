import { useLayoutEffect } from 'react';
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { getCachedListingDetail, getCachedListings, readCachedListingDetail, readCachedListings } from '../services';
import { useListingReviews, useListings as useHousingPageListings, useResidenceVerification, useUserPreferences } from '../hooks';
import HousingPage from '../pages/HousingPage/HousingPage';
import { useListings } from './useListings';

jest.mock('../services', () => ({
  applyRegistrySubmissionToListing: jest.fn(),
  buildRegistrySubmissionMetadata: jest.fn(),
  createListingReview: jest.fn(),
  deleteListingReview: jest.fn(),
  findSchoolDistanceByBuildingId: jest.fn(),
  getCachedListingDetail: jest.fn(),
  getCachedListings: jest.fn(),
  getListingDetail: jest.fn(),
  getMyWishList: jest.fn(),
  getSchoolDistances: jest.fn(),
  pollRegistrySubmission: jest.fn(),
  readCachedListingDetail: jest.fn(),
  readCachedListings: jest.fn(),
  shouldRefreshListingAfterRegistrySubmission: jest.fn(),
  toggleFavorite: jest.fn(),
  updateListingReview: jest.fn(),
  uploadRegistryDocument: jest.fn(),
}));

jest.mock('../hooks', () => ({
  canAutoOpenResidenceVerification: jest.fn(() => false),
  useListingReviews: jest.fn(),
  useListings: jest.fn(),
  useResidenceVerification: jest.fn(),
  useUserPreferences: jest.fn(),
}));

jest.mock('../sections/MapExplorer', () => ({
  __esModule: true,
  default: ({ listings, onSelect }) => (
    <div>
      {listings.map((listing) => <button key={listing.id} type="button" onClick={() => onSelect(listing)}>open {listing.id}</button>)}
    </div>
  ),
}));

jest.mock('../sections/ListingPreview/ListingPreview', () => ({
  __esModule: true,
  default: ({ listing }) => <div data-testid="listing-preview">{listing.id}</div>,
}));

beforeEach(() => {
  getCachedListingDetail.mockReset();
  getCachedListings.mockReset();
  readCachedListingDetail.mockReset();
  readCachedListings.mockReset();
  useHousingPageListings.mockReset();
  useListingReviews.mockReset();
  useResidenceVerification.mockReset();
  useUserPreferences.mockReset();
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

test('unchanged filters merge listings when moving between cached centers', () => {
  const filters = { dealType: '전체' };
  const centerA = { lat: 37.58, lng: 127.05 };
  const centerB = { lat: 37.59, lng: 127.06 };
  readCachedListings.mockImplementation((_, center) => center.lat === centerA.lat
    ? [{ id: '1', title: '회기 원룸' }]
    : [{ id: '2', title: '휘경 원룸' }]);

  const { result, rerender } = renderHook(
    ({ center }) => useListings(filters, center),
    { initialProps: { center: centerA } },
  );

  rerender({ center: centerB });

  expect(result.current.listings).toEqual([
    { id: '1', title: '회기 원룸' },
    { id: '2', title: '휘경 원룸' },
  ]);
  expect(getCachedListings).not.toHaveBeenCalled();
});

test('unchanged filters retain accumulated listings for a cached empty center', () => {
  const filters = { dealType: '전체' };
  const centerA = { lat: 37.58, lng: 127.05 };
  const centerB = { lat: 37.59, lng: 127.06 };
  readCachedListings.mockImplementation((_, center) => center.lat === centerA.lat
    ? [{ id: '1', title: '회기 원룸' }]
    : []);

  const { result, rerender } = renderHook(
    ({ center }) => useListings(filters, center),
    { initialProps: { center: centerA } },
  );

  rerender({ center: centerB });

  expect(result.current.listings).toEqual([{ id: '1', title: '회기 원룸' }]);
  expect(getCachedListings).not.toHaveBeenCalled();
});

test('changed filters replace listings when the new filter search is cached', () => {
  const center = { lat: 37.58, lng: 127.05 };
  const monthlyFilters = { dealType: '월세' };
  const jeonseFilters = { dealType: '전세' };
  readCachedListings.mockImplementation((filters) => filters.dealType === '월세'
    ? [{ id: '1', title: '월세 원룸' }]
    : [{ id: '2', title: '전세 원룸' }]);

  const { result, rerender } = renderHook(
    ({ filters }) => useListings(filters, center),
    { initialProps: { filters: monthlyFilters } },
  );

  rerender({ filters: jeonseFilters });

  expect(result.current.listings).toEqual([{ id: '2', title: '전세 원룸' }]);
  expect(getCachedListings).not.toHaveBeenCalled();
});

test('rerendering from a pending miss to a cached search is synchronous', () => {
  const pendingCenter = { lat: 37.58, lng: 127.05 };
  const cachedCenter = { lat: 37.59, lng: 127.06 };
  const filters = { dealType: '전체' };
  const snapshots = [];
  readCachedListings.mockImplementation((_, center) => center.lat === cachedCenter.lat
    ? [{ id: '2', title: '휘경 원룸' }]
    : undefined);
  getCachedListings.mockReturnValue(new Promise(() => {}));

  function CacheTransitionProbe({ center }) {
    const value = useListings(filters, center);
    useLayoutEffect(() => {
      snapshots.push({ center, value });
    }, [center, value]);
    return null;
  }

  const { rerender } = render(<CacheTransitionProbe center={pendingCenter} />);

  rerender(<CacheTransitionProbe center={cachedCenter} />);

  const firstCachedCenterSnapshot = snapshots.find((snapshot) => snapshot.center === cachedCenter);
  expect(firstCachedCenterSnapshot.value.listings).toEqual([{ id: '2', title: '휘경 원룸' }]);
  expect(firstCachedCenterSnapshot.value.isLoading).toBe(false);
  expect(getCachedListings).toHaveBeenCalledTimes(1);
  expect(getCachedListings).toHaveBeenLastCalledWith(filters, pendingCenter);
});

test('clears detail loading when a cached detail follows a pending detail miss', () => {
  const firstListing = { id: '1', title: '첫 매물' };
  const cachedListing = { id: '2', title: '기억한 매물' };
  useHousingPageListings.mockReturnValue({
    listings: [firstListing, cachedListing],
    isLoading: false,
    error: '',
  });
  useListingReviews.mockReturnValue({
    reviews: [], averageRating: 0, isLoading: false, error: '', refetch: jest.fn(),
  });
  useResidenceVerification.mockReturnValue(null);
  useUserPreferences.mockReturnValue({ preferences: {}, savePreferences: jest.fn(), requiredOnboardingMode: null });
  readCachedListingDetail.mockImplementation((listingId) => String(listingId) === '2' ? cachedListing : undefined);
  getCachedListingDetail.mockReturnValue(new Promise(() => {}));

  render(<HousingPage isAuthenticated={false} userId="1" username="사용자" onRequireLogin={jest.fn()} onLogout={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: 'open 1' }));
  expect(screen.getByText('매물 상세 정보를 불러오는 중이에요.')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'open 2' }));

  expect(screen.getByTestId('listing-preview')).toHaveTextContent('2');
  expect(screen.queryByText('매물 상세 정보를 불러오는 중이에요.')).not.toBeInTheDocument();
});
