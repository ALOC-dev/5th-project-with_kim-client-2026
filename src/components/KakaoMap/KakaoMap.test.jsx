import { act, render, screen, waitFor } from '@testing-library/react';
import {
  default as KakaoMap,
  getListingDisplayStage,
  getListingAreaName,
  getLowestMonthlyRent,
  getMapInputMode,
  getMarkerDisplayMode,
  getMinimumWalkingMinutes,
  getNearestCampusGate,
  groupListingMarkers,
  groupListingMarkersForLevel,
  normalizeFacilityType,
} from './KakaoMap';

function installKakaoMapsHarness(initialLevel = 4) {
  const harness = {
    map: null,
    maps: [],
    markers: [],
    overlays: [],
    polygons: [],
    geocodeRequests: [],
  };

  class FakeLatLng {
    constructor(latitude, longitude) {
      this.latitude = latitude;
      this.longitude = longitude;
    }

    getLat() {
      return this.latitude;
    }

    getLng() {
      return this.longitude;
    }
  }

  class FakeMap {
    constructor(container, options) {
      this.container = container;
      this.center = options.center;
      this.level = initialLevel;
      this.panTo = jest.fn((position) => {
        this.center = position;
      });
      this.setLevel = jest.fn((level) => {
        this.level = level;
      });
      harness.map = this;
      harness.maps.push(this);
    }

    getCenter() {
      return this.center;
    }

    getLevel() {
      return this.level;
    }

    relayout() {}

    setDraggable() {}

    setZoomable() {}
  }

  class FakeMarker {
    constructor(options) {
      this.options = options;
      this.map = null;
      this.listeners = {};
      harness.markers.push(this);
    }

    setMap(map) {
      this.map = map;
    }
  }

  class FakeCustomOverlay {
    constructor(options) {
      this.options = options;
      this.content = options.content;
      this.map = null;
      harness.overlays.push(this);
    }

    setMap(map) {
      this.map = map;
    }
  }

  class FakeCircle {
    setMap(map) {
      this.map = map;
    }
  }

  class FakePolygon {
    constructor(options) {
      this.options = options;
      this.map = null;
      harness.polygons.push(this);
    }

    setMap(map) {
      this.map = map;
    }
  }

  window.kakao = {
    maps: {
      Circle: FakeCircle,
      CustomOverlay: FakeCustomOverlay,
      LatLng: FakeLatLng,
      Map: FakeMap,
      Marker: FakeMarker,
      MarkerImage: class FakeMarkerImage {},
      Point: class FakePoint {},
      Polygon: FakePolygon,
      Size: class FakeSize {},
      event: {
        addListener(target, name, handler) {
          target.listeners = target.listeners || {};
          target.listeners[name] = target.listeners[name] || [];
          target.listeners[name].push(handler);
        },
        removeListener(target, name, handler) {
          target.listeners = target.listeners || {};
          target.listeners[name] = (target.listeners[name] || []).filter((listener) => listener !== handler);
        },
      },
      services: {
        Geocoder: class FakeGeocoder {
          addressSearch(address, callback) {
            harness.geocodeRequests.push({ address, callback });
          }
        },
        Status: { OK: 'OK' },
      },
    },
  };

  return harness;
}

beforeEach(() => {
  process.env.REACT_APP_KAKAO_MAP_APP_KEY = 'test-app-key';
  delete window.kakao;
});

test('주변 시설 유형을 지도 토글에서 사용하는 값으로 정규화한다', () => {
  expect(normalizeFacilityType('편의점')).toBe('CONVENIENCE_STORE');
  expect(normalizeFacilityType('subway')).toBe('SUBWAY');
  expect(normalizeFacilityType('streetlight')).toBe('STREETLIGHT');
});

test('세밀한 포인터 환경을 웹 입력으로 판별한다', () => {
  const desktopMedia = (query) => ({ matches: query === '(pointer: fine)' });
  const touchMedia = (query) => ({ matches: query === '(pointer: coarse)' });

  expect(getMapInputMode({ innerWidth: 430, matchMedia: desktopMedia })).toBe('mouse');
  expect(getMapInputMode({ innerWidth: 430, matchMedia: touchMedia })).toBe('touch');
  expect(getMapInputMode({ innerWidth: 1280, matchMedia: () => ({ matches: false }) })).toBe('mouse');
});

