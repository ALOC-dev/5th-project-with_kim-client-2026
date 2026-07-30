import { useEffect, useRef, useState } from 'react';
import './KakaoMap.css';

const SDK_ID = 'kakao-map-sdk';
const CAMPUS_CENTER = { lat: 37.5838, lng: 127.0587 };
const CAMPUS_AREA_RADIUS_METERS = 650;
const MARKER_COLORS = {
  monthly: '#3182f6',
  jeonse: '#f59e0b',
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

function createHomeMarker(maps, position, title, markerColor) {
  const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 42 52"><path fill="${markerColor}" d="M21 1C10 1 1 9.9 1 21c0 15.1 20 30 20 30s20-14.9 20-30C41 9.9 32 1 21 1Z"/><circle cx="21" cy="21" r="13" fill="white"/><path d="m13.5 21 7.5-6.2 7.5 6.2v8.2a1.7 1.7 0 0 1-1.7 1.7H15.2a1.7 1.7 0 0 1-1.7-1.7V21Z" fill="none" stroke="${markerColor}" stroke-linejoin="round" stroke-width="2.4"/><path d="M18.5 30.5v-5h5v5" fill="none" stroke="${markerColor}" stroke-linejoin="round" stroke-width="2.4"/></svg>`;
  const image = new maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markerSvg)}`,
    new maps.Size(34, 42),
    { offset: new maps.Point(17, 42) },
  );
  return new maps.Marker({ position, image, title });
}

function getListingPriceLabel(listing) {
  if (listing.dealType === '전세') return `전세 ${listing.deposit}`;
  if (listing.dealType === '월세') return `월세 ${listing.deposit}/${listing.rent}`;
  return `${listing.dealType} ${listing.deposit}`;
}

function getBuildingGroupLabel(listings) {
  const dealTypes = new Set(listings.map((listing) => listing.dealType));
  if (dealTypes.has('월세') && dealTypes.has('전세')) return `전월세 매물 ${listings.length}개`;
  if (dealTypes.has('월세')) return `월세 매물 ${listings.length}개`;
  if (dealTypes.has('전세')) return `전세 매물 ${listings.length}개`;
  if (dealTypes.has('매매')) return `매매 매물 ${listings.length}개`;
  return `매물 ${listings.length}개`;
}

export function getListingMarkerToneClass(listings) {
  const hasMonthly = listings.some((listing) => listing.dealType === '월세');
  const hasJeonse = listings.some((listing) => listing.dealType === '전세');

  return hasJeonse && !hasMonthly ? 'is-jeonse' : 'is-monthly';
}

export function getListingMarkerColor(listings) {
  return getListingMarkerToneClass(listings) === 'is-jeonse' ? MARKER_COLORS.jeonse : MARKER_COLORS.monthly;
}

function createListingPriceOverlay(maps, position, listings, onSelect, onSelectBuilding) {
  const isBuildingGroup = listings.length > 1;
  const listing = listings[0];
  const dealToneClass = getListingMarkerToneClass(listings);
  const element = document.createElement('button');
  element.className = `kakao-map__listing-price ${dealToneClass} ${isBuildingGroup ? 'is-building-group' : ''}`;
  element.type = 'button';
  element.textContent = isBuildingGroup ? getBuildingGroupLabel(listings) : getListingPriceLabel(listing);
  element.addEventListener('click', () => {
    if (isBuildingGroup) onSelectBuilding(listings);
    else onSelect(listing);
  });
  return new maps.CustomOverlay({ position, content: element, xAnchor: 0.5, yAnchor: -0.15, zIndex: 4 });
}

function isWithinCampus(latitude, longitude) {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = ((latitude - CAMPUS_CENTER.lat) * Math.PI) / 180;
  const longitudeDelta = ((longitude - CAMPUS_CENTER.lng) * Math.PI) / 180;
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos((CAMPUS_CENTER.lat * Math.PI) / 180) * Math.cos((latitude * Math.PI) / 180) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= CAMPUS_AREA_RADIUS_METERS;
}

export default function KakaoMap({ listings = [], onSelect, onSelectBuilding }) {
  const containerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const onSelectBuildingRef = useRef(onSelectBuilding);
  const [error, setError] = useState('');
  const [locationWarning, setLocationWarning] = useState('');
  const [displayedCount, setDisplayedCount] = useState(0);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onSelectBuildingRef.current = onSelectBuilding;
  }, [onSelect, onSelectBuilding]);

  useEffect(() => {
    let active = true;
    const markers = [];
    const overlays = [];
    setError('');
    setLocationWarning('');
    setDisplayedCount(0);

    loadKakaoMapSdk()
      .then((maps) => {
        if (!active || !containerRef.current) return;

        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(CAMPUS_CENTER.lat, CAMPUS_CENTER.lng),
          level: 4,
        });
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
        overlays.push(campusArea);
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
        overlays.push(campusLabel);
        const bounds = new maps.LatLngBounds();
        const geocoder = new maps.services.Geocoder();
        const propertyMarkers = [];
        let campusFilterActive = false;
        let campusFilterPinned = false;

        const refreshPropertyMarkers = () => {
          propertyMarkers.forEach(({ marker, overlay, latitude, longitude }) => {
            const isVisible = !campusFilterActive || isWithinCampus(latitude, longitude);
            marker.setMap(isVisible ? map : null);
            overlay.setMap(isVisible ? map : null);
          });
        };
        const setCampusFilter = (nextActive) => {
          campusFilterActive = nextActive;
          campusArea.setMap(nextActive ? map : null);
          campusLabelElement.classList.toggle('is-active', nextActive);
          refreshPropertyMarkers();
        };

        campusLabelElement.addEventListener('mouseenter', () => setCampusFilter(true));
        campusLabelElement.addEventListener('mouseleave', () => {
          if (!campusFilterPinned) setCampusFilter(false);
        });
        campusLabelElement.addEventListener('click', () => {
          campusFilterPinned = !campusFilterPinned;
          setCampusFilter(campusFilterPinned);
        });

        Promise.all(listings.map((listing) => resolveListingPosition(maps, geocoder, listing)))
          .then((resolvedListings) => {
            if (!active) return;

            const locatedListings = resolvedListings.filter(({ latitude, longitude }) => latitude !== null && longitude !== null);
            const missingCount = resolvedListings.length - locatedListings.length;
            const groupedListings = locatedListings.reduce((groups, listing) => {
              const key = listing.listing.buildingId ? `building-${listing.listing.buildingId}` : getCoordinateKey(listing.latitude, listing.longitude);
              const group = groups.get(key) || [];
              group.push(listing);
              groups.set(key, group);
              return groups;
            }, new Map());

            groupedListings.forEach((group) => {
              const [{ latitude, longitude }] = group;
              const buildingListings = group.map(({ listing }) => listing);
              const position = new maps.LatLng(latitude, longitude);
              const marker = createHomeMarker(maps, position, buildingListings[0].title, getListingMarkerColor(buildingListings));
              const handleSelect = () => {
                if (buildingListings.length > 1) onSelectBuildingRef.current(buildingListings);
                else onSelectRef.current(buildingListings[0]);
              };
              maps.event.addListener(marker, 'click', handleSelect);
              const overlay = createListingPriceOverlay(maps, position, buildingListings, onSelectRef.current, onSelectBuildingRef.current);
              markers.push(marker);
              overlays.push(overlay);
              propertyMarkers.push({ marker, overlay, latitude, longitude });
              bounds.extend(position);
            });

            refreshPropertyMarkers();
            setDisplayedCount(locatedListings.length);
            if (missingCount) setLocationWarning(`주소를 찾지 못한 매물 ${missingCount}개는 지도에 표시되지 않았습니다.`);
            if (locatedListings.length > 0) map.setBounds(bounds);
          });
      })
      .catch(() => { if (active) setError('카카오맵을 불러오지 못했습니다. JavaScript 키와 도메인 등록을 확인해 주세요.'); });

    return () => {
      active = false;
      markers.forEach((marker) => marker.setMap(null));
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [listings]);

  return <div className="kakao-map"><div ref={containerRef} className="kakao-map__canvas" />{listings.length > 0 && <span className="kakao-map__count">지도 매물 {displayedCount}/{listings.length}</span>}{locationWarning && <span className="kakao-map__notice">{locationWarning}</span>}{error && <div className="kakao-map__error"><strong>카카오맵 설정 필요</strong><span>{error}</span><code>REACT_APP_KAKAO_MAP_APP_KEY</code></div>}</div>;
}
