import { useEffect, useRef, useState } from 'react';
import dongBoundaries from '../../constants/dongBoundaries.json';
import { INFRASTRUCTURE_CATEGORIES } from '../../constants/infrastructures';
import { formatMapPrice } from '../../utils/price';
import './KakaoMap.css';

const SDK_ID = 'kakao-map-sdk';
const CAMPUS_CENTER = { lat: 37.583866, lng: 127.058777 };
const MAX_MAP_LEVEL = 5;
const CAMPUS_AREA_RADIUS_METERS = 1000;
const FACILITY_VISIBLE_MAX_LEVELS = { CCTV: 2, POLICE: 3, SUBWAY: 2 };
const WALKING_METERS_PER_MINUTE = 80;
const POLICE_ACCESS_RADIUS_METERS = 300;
const POLICE_ACCESS_WALKING_MINUTES = Math.ceil(POLICE_ACCESS_RADIUS_METERS / WALKING_METERS_PER_MINUTE);
const CAMPUS_GATES = [
  { name: '정문', latitude: 37.583698, longitude: 127.053856 },
  { name: '후문', latitude: 37.585197, longitude: 127.060951 },
  { name: '쪽문', latitude: 37.5861, longitude: 127.0570 },
];
const FACILITY_TYPE_ALIASES = {
  CCTV: 'CCTV', CAMERA: 'CCTV', CCTVS: 'CCTV', '씨씨티비': 'CCTV',
  POLICE: 'POLICE', POLICE_STATION: 'POLICE', POLICESTATION: 'POLICE', '경찰서': 'POLICE',
  CONVENIENCE: 'CONVENIENCE_STORE', CONVENIENCE_STORE: 'CONVENIENCE_STORE', STORE: 'CONVENIENCE_STORE', '편의점': 'CONVENIENCE_STORE',
  SUBWAY: 'SUBWAY', SUBWAY_STATION: 'SUBWAY', METRO: 'SUBWAY', '지하철': 'SUBWAY', '지하철역': 'SUBWAY',
  STREETLIGHT: 'STREETLIGHT', STREET_LIGHT: 'STREETLIGHT', LAMP: 'STREETLIGHT', '가로등': 'STREETLIGHT',
};

function getCoordinateKey(latitude, longitude) {
  return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

function resolveListingPosition(maps, geocoder, listing) {
  if (Number.isFinite(Number(listing.latitude)) && Number.isFinite(Number(listing.longitude))) {
    return Promise.resolve({
      listing,
      latitude: Number(listing.latitude),
      longitude: Number(listing.longitude),
    });
  }

  return new Promise((resolve) => {
    geocoder.addressSearch(listing.address, (result, status) => {
      if (status !== maps.services.Status.OK || !result[0]) {
        resolve({ listing, latitude: null, longitude: null });
        return;
      }

      resolve({
        listing,
        latitude: Number(result[0].y),
        longitude: Number(result[0].x),
      });
    });
  });
}

export function normalizeFacilityType(value) {
  const normalized = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  return FACILITY_TYPE_ALIASES[normalized] || FACILITY_TYPE_ALIASES[String(value || '').trim()] || null;
}

function normalizeFacility(facility) {
  const type = normalizeFacilityType(facility?.type ?? facility?.category ?? facility?.facilityType ?? facility?.kind);
  if (!type) return null;
  const latitude = Number(facility.latitude ?? facility.lat ?? facility.position?.lat);
  const longitude = Number(facility.longitude ?? facility.lng ?? facility.lon ?? facility.position?.lng);
  return {
    ...facility,
    type,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    address: facility.address || facility.location || '',
    name: facility.name || facility.title || '',
  };
}

function createFacilityMarker(maps, position, facility) {
  const facilityType = INFRASTRUCTURE_CATEGORIES.find((item) => item.key === facility.type) || INFRASTRUCTURE_CATEGORIES[0];
  const element = document.createElement('span');
  element.className = 'kakao-map__facility-marker';
  element.style.setProperty('--facility-color', facilityType.color);
  element.title = facility.name || facilityType.label;
  element.textContent = facilityType.icon;
  return new maps.CustomOverlay({ position, content: element, xAnchor: 0.5, yAnchor: 0.5, zIndex: 3 });
}

function createFocusDimOverlay(maps, map) {
  const element = document.createElement('div');
  element.className = 'kakao-map__focus-dim-overlay';
  const overlay = new maps.CustomOverlay({
    position: map.getCenter(),
    content: element,
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex: 2,
  });
  overlay.setMap(map);
  return overlay;
}

function createPoliceAccessibilityZone(maps, position) {
  return new maps.Circle({
    center: position,
    radius: POLICE_ACCESS_RADIUS_METERS,
    strokeWeight: 1,
    strokeColor: '#2563eb',
    strokeOpacity: 0.5,
    strokeStyle: 'solid',
    fillColor: '#60a5fa',
    fillOpacity: 0.12,
    zIndex: 1,
  });
}

function createPoliceWalkLabel(maps, latitude, longitude) {
  const element = document.createElement('span');
  element.className = 'kakao-map__police-walk-label';
  element.textContent = `경찰서 도보 약 ${POLICE_ACCESS_WALKING_MINUTES}분`;
  const latitudeOffset = POLICE_ACCESS_RADIUS_METERS / 111320;
  return new maps.CustomOverlay({
    position: new maps.LatLng(latitude - latitudeOffset, longitude),
    content: element,
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex: 4,
  });
}

function resolveFacilityPosition(maps, geocoder, facility) {
  if (facility.latitude !== null && facility.longitude !== null) {
    return Promise.resolve({ facility, latitude: facility.latitude, longitude: facility.longitude });
  }
  if (!facility.address) return Promise.resolve({ facility, latitude: null, longitude: null });
  return new Promise((resolve) => {
    geocoder.addressSearch(facility.address, (result, status) => {
      if (status !== maps.services.Status.OK || !result[0]) {
        resolve({ facility, latitude: null, longitude: null });
        return;
      }
      resolve({ facility, latitude: Number(result[0].y), longitude: Number(result[0].x) });
    });
  });
}

function loadKakaoMapSdk() {
  const appKey = process.env.REACT_APP_KAKAO_MAP_APP_KEY;
  if (!appKey) return Promise.reject(new Error('Kakao map app key is missing'));
  if (window.kakao?.maps?.services) return Promise.resolve(window.kakao.maps);

  return new Promise((resolve, reject) => {
    document.getElementById(SDK_ID)?.remove();
    const script = document.createElement('script');
    script.id = SDK_ID;
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao.maps));
    script.onerror = () => reject(new Error('Kakao map SDK failed to load'));
    document.head.appendChild(script);
  });
}

