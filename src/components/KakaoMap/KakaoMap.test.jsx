import { getListingMarkerColor, getListingMarkerToneClass, normalizeFacilityType } from './KakaoMap';

test('월세 매물 마커는 파란색 톤 클래스를 사용한다', () => {
  expect(getListingMarkerToneClass([{ dealType: '월세' }])).toBe('is-monthly');
});

test('전세 매물 마커는 주황색 톤 클래스를 사용한다', () => {
  expect(getListingMarkerToneClass([{ dealType: '전세' }])).toBe('is-jeonse');
});

test('월세와 전세가 섞인 건물 묶음 마커는 월세 톤 클래스를 사용한다', () => {
  expect(getListingMarkerToneClass([{ dealType: '월세' }, { dealType: '전세' }])).toBe('is-monthly');
});

test('전세 매물 집 모양 핀은 주황색을 사용한다', () => {
  expect(getListingMarkerColor([{ dealType: '전세' }])).toBe('#f59e0b');
});

test('주변 시설 유형을 지도 토글에서 사용하는 값으로 정규화한다', () => {
  expect(normalizeFacilityType('편의점')).toBe('CONVENIENCE_STORE');
  expect(normalizeFacilityType('subway')).toBe('SUBWAY');
  expect(normalizeFacilityType('streetlight')).toBe('STREETLIGHT');
});