test('모든 지도 확대 수준에서 군집만 노출한다', () => {
  expect(getMarkerDisplayMode(6)).toBe('cluster');
  expect(getMarkerDisplayMode(5)).toBe('cluster');
  expect(getMarkerDisplayMode(4)).toBe('cluster');
  expect(getMarkerDisplayMode(3)).toBe('cluster');
  expect(getMarkerDisplayMode(1)).toBe('cluster');
});

test('지도 레벨을 네 단계 매물 표시로 나눈다', () => {
  expect(getListingDisplayStage(6)).toBe('area-count');
  expect(getListingDisplayStage(5)).toBe('area-count');
  expect(getListingDisplayStage(4)).toBe('area-summary');
  expect(getListingDisplayStage(3)).toBe('block-summary');
  expect(getListingDisplayStage(2)).toBe('building-price');
  expect(getListingDisplayStage(1)).toBe('building-price');
});

test('군집 요약에 월세 최저가와 최소 도보 시간을 사용한다', () => {
  const listings = [
    { dealType: '월세', rent: '47', walkingMinutes: 8 },
    { dealType: '전세', rent: '', walkingMinutes: 5 },
    { dealType: '월세', rent: '38', walkingMinutes: 12 },
  ];

  expect(getLowestMonthlyRent(listings)).toBe(38);
  expect(getMinimumWalkingMinutes(listings)).toBe(5);
});

test('매물 위치에서 가장 가까운 학교 출입구와 예상 도보 시간을 계산한다', () => {
  expect(getNearestCampusGate([{ latitude: 37.5837, longitude: 127.0539 }])).toMatchObject({
    name: '정문',
    walkingMinutes: 1,
  });
  expect(getNearestCampusGate([{ latitude: 37.5852, longitude: 127.0609 }])).toMatchObject({
    name: '후문',
    walkingMinutes: 1,
  });
  expect(getNearestCampusGate([{ latitude: 37.5861, longitude: 127.0570 }])).toMatchObject({
    name: '쪽문',
    walkingMinutes: 1,
  });
});

test('지정된 16개 동만 주소에서 지역명으로 추출한다', () => {
  const allowedAreas = [
    '전농동', '답십리동', '청량리동', '회기동', '휘경동', '이문동', '제기동', '용두동',
    '신설동', '마장동', '사근동', '행당동', '안암동', '종암동', '면목동', '숭인동',
  ];

  allowedAreas.forEach((areaName) => {
    expect(getListingAreaName(`서울특별시 ${areaName} 12-3`)).toBe(areaName);
  });
  expect(getListingAreaName('서울특별시 성북구 길음동 12-3')).toBeNull();
  expect(getListingAreaName('서울특별시 종로구 종로1가 12')).toBeNull();
  expect(getListingAreaName('서울특별시 동대문구 서울시립대로29길 42-4')).toBeNull();
});

test('초기 축소 레벨에서는 거리가 멀어도 같은 동 매물을 하나로 묶는다', () => {
  const groups = [
    { latitude: 37.58, longitude: 127.05, listings: [{ id: 1, address: '서울 동대문구 회기동 1-1' }] },
    { latitude: 37.59, longitude: 127.07, listings: [{ id: 2, address: '서울 동대문구 회기동 99-1' }] },
    { latitude: 37.60, longitude: 127.08, listings: [{ id: 3, address: '서울 동대문구 휘경동 10-1' }] },
  ];

  const clusters = groupListingMarkersForLevel(groups, 4);

  expect(clusters).toHaveLength(2);
  expect(clusters.map((cluster) => cluster.areaName).sort()).toEqual(['회기동', '휘경동']);
  expect(clusters.find((cluster) => cluster.areaName === '회기동').listings).toHaveLength(2);
});

