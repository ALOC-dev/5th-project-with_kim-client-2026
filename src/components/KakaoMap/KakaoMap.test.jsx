import { getListingMarkerColor, getListingMarkerToneClass } from './KakaoMap';

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
