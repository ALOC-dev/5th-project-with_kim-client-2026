import { getMapCenterDistanceMeters, shouldUpdateMapSearchCenter } from './mapCenter';

test('확대와 축소로 생기는 작은 중심 좌표 변화는 같은 검색 영역으로 본다', () => {
  const currentCenter = { lat: 37.583866, lng: 127.058777 };
  const slightlyMovedCenter = { lat: 37.5842, lng: 127.0591 };

  expect(getMapCenterDistanceMeters(currentCenter, slightlyMovedCenter)).toBeLessThan(250);
  expect(shouldUpdateMapSearchCenter(currentCenter, slightlyMovedCenter)).toBe(false);
});

test('사용자가 지도를 충분히 이동하면 새 검색 중심으로 본다', () => {
  const currentCenter = { lat: 37.583866, lng: 127.058777 };
  const movedCenter = { lat: 37.589, lng: 127.066 };

  expect(getMapCenterDistanceMeters(currentCenter, movedCenter)).toBeGreaterThan(250);
  expect(shouldUpdateMapSearchCenter(currentCenter, movedCenter)).toBe(true);
});