test('동 정보가 없는 초기 매물은 추가 조회 없이 좌표 거리로 묶는다', () => {
  const groups = [
    { latitude: 37.5838, longitude: 127.0587, listings: [{ id: 1, address: '서울시립대로 1' }] },
    { latitude: 37.5842, longitude: 127.0591, listings: [{ id: 2, address: '회기로 2' }] },
  ];

  const clusters = groupListingMarkersForLevel(groups, 4);

  expect(clusters).toHaveLength(1);
  expect(clusters[0].areaName).toBeUndefined();
  expect(clusters[0].listings).toHaveLength(2);
});

test('축소한 지도에서 가까운 건물 마커만 하나의 클러스터로 묶는다', () => {
  const groups = [
    { latitude: 37.5838, longitude: 127.0587, listings: [{ id: 1 }] },
    { latitude: 37.5842, longitude: 127.0591, listings: [{ id: 2 }, { id: 3 }] },
    { latitude: 37.59, longitude: 127.07, listings: [{ id: 4 }] },
  ];

  const clusters = groupListingMarkers(groups, 5);

  expect(clusters).toHaveLength(2);
  expect(clusters.map((cluster) => cluster.listings.length).sort((a, b) => a - b)).toEqual([1, 3]);
  expect(clusters.map((cluster) => cluster.buildingCount).sort((a, b) => a - b)).toEqual([1, 2]);
});

test('동 군집 다음 확대 단계는 큰 블록으로 묶고 더 확대할 때만 나눈다', () => {
  const groups = [
    { latitude: 37.5838, longitude: 127.0587, listings: [{ id: 1 }] },
    { latitude: 37.5843, longitude: 127.0592, listings: [{ id: 2 }] },
  ];

  expect(groupListingMarkers(groups, 3)).toHaveLength(1);
  expect(groupListingMarkers(groups, 1)).toHaveLength(2);
});

test('가까이 확대하면 거리가 가까워도 건물별 그룹을 합치지 않는다', () => {
  const groups = [
    { latitude: 37.5838, longitude: 127.0587, listings: [{ id: 1 }] },
    { latitude: 37.5839, longitude: 127.0588, listings: [{ id: 2 }] },
  ];

  expect(groupListingMarkersForLevel(groups, 2)).toHaveLength(2);
});

test('중간 확대 수준에서는 개별 핀을 만들지 않고 숫자 군집만 보여준다', async () => {
  const harness = installKakaoMapsHarness(4);

  render(
    <KakaoMap
      listings={[{
        id: 1,
        title: '회기 원룸',
        dealType: '월세',
        deposit: '500',
        rent: '45',
        latitude: 37.5838,
        longitude: 127.0587,
      }]}
      facilities={[]}
      onSelect={jest.fn()}
      onSelectBuilding={jest.fn()}
    />,
  );

  await waitFor(() => expect(harness.overlays.some((overlay) => overlay.content?.className?.includes('kakao-map__listing-cluster'))).toBe(true));

  const clusterOverlay = harness.overlays.find((overlay) => overlay.content?.className?.includes('kakao-map__listing-cluster'));

  expect(harness.markers).toHaveLength(0);
  expect(clusterOverlay.content).toHaveTextContent('1');
});

test('초기 축소 화면은 같은 동 매물을 동 이름과 전체 개수만 표시한다', async () => {
  const harness = installKakaoMapsHarness(5);
  const onSelectBuilding = jest.fn();
  const listings = [
    {
      id: 1,
      title: '회기 원룸 A',
      dealType: '월세',
      rent: '38',
      address: '서울 동대문구 회기동 1-1',
      latitude: 37.58,
      longitude: 127.05,
    },
    {
      id: 2,
      title: '회기 원룸 B',
      dealType: '월세',
      rent: '45',
      address: '서울 동대문구 회기동 99-1',
      latitude: 37.59,
      longitude: 127.07,
    },
  ];

  render(
    <KakaoMap
      listings={listings}
      facilities={[]}
      onSelectBuilding={onSelectBuilding}
    />,
  );

  await waitFor(() => expect(harness.overlays.filter((overlay) => (
    overlay.content?.className?.includes('kakao-map__listing-cluster') && overlay.map === harness.map
  ))).toHaveLength(1));

  const clusterOverlay = harness.overlays.find((overlay) => (
    overlay.content?.className?.includes('kakao-map__listing-cluster') && overlay.map === harness.map
  ));
  expect(clusterOverlay.content).toHaveTextContent('회기동 · 2개');
  expect(clusterOverlay.content.children).toHaveLength(1);
  expect(clusterOverlay.content).not.toHaveTextContent('최저');

  clusterOverlay.content.click();

  expect(harness.map.panTo).toHaveBeenCalledWith(clusterOverlay.options.position);
  expect(harness.map.setLevel).toHaveBeenCalledWith(4, { anchor: clusterOverlay.options.position });
  expect(onSelectBuilding).not.toHaveBeenCalled();
});