export function getMapInputMode(viewport = typeof window !== 'undefined' ? window : null) {
  if (!viewport) return 'touch';

  const matchesMedia = (query) => viewport.matchMedia?.(query)?.matches === true;
  const hasTouchInput = matchesMedia('(pointer: coarse)')
    || Number(viewport.navigator?.maxTouchPoints || 0) > 0
    || 'ontouchstart' in viewport;

  // Device Mode can keep a fine pointer query while changing the events to touch.
  // Prefer the actual touch capability so the map can be rebuilt for the new event model.
  if (hasTouchInput) return 'touch';

  const hasFinePointer = matchesMedia('(pointer: fine)') || viewport.innerWidth > 760;
  return hasFinePointer ? 'mouse' : 'touch';
}

const CLUSTER_DISTANCE_AT_LEVEL_THREE = 0.0015;
const SUPPORTED_AREA_NAMES = new Set([
  '전농동', '답십리동', '청량리동', '회기동', '휘경동', '이문동', '제기동', '용두동',
  '신설동', '마장동', '사근동', '행당동', '안암동', '종암동', '면목동', '숭인동',
]);

export function getMarkerDisplayMode() {
  return 'cluster';
}

export function getListingDisplayStage(level) {
  const numericLevel = Number(level);
  if (numericLevel >= 5) return 'area-count';
  if (numericLevel === 4) return 'area-summary';
  if (numericLevel === 3) return 'block-summary';
  return 'building-price';
}

function parseListingAmount(value) {
  const amount = Number(String(value ?? '').replaceAll(',', '').trim());
  return Number.isFinite(amount) ? amount : null;
}

export function getLowestMonthlyRent(listings) {
  const monthlyRents = listings
    .filter((listing) => listing.dealType === '월세')
    .map((listing) => parseListingAmount(listing.rent))
    .filter((rent) => rent !== null);
  return monthlyRents.length > 0 ? Math.min(...monthlyRents) : null;
}

export function getMinimumWalkingMinutes(listings) {
  const walkingMinutes = listings
    .map((listing) => Number(listing.walkingMinutes))
    .filter((minutes) => Number.isFinite(minutes) && minutes >= 0);
  return walkingMinutes.length > 0 ? Math.min(...walkingMinutes) : null;
}