test('매물 조회 중과 조회 완료 후 0건 상태를 지도 위에서 구분한다', async () => {
  const harness = installKakaoMapsHarness(5);
  const { rerender } = render(
    <KakaoMap listings={[]} facilities={[]} isLoading onSelectBuilding={jest.fn()} />,
  );

  await waitFor(() => expect(harness.maps).toHaveLength(1));
  expect(screen.getByRole('status')).toHaveTextContent('매물 불러오는 중');

  rerender(
    <KakaoMap listings={[]} facilities={[]} isLoading={false} onSelectBuilding={jest.fn()} />,
  );

  expect(screen.getByRole('status')).toHaveTextContent('이 지역에는 매물이 없습니다');
});

test('처음 표시할 지도 마커를 준비하는 동안 로딩 상태를 유지한다', async () => {
  const harness = installKakaoMapsHarness(5);
  const listing = {
    id: 1,
    address: '서울 동대문구 전농동',
  };
  render(
    <KakaoMap listings={[listing]} facilities={[]} isLoading={false} onSelectBuilding={jest.fn()} />,
  );

  await waitFor(() => expect(harness.geocodeRequests).toHaveLength(1));
  expect(screen.getByRole('status')).toHaveTextContent('매물 불러오는 중');

  await act(async () => {
    harness.geocodeRequests[0].callback(
      [{ x: '127.055', y: '37.578' }],
      window.kakao.maps.services.Status.OK,
    );
  });

  await waitFor(() => expect(screen.queryByRole('status')).not.toBeInTheDocument());
});

test('기존 마커가 있으면 백그라운드 매물 조회로 중앙 로딩창을 띄우지 않는다', async () => {
  const harness = installKakaoMapsHarness(5);
  const listing = {
    id: 1,
    address: '서울 동대문구 회기동 1-1',
    latitude: 37.5838,
    longitude: 127.0587,
  };
  const listings = [listing];
  const { rerender } = render(
    <KakaoMap listings={listings} facilities={[]} isLoading={false} onSelectBuilding={jest.fn()} />,
  );

  await waitFor(() => expect(harness.overlays.some((overlay) => (
    overlay.content?.className?.includes('kakao-map__listing-cluster') && overlay.map === harness.map
  ))).toBe(true));
  await waitFor(() => expect(screen.getByText('지도 매물 1/1')).toBeInTheDocument());

  rerender(
    <KakaoMap listings={listings} facilities={[]} isLoading onSelectBuilding={jest.fn()} />,
  );

  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});

test('동 마커를 호버하는 동안만 법정동 영역을 외곽선 없이 강조한다', async () => {
  const harness = installKakaoMapsHarness(5);
  render(
    <KakaoMap
      listings={[{
        id: 1,
        address: '서울 동대문구 전농동 1-1',
        latitude: 37.578,
        longitude: 127.055,
      }]}
      facilities={[]}
      onSelectBuilding={jest.fn()}
    />,
  );

  await waitFor(() => expect(harness.overlays.some((overlay) => (
    overlay.content?.className?.includes('kakao-map__listing-cluster')
  ))).toBe(true));

  const clusterOverlay = harness.overlays.find((overlay) => (
    overlay.content?.className?.includes('kakao-map__listing-cluster')
  ));
  clusterOverlay.content.dispatchEvent(new MouseEvent('mouseenter'));

  expect(harness.polygons.length).toBeGreaterThan(0);
  expect(harness.polygons[0].options).toMatchObject({
    fillColor: '#3182f6',
    strokeWeight: 0,
  });
  expect(harness.polygons[0].map).toBe(harness.map);

  clusterOverlay.content.dispatchEvent(new MouseEvent('mouseleave'));
  expect(harness.polygons[0].map).toBeNull();

  clusterOverlay.content.click();
  expect(harness.map.setLevel).toHaveBeenCalledWith(4, { anchor: clusterOverlay.options.position });
  expect(harness.polygons[0].map).toBeNull();
});

test('한 단계 확대하면 동 이름과 개수 및 가장 가까운 출입구 시간을 표시한다', async () => {
  const harness = installKakaoMapsHarness(4);
  const onSelectBuilding = jest.fn();
  const listing = {
    id: 1,
    title: '회기 원룸',
    dealType: '월세',
    deposit: '500',
    rent: '45',
    address: '서울 동대문구 회기동 1-1',
    latitude: 37.5838,
    longitude: 127.0587,
  };

  render(
    <KakaoMap
      listings={[listing]}
      facilities={[]}
      onSelect={jest.fn()}
      onSelectBuilding={onSelectBuilding}
    />,
  );

  await waitFor(() => expect(harness.overlays.some((overlay) => overlay.content?.className?.includes('kakao-map__listing-cluster'))).toBe(true));

  const clusterOverlay = harness.overlays.find((overlay) => overlay.content?.className?.includes('kakao-map__listing-cluster'));
  expect(clusterOverlay.content).toHaveTextContent('회기동 · 1개');
  expect(clusterOverlay.content).toHaveTextContent('후문 4분');
  clusterOverlay.content.click();

  expect(harness.markers).toHaveLength(0);
  expect(harness.map.setLevel).toHaveBeenCalledWith(3, { anchor: clusterOverlay.options.position });
  expect(onSelectBuilding).not.toHaveBeenCalled();
});

test('두 단계 확대하면 블록 요약을 표시하고 클릭 시 왼쪽 목록을 연다', async () => {
  const harness = installKakaoMapsHarness(3);
  const onSelectBuilding = jest.fn();
  const listing = {
    id: 1,
    dealType: '월세',
    deposit: '500',
    rent: '42',
    walkingMinutes: 7,
    latitude: 37.5838,
    longitude: 127.0587,
  };
  const secondListing = {
    ...listing,
    id: 2,
    rent: '48',
  };
  const listings = [listing, secondListing];

  render(<KakaoMap listings={listings} facilities={[]} onSelectBuilding={onSelectBuilding} />);

  await waitFor(() => expect(harness.overlays.some((overlay) => overlay.content?.className?.includes('kakao-map__listing-cluster'))).toBe(true));
  const clusterOverlay = harness.overlays.find((overlay) => overlay.content?.className?.includes('kakao-map__listing-cluster'));
  expect(clusterOverlay.content).toHaveTextContent('후문 4분');
  expect(clusterOverlay.content).toHaveTextContent('2개');
  expect(clusterOverlay.content).toHaveTextContent('최저 42');

  clusterOverlay.content.click();
  expect(onSelectBuilding).toHaveBeenCalledWith(listings);
  expect(harness.map.setLevel).not.toHaveBeenCalled();
});

test('가까이 확대하면 건물별 가격표를 보여주고 클릭 시 왼쪽 목록을 연다', async () => {
  const harness = installKakaoMapsHarness(2);
  const onSelectBuilding = jest.fn();
  const listing = {
    id: 1,
    dealType: '월세',
    deposit: '500',
    rent: '45',
    latitude: 37.5838,
    longitude: 127.0587,
  };

  render(<KakaoMap listings={[listing]} facilities={[]} onSelectBuilding={onSelectBuilding} />);

  await waitFor(() => expect(harness.overlays.some((overlay) => overlay.content?.className?.includes('kakao-map__listing-cluster'))).toBe(true));
  const clusterOverlay = harness.overlays.find((overlay) => overlay.content?.className?.includes('kakao-map__listing-cluster'));
  expect(clusterOverlay.content).toHaveTextContent('500/45');

  clusterOverlay.content.click();
  expect(onSelectBuilding).toHaveBeenCalledWith([listing]);
  expect(harness.map.setLevel).not.toHaveBeenCalled();
});