function getDistanceMeters(first, second) {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = ((second.latitude - first.latitude) * Math.PI) / 180;
  const longitudeDelta = ((second.longitude - first.longitude) * Math.PI) / 180;
  const firstLatitude = (first.latitude * Math.PI) / 180;
  const secondLatitude = (second.latitude * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function getNearestCampusGate(groups) {
  let nearestGate = null;

  groups.forEach((group) => {
    const latitude = Number(group.latitude);
    const longitude = Number(group.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    CAMPUS_GATES.forEach((gate) => {
      const distanceMeters = getDistanceMeters(
        { latitude, longitude },
        gate,
      );
      if (nearestGate && nearestGate.distanceMeters <= distanceMeters) return;
      nearestGate = {
        name: gate.name,
        distanceMeters,
        walkingMinutes: Math.max(1, Math.ceil(distanceMeters / WALKING_METERS_PER_MINUTE)),
      };
    });
  });

  return nearestGate;
}

export function groupListingMarkers(groups, level) {
  const threshold = CLUSTER_DISTANCE_AT_LEVEL_THREE * (2 ** (Number(level) - 3));
  const clusters = [];

  groups.forEach((group) => {
    const cluster = clusters.find((candidate) => {
      const latitudeScale = Math.cos(((candidate.latitude + group.latitude) / 2) * Math.PI / 180);
      return Math.hypot(
        candidate.latitude - group.latitude,
        (candidate.longitude - group.longitude) * latitudeScale,
      ) <= threshold;
    });

    if (!cluster) {
      clusters.push({
        latitude: group.latitude,
        longitude: group.longitude,
        listings: [...group.listings],
        buildingCount: 1,
        groups: [group],
      });
      return;
    }

    const previousBuildingCount = cluster.buildingCount;
    cluster.latitude = ((cluster.latitude * previousBuildingCount) + group.latitude) / (previousBuildingCount + 1);
    cluster.longitude = ((cluster.longitude * previousBuildingCount) + group.longitude) / (previousBuildingCount + 1);
    cluster.listings.push(...group.listings);
    cluster.groups.push(group);
    cluster.buildingCount += 1;
  });

  return clusters;
}

export function getListingAreaName(address) {
  const tokens = String(address || '').trim().split(/\s+/);
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    if (SUPPORTED_AREA_NAMES.has(tokens[index])) return tokens[index];
  }
  return null;
}

export function groupListingMarkersForLevel(groups, level) {
  const stage = getListingDisplayStage(level);
  if (stage === 'building-price') {
    return groups.map((group) => ({
      ...group,
      buildingCount: 1,
      groups: [group],
    }));
  }
  if (stage === 'block-summary') return groupListingMarkers(groups, level);

  const areaClusters = new Map();
  const coordinateGroups = [];

  groups.forEach((group) => {
    const areaName = group.listings
      .map((listing) => getListingAreaName(listing.address))
      .find(Boolean);

    if (!areaName) {
      coordinateGroups.push(group);
      return;
    }

    const cluster = areaClusters.get(areaName);
    if (!cluster) {
      areaClusters.set(areaName, {
        latitude: group.latitude,
        longitude: group.longitude,
        listings: [...group.listings],
        buildingCount: 1,
        groups: [group],
        areaName,
      });
      return;
    }

    const previousBuildingCount = cluster.buildingCount;
    cluster.latitude = ((cluster.latitude * previousBuildingCount) + group.latitude) / (previousBuildingCount + 1);
    cluster.longitude = ((cluster.longitude * previousBuildingCount) + group.longitude) / (previousBuildingCount + 1);
    cluster.listings.push(...group.listings);
    cluster.groups.push(group);
    cluster.buildingCount += 1;
  });

  return [
    ...areaClusters.values(),
    ...groupListingMarkers(coordinateGroups, level),
  ];
}

function getClusterLabel(listings) {
  return String(listings.length);
}

function formatMarkerAmount(value) {
  const amount = parseListingAmount(value);
  return amount === null ? String(value || '정보 없음') : amount.toLocaleString('ko-KR');
}

function getRentSummary(listings) {
  const lowestMonthlyRent = getLowestMonthlyRent(listings);
  if (lowestMonthlyRent !== null) return `최저 월세 ${formatMarkerAmount(lowestMonthlyRent)}`;
  const jeonseCount = listings.filter((listing) => listing.dealType === '전세').length;
  return jeonseCount > 0 ? `전세 ${jeonseCount}개` : `${listings.length}개`;
}

function getRepresentativeListing(listings) {
  const monthlyListings = listings.filter((listing) => listing.dealType === '월세');
  if (monthlyListings.length > 0) {
    return [...monthlyListings].sort((left, right) => (
      (parseListingAmount(left.rent) ?? Infinity) - (parseListingAmount(right.rent) ?? Infinity)
    ))[0];
  }
  return listings[0];
}

function getBuildingPriceLabel(listings) {
  const representativeListing = getRepresentativeListing(listings);
  if (!representativeListing) return `${listings.length}개`;
  const price = formatMapPrice(representativeListing);
  return listings.length > 1 ? `${listings.length}개 · ${price}~` : price;
}

function appendParts(element, parts) {
  parts.forEach((part, index) => {
    const label = document.createElement(index === 0 ? 'strong' : 'span');
    label.textContent = part;
    element.append(label);
  });
}

function createDongBoundaryPolygons(maps, areaName) {
  return dongBoundaries.features
    .filter((feature) => feature.properties.name === areaName)
    .flatMap((feature) => {
      const polygons = feature.geometry.type === 'MultiPolygon'
        ? feature.geometry.coordinates
        : [feature.geometry.coordinates];
      return polygons.map((polygon) => new maps.Polygon({
        path: polygon.map((ring) => ring.map(([longitude, latitude]) => (
          new maps.LatLng(latitude, longitude)
        ))),
        strokeWeight: 0,
        fillColor: '#3182f6',
        fillOpacity: 0.2,
      }));
    });
}

function createListingClusterOverlay(maps, position, cluster, stage, onSelect, onPreviewStart, onPreviewEnd) {
  const element = document.createElement('button');
  element.className = `kakao-map__listing-cluster is-${stage}`;
  element.type = 'button';
  if (stage === 'area-count') appendParts(element, [`${cluster.areaName || '기타'} · ${getClusterLabel(cluster.listings)}개`]);
  const nearestGate = getNearestCampusGate(cluster.groups || [cluster]);
  const nearestGateLabel = nearestGate ? `최소 ${nearestGate.name} ${nearestGate.walkingMinutes}분` : '거리 정보 없음';
  if (stage === 'area-summary') {
    appendParts(element, [`${cluster.areaName || '기타'} · ${getClusterLabel(cluster.listings)}개`, nearestGateLabel]);
  }
  if (stage === 'block-summary') {
    const blockLabel = cluster.listings.length > 1
      ? `${nearestGateLabel} · ${cluster.listings.length}개`
      : nearestGateLabel;
    appendParts(element, [blockLabel, getRentSummary(cluster.listings)]);
  }
  if (stage === 'building-price') {
    const representativeListing = getRepresentativeListing(cluster.listings);
    element.textContent = getBuildingPriceLabel(cluster.listings);
    if (representativeListing?.dealType === '전세') element.classList.add('is-jeonse');
    if (cluster.listings.length > 1) element.classList.add('is-multiple');
  }
  element.setAttribute('aria-label', `${cluster.areaName ? `${cluster.areaName}, ` : ''}${cluster.buildingCount}개 건물, 매물 ${cluster.listings.length}개`);
  element.addEventListener('click', onSelect);
  if (cluster.areaName) {
    element.addEventListener('mouseenter', onPreviewStart);
    element.addEventListener('mouseleave', onPreviewEnd);
  }
  return new maps.CustomOverlay({ position, content: element, xAnchor: 0.5, yAnchor: 0.5, zIndex: 5 });
}

function isWithinCampus(latitude, longitude) {
  return getDistanceMeters(
    { latitude: CAMPUS_CENTER.lat, longitude: CAMPUS_CENTER.lng },
    { latitude, longitude },
  ) <= CAMPUS_AREA_RADIUS_METERS;
}

function createEmptyPropertyLayer() {
  return {
    propertyMarkers: [],
    clusterOverlays: [],
  };
}

function hidePropertyLayer(layer) {
  layer?.clusterOverlays.forEach((overlay) => overlay.setMap(null));
}

function hideFacilityMarkers(markerGroups) {
  markerGroups?.forEach((markers) => markers.forEach((marker) => marker.setMap(null)));
}

function syncFacilityMarkerVisibility(markerGroups, map, activeFacilityType) {
  const mapLevel = map?.getLevel?.() ?? Infinity;
  markerGroups?.forEach((markers, type) => {
    const maxVisibleLevel = FACILITY_VISIBLE_MAX_LEVELS[type] ?? 2;
    markers.forEach((marker) => marker.setMap(mapLevel <= maxVisibleLevel && type === activeFacilityType ? map : null));
  });
}

export default function KakaoMap({ listings = [], facilities = [], isLoading = false, onSelectBuilding, onCenterChange, onFacilityTypeChange }) {
  const containerRef = useRef(null);
  const onSelectBuildingRef = useRef(onSelectBuilding);
  const onCenterChangeRef = useRef(onCenterChange);
  const mapRef = useRef(null);
  const mapsRef = useRef(null);
  const geocoderRef = useRef(null);
  const preservedCenterRef = useRef(CAMPUS_CENTER);
  const preservedLevelRef = useRef(5);
  const propertyLayerRef = useRef(createEmptyPropertyLayer());
  const refreshPropertyMarkersRef = useRef(() => {});
  const facilityMarkerGroupsRef = useRef(new Map());
  const [error, setError] = useState('');
  const [displayedCount, setDisplayedCount] = useState(0);
  const [mapReadyVersion, setMapReadyVersion] = useState(0);
  const [currentMapLevel, setCurrentMapLevel] = useState(5);
  const [isMapZooming, setIsMapZooming] = useState(false);
  const [isPropertyLayerLoading, setIsPropertyLayerLoading] = useState(false);
  const [activeFacilityType, setActiveFacilityType] = useState(null);
  const [inputMode, setInputMode] = useState(() => getMapInputMode());
  const activeFacilityTypeRef = useRef(activeFacilityType);
  const isMapZoomingRef = useRef(false);

  useEffect(() => {
    const updateInputMode = () => setInputMode(getMapInputMode());
    const pointerQueries = [
      window.matchMedia?.('(pointer: fine)'),
      window.matchMedia?.('(pointer: coarse)'),
    ].filter(Boolean);
    const visualViewport = window.visualViewport;

    updateInputMode();
    pointerQueries.forEach((query) => {
      if (query.addEventListener) query.addEventListener('change', updateInputMode);
      else query.addListener?.(updateInputMode);
    });
    window.addEventListener('resize', updateInputMode);
    window.addEventListener('orientationchange', updateInputMode);
    visualViewport?.addEventListener('resize', updateInputMode);

    return () => {
      pointerQueries.forEach((query) => {
        if (query.removeEventListener) query.removeEventListener('change', updateInputMode);
        else query.removeListener?.(updateInputMode);
      });
      window.removeEventListener('resize', updateInputMode);
      window.removeEventListener('orientationchange', updateInputMode);
      visualViewport?.removeEventListener('resize', updateInputMode);
    };
  }, []);

  useEffect(() => {
    onSelectBuildingRef.current = onSelectBuilding;
    onCenterChangeRef.current = onCenterChange;
  }, [onSelectBuilding, onCenterChange]);

  useEffect(() => {
    activeFacilityTypeRef.current = activeFacilityType;
    syncFacilityMarkerVisibility(facilityMarkerGroupsRef.current, mapRef.current, activeFacilityType);
  }, [activeFacilityType]);

  useEffect(() => {
    let active = true;
    const mapOverlays = [];
    let selectedAreaPolygons = [];
    let disposeMapResize = () => {};
    setError('');
    setDisplayedCount(0);

    loadKakaoMapSdk()
      .then((maps) => {
        if (!active || !containerRef.current) return;

        // Kakao Maps has no public destroy method, so remove the previous map DOM before rebuilding it.
        containerRef.current.replaceChildren();
        const preservedCenter = preservedCenterRef.current;
        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(preservedCenter.lat, preservedCenter.lng),
          draggable: true,
          level: Math.min(preservedLevelRef.current, MAX_MAP_LEVEL),
        });
        mapRef.current = map;
        mapsRef.current = maps;
        map.setMaxLevel?.(MAX_MAP_LEVEL);
        setCurrentMapLevel(map.getLevel?.() ?? 5);
        const focusDimOverlay = createFocusDimOverlay(maps, map);
        mapOverlays.push(focusDimOverlay);
        const geocoder = new maps.services.Geocoder();
        geocoderRef.current = geocoder;
        map.setDraggable?.(true);

        const getCurrentMapCenter = () => {
          const center = map.getCenter();
          return {
            lat: Number(center.getLat().toFixed(6)),
            lng: Number(center.getLng().toFixed(6)),
          };
        };

        const handleMapIdle = () => {
          const nextCenter = getCurrentMapCenter();
          preservedCenterRef.current = nextCenter;
          preservedLevelRef.current = map.getLevel?.() ?? preservedLevelRef.current;
          focusDimOverlay.setPosition?.(map.getCenter());
          refreshPropertyMarkersRef.current();
          if (isMapZoomingRef.current) {
            isMapZoomingRef.current = false;
            setIsMapZooming(false);
          }
        };
        const handleMapDragEnd = () => {
          const nextCenter = getCurrentMapCenter();
          preservedCenterRef.current = nextCenter;
          onCenterChangeRef.current?.(nextCenter);
        };
        maps.event.addListener(map, 'idle', handleMapIdle);
        maps.event.addListener(map, 'dragend', handleMapDragEnd);

        const mapCanvas = containerRef.current;
        const relayoutMap = () => {
          map.relayout();
          map.setDraggable?.(true);
          map.setZoomable?.(true);
        };
        const handlePointerDown = (event) => {
          if (event.pointerType === 'mouse' || event.type === 'mousedown') {
            mapCanvas.classList.add('is-mouse-input', 'is-dragging');
          } else {
            mapCanvas.classList.remove('is-mouse-input', 'is-dragging');
          }
        };
        const handlePointerUp = () => mapCanvas.classList.remove('is-dragging');
        const handlePointerCancel = () => mapCanvas.classList.remove('is-dragging');
        mapCanvas.addEventListener('pointerdown', handlePointerDown);
        mapCanvas.addEventListener('mousedown', handlePointerDown);
        mapCanvas.addEventListener('pointercancel', handlePointerCancel);
        window.addEventListener('pointerup', handlePointerUp, { passive: true });
        window.addEventListener('mouseup', handlePointerUp, { passive: true });
        const resizeObserver = typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(relayoutMap)
          : null;
        resizeObserver?.observe(containerRef.current);
        window.addEventListener('resize', relayoutMap);
        disposeMapResize = () => {
          resizeObserver?.disconnect();
          window.removeEventListener('resize', relayoutMap);
          mapCanvas.removeEventListener('pointerdown', handlePointerDown);
          mapCanvas.removeEventListener('mousedown', handlePointerDown);
          mapCanvas.removeEventListener('pointercancel', handlePointerCancel);
          window.removeEventListener('pointerup', handlePointerUp);
          window.removeEventListener('mouseup', handlePointerUp);
          maps.event.removeListener(map, 'idle', handleMapIdle);
          maps.event.removeListener(map, 'dragend', handleMapDragEnd);
        };

        const campusCenter = new maps.LatLng(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng);
        const campusArea = new maps.Circle({
          center: campusCenter,
          radius: CAMPUS_AREA_RADIUS_METERS,
          strokeWeight: 2,
          strokeColor: '#1b73e8',
          strokeOpacity: 0.85,
          strokeStyle: 'solid',
          fillColor: '#5c9ff8',
          fillOpacity: 0.18,
        });
        mapOverlays.push(campusArea);
        const campusLabelElement = document.createElement('button');
        campusLabelElement.className = 'kakao-map__campus-filter';
        campusLabelElement.type = 'button';
        campusLabelElement.innerHTML = '<b>서울시립대학교</b><span>주변 매물 보기</span>';
        const campusLabel = new maps.CustomOverlay({
          position: campusCenter,
          content: campusLabelElement,
          yAnchor: 1.4,
        });
        campusLabel.setMap(map);
        mapOverlays.push(campusLabel);
        let campusFilterActive = false;
        let campusFilterPinned = false;
        const showAreaBoundary = (areaName) => {
          selectedAreaPolygons.forEach((polygon) => polygon.setMap(null));
          selectedAreaPolygons = areaName ? createDongBoundaryPolygons(maps, areaName) : [];
          selectedAreaPolygons.forEach((polygon) => polygon.setMap(map));
        };

        refreshPropertyMarkersRef.current = () => {
          const layer = propertyLayerRef.current;
          showAreaBoundary(null);
          layer.clusterOverlays.forEach((overlay) => overlay.setMap(null));
          layer.clusterOverlays = [];

          const visibleMarkers = layer.propertyMarkers.filter(({ latitude, longitude }) => (
            !campusFilterActive || isWithinCampus(latitude, longitude)
          ));
          const level = map.getLevel?.() ?? 5;
          const displayStage = getListingDisplayStage(level);
          const groups = visibleMarkers.map(({ latitude, longitude, listings }) => ({
            latitude,
            longitude,
            listings,
          }));

          groupListingMarkersForLevel(groups, level).forEach((cluster) => {
            const position = new maps.LatLng(cluster.latitude, cluster.longitude);
            const handleClusterSelect = () => {
              const nextLevelByStage = {
                'area-count': 4,
                'area-summary': 3,
              };
              const nextLevel = nextLevelByStage[displayStage];
              if (nextLevel) {
                showAreaBoundary(null);
                map.panTo?.(position);
                map.setLevel?.(nextLevel, { anchor: position });
                return;
              }
              onSelectBuildingRef.current?.(cluster.listings);
            };
            const clusterOverlay = createListingClusterOverlay(
              maps,
              position,
              cluster,
              displayStage,
              handleClusterSelect,
              () => showAreaBoundary(cluster.areaName),
              () => showAreaBoundary(null),
            );
            clusterOverlay.setMap(map);
            layer.clusterOverlays.push(clusterOverlay);
          });
        };

        const handleMapZoomStart = () => {
          isMapZoomingRef.current = true;
          setIsMapZooming(true);
        };
        const handleMapZoomChanged = () => {
          preservedLevelRef.current = map.getLevel?.() ?? preservedLevelRef.current;
          setCurrentMapLevel(preservedLevelRef.current);
          refreshPropertyMarkersRef.current();
          syncFacilityMarkerVisibility(facilityMarkerGroupsRef.current, map, activeFacilityTypeRef.current);
        };
        maps.event.addListener(map, 'zoom_start', handleMapZoomStart);
        maps.event.addListener(map, 'zoom_changed', handleMapZoomChanged);
        const previousDisposeMapResize = disposeMapResize;
        disposeMapResize = () => {
          previousDisposeMapResize();
          maps.event.removeListener(map, 'zoom_start', handleMapZoomStart);
          maps.event.removeListener(map, 'zoom_changed', handleMapZoomChanged);
        };
        const setCampusFilter = (nextActive) => {
          campusFilterActive = nextActive;
          campusArea.setMap(nextActive ? map : null);
          campusLabelElement.classList.toggle('is-active', nextActive);
          refreshPropertyMarkersRef.current();
        };

        campusLabelElement.addEventListener('mouseenter', () => setCampusFilter(true));
        campusLabelElement.addEventListener('mouseleave', () => {
          if (!campusFilterPinned) setCampusFilter(false);
        });
        campusLabelElement.addEventListener('click', () => {
          campusFilterPinned = !campusFilterPinned;
          setCampusFilter(campusFilterPinned);
        });
        setMapReadyVersion((version) => version + 1);
      })
      .catch(() => { if (active) setError('카카오맵을 불러오지 못했습니다. JavaScript 키와 도메인 등록을 확인해 주세요.'); });

    return () => {
      active = false;
      disposeMapResize();
      hidePropertyLayer(propertyLayerRef.current);
      hideFacilityMarkers(facilityMarkerGroupsRef.current);
      selectedAreaPolygons.forEach((polygon) => polygon.setMap(null));
      mapOverlays.forEach((overlay) => overlay.setMap(null));
      if (mapRef.current) mapRef.current = null;
      mapsRef.current = null;
      geocoderRef.current = null;
      propertyLayerRef.current = createEmptyPropertyLayer();
      refreshPropertyMarkersRef.current = () => {};
      facilityMarkerGroupsRef.current = new Map();
      isMapZoomingRef.current = false;
    };
  }, [inputMode]);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    const geocoder = geocoderRef.current;
    if (!maps || !map || !geocoder) return undefined;

    let active = true;
    setIsPropertyLayerLoading(listings.length > 0);
    Promise.all(listings.map((listing) => resolveListingPosition(maps, geocoder, listing)))
      .then((resolvedListings) => {
        if (!active || mapRef.current !== map) return;

        const locatedListings = resolvedListings.filter(({ latitude, longitude }) => latitude !== null && longitude !== null);
        if (listings.length > 0 && locatedListings.length === 0) return;

        const groupedListings = locatedListings.reduce((groups, listing) => {
          const key = listing.listing.buildingId ? `building-${listing.listing.buildingId}` : getCoordinateKey(listing.latitude, listing.longitude);
          const group = groups.get(key) || [];
          group.push(listing);
          groups.set(key, group);
          return groups;
        }, new Map());
        const nextLayer = createEmptyPropertyLayer();

        groupedListings.forEach((group) => {
          const [{ latitude, longitude }] = group;
          nextLayer.propertyMarkers.push({
            position: new maps.LatLng(latitude, longitude),
            latitude,
            longitude,
            listings: group.map(({ listing }) => listing),
          });
        });

        const previousLayer = propertyLayerRef.current;
        propertyLayerRef.current = nextLayer;
        refreshPropertyMarkersRef.current();
        hidePropertyLayer(previousLayer);
        setDisplayedCount(locatedListings.length);
      })
      .finally(() => {
        if (active && mapRef.current === map) setIsPropertyLayerLoading(false);
      });

    return () => { active = false; };
  }, [listings, mapReadyVersion]);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    const geocoder = geocoderRef.current;
    if (!maps || !map || !geocoder) return undefined;

    let active = true;
    const normalizedFacilities = facilities.map(normalizeFacility).filter(Boolean);
    Promise.all(normalizedFacilities.map((facility) => resolveFacilityPosition(maps, geocoder, facility)))
      .then((resolvedFacilities) => {
        if (!active || mapRef.current !== map) return;

        const nextMarkerGroups = new Map();
        const coordinates = new Set();
        resolvedFacilities
          .filter(({ latitude, longitude }) => latitude !== null && longitude !== null)
          .forEach(({ facility, latitude, longitude }) => {
            const coordinateKey = `${facility.type}-${getCoordinateKey(latitude, longitude)}`;
            if (coordinates.has(coordinateKey)) return;
            coordinates.add(coordinateKey);
            const marker = createFacilityMarker(maps, new maps.LatLng(latitude, longitude), facility);
            const markersForType = nextMarkerGroups.get(facility.type) || [];
            if (facility.type === 'POLICE') {
              markersForType.push(createPoliceAccessibilityZone(maps, new maps.LatLng(latitude, longitude)));
              markersForType.push(createPoliceWalkLabel(maps, latitude, longitude));
            }
            markersForType.push(marker);
            nextMarkerGroups.set(facility.type, markersForType);
          });

        const previousMarkerGroups = facilityMarkerGroupsRef.current;
        facilityMarkerGroupsRef.current = nextMarkerGroups;
        syncFacilityMarkerVisibility(nextMarkerGroups, map, activeFacilityTypeRef.current);
        hideFacilityMarkers(previousMarkerGroups);
      });

    return () => { active = false; };
  }, [facilities, mapReadyVersion]);

  const isListingStateLoading = displayedCount === 0 && (
    isLoading
    || (listings.length > 0 && (mapReadyVersion === 0 || isPropertyLayerLoading))
  );
  const listingStateMessage = isListingStateLoading
    ? '매물 불러오는 중'
    : listings.length === 0
      ? '이 지역에는 매물이 없습니다'
      : '';
  const handleFacilityTypeSelect = (facilityType) => {
    const nextFacilityType = activeFacilityType === facilityType ? null : facilityType;
    setActiveFacilityType(nextFacilityType);
    onFacilityTypeChange?.(nextFacilityType);
  };
  const activeFacilityMaxLevel = FACILITY_VISIBLE_MAX_LEVELS[activeFacilityType] ?? -1;
  const isFacilityFocusMode = Boolean(activeFacilityType) && currentMapLevel <= activeFacilityMaxLevel;
  const mapClassName = [
    'kakao-map',
    isFacilityFocusMode ? 'is-facility-focus' : '',
    isFacilityFocusMode ? `is-focus-${activeFacilityType.toLowerCase()}` : '',
    isMapZooming ? 'is-map-zooming' : '',
  ].filter(Boolean).join(' ');

  return <div className={mapClassName}><div ref={containerRef} className={`kakao-map__canvas ${inputMode === 'mouse' ? 'is-mouse-input' : ''}`} /><div className="kakao-map__zoom-dim" aria-hidden="true" /><div className="kakao-map__facility-controls" aria-label="주변 시설 필터">{INFRASTRUCTURE_CATEGORIES.map((facility) => <button key={facility.key} type="button" className={activeFacilityType === facility.key ? 'is-active' : ''} aria-pressed={activeFacilityType === facility.key} disabled={!facility.enabled} title={facility.enabled ? `${facility.label} 표시` : `${facility.label} 준비 중`} onClick={() => handleFacilityTypeSelect(facility.key)}><span>{facility.icon}</span>{facility.label}</button>)}</div>{activeFacilityType === 'CCTV' && currentMapLevel <= FACILITY_VISIBLE_MAX_LEVELS.CCTV && <span className="kakao-map__facility-legend"><i aria-hidden="true" />CCTV 위치 강조</span>}{activeFacilityType === 'POLICE' && currentMapLevel <= FACILITY_VISIBLE_MAX_LEVELS.POLICE && <span className="kakao-map__facility-legend is-police"><i aria-hidden="true" />경찰서 접근권 · 약 {POLICE_ACCESS_WALKING_MINUTES}분</span>}{listings.length > 0 && <span className="kakao-map__count">지도 매물 {displayedCount}/{listings.length}</span>}{listingStateMessage && <div className="kakao-map__listing-state" role="status">{isListingStateLoading && <span className="kakao-map__spinner" aria-hidden="true" />}<b>{listingStateMessage}</b>{!isListingStateLoading && <small>지도를 이동하거나 필터를 변경해 보세요.</small>}</div>}{error && <div className="kakao-map__error"><strong>카카오맵 설정 필요</strong><span>{error}</span><code>REACT_APP_KAKAO_MAP_APP_KEY</code></div>}</div>;
}