test('줌 애니메이션이 끝난 idle 시점에도 군집을 유지한다', async () => {
  const harness = installKakaoMapsHarness(4);

  render(
    <KakaoMap
      listings={[{
        id: 1,
        title: '회기 원룸',
        dealType: '월세',
        deposit: '500',
        rent: '45',
        latitude: 37.5838,
        longitude: 127.0587,
      }]}
      facilities={[]}
      onSelect={jest.fn()}
      onSelectBuilding={jest.fn()}
    />,
  );

  await waitFor(() => expect(harness.overlays.some((overlay) => overlay.content?.className?.includes('kakao-map__listing-cluster'))).toBe(true));

  harness.map.level = 3;
  harness.map.listeners.idle[0]();

  await waitFor(() => expect(harness.overlays.filter((overlay) => (
    overlay.content?.className?.includes('kakao-map__listing-cluster') && overlay.map === harness.map
  ))).toHaveLength(1));
  expect(harness.markers).toHaveLength(0);
});

test('확대와 축소가 끝난 idle 시점에는 검색 중심 변경을 알리지 않는다', async () => {
  const harness = installKakaoMapsHarness(4);
  const onCenterChange = jest.fn();

  render(
    <KakaoMap
      listings={[{
        id: 1,
        title: '회기 원룸',
        dealType: '월세',
        deposit: '500',
        rent: '45',
        latitude: 37.5838,
        longitude: 127.0587,
      }]}
      facilities={[]}
      onSelect={jest.fn()}
      onSelectBuilding={jest.fn()}
      onCenterChange={onCenterChange}
    />,
  );

  await waitFor(() => expect(harness.map.listeners.idle).toHaveLength(1));

  harness.map.level = 3;
  harness.map.listeners.idle[0]();

  expect(onCenterChange).not.toHaveBeenCalled();
});

test('드래그가 끝났을 때만 검색 중심 변경을 알린다', async () => {
  const harness = installKakaoMapsHarness(4);
  const onCenterChange = jest.fn();

  render(
    <KakaoMap
      listings={[]}
      facilities={[]}
      onSelect={jest.fn()}
      onSelectBuilding={jest.fn()}
      onCenterChange={onCenterChange}
    />,
  );

  await waitFor(() => expect(harness.map.listeners.dragend).toHaveLength(1));

  harness.map.center = new window.kakao.maps.LatLng(37.59, 127.06);
  harness.map.listeners.dragend[0]();

  expect(onCenterChange).toHaveBeenCalledWith({ lat: 37.59, lng: 127.06 });
});

test('새 매물의 주소 좌표를 찾는 동안 기존 지도와 마커를 유지한다', async () => {
  const harness = installKakaoMapsHarness(4);
  const initialListing = {
    id: 1,
    title: '회기 원룸',
    dealType: '월세',
    deposit: '500',
    rent: '45',
    latitude: 37.5838,
    longitude: 127.0587,
  };
  const { rerender } = render(
    <KakaoMap
      listings={[initialListing]}
      facilities={[]}
      onSelect={jest.fn()}
      onSelectBuilding={jest.fn()}
    />,
  );

  await waitFor(() => expect(harness.overlays.some((overlay) => (
    overlay.content?.className?.includes('kakao-map__listing-cluster') && overlay.map === harness.map
  ))).toBe(true));

  const originalMap = harness.map;
  const originalCluster = harness.overlays.find((overlay) => (
    overlay.content?.className?.includes('kakao-map__listing-cluster')
  ));

  rerender(
    <KakaoMap
      listings={[{ ...initialListing, id: 2, address: '서울 동대문구 휘경동', latitude: undefined, longitude: undefined }]}
      facilities={[]}
      onSelect={jest.fn()}
      onSelectBuilding={jest.fn()}
    />,
  );

  await waitFor(() => expect(harness.geocodeRequests).toHaveLength(1));

  expect(harness.maps).toHaveLength(1);
  expect(harness.map).toBe(originalMap);
  expect(originalCluster.map).toBe(originalMap);
});
