import { useEffect, useRef, useState } from 'react';
import './KakaoMap.css';

const SDK_ID = 'kakao-map-sdk';
const CAMPUS_CENTER = { lat: 37.5838, lng: 127.0587 };
const CAMPUS_AREA_RADIUS_METERS = 650;

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

function createHomeMarker(maps, position, title) {
  const markerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 42 52"><path fill="#3182f6" d="M21 1C10 1 1 9.9 1 21c0 15.1 20 30 20 30s20-14.9 20-30C41 9.9 32 1 21 1Z"/><circle cx="21" cy="21" r="13" fill="white"/><path d="m13.5 21 7.5-6.2 7.5 6.2v8.2a1.7 1.7 0 0 1-1.7 1.7H15.2a1.7 1.7 0 0 1-1.7-1.7V21Z" fill="none" stroke="#3182f6" stroke-linejoin="round" stroke-width="2.4"/><path d="M18.5 30.5v-5h5v5" fill="none" stroke="#3182f6" stroke-linejoin="round" stroke-width="2.4"/></svg>`;
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

function createListingPriceOverlay(maps, position, listing, onSelect) {
  const element = document.createElement('button');
  element.className = `kakao-map__listing-price ${listing.dealType === '전세' ? 'is-jeonse' : ''}`;
  element.type = 'button';
  element.textContent = getListingPriceLabel(listing);
  element.addEventListener('click', () => onSelect(listing));
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

export default function KakaoMap({ listings = [], onSelect }) {
  const containerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  const [error, setError] = useState('');

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  useEffect(() => {
    let active = true;
    const markers = [];
    const overlays = [];

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

        listings.forEach((listing) => {
          geocoder.addressSearch(listing.address, (result, status) => {
            if (!active || status !== maps.services.Status.OK || !result[0]) return;
            const position = new maps.LatLng(result[0].y, result[0].x);
            const marker = createHomeMarker(maps, position, listing.title);
            maps.event.addListener(marker, 'click', () => onSelectRef.current(listing));
            const overlay = createListingPriceOverlay(maps, position, listing, onSelectRef.current);
            markers.push(marker);
            overlays.push(overlay);
            propertyMarkers.push({ marker, overlay, latitude: Number(result[0].y), longitude: Number(result[0].x) });
            refreshPropertyMarkers();
            bounds.extend(position);
            map.setBounds(bounds);
          });
        });
      })
      .catch(() => { if (active) setError('카카오맵을 불러오지 못했습니다. JavaScript 키와 도메인 등록을 확인해 주세요.'); });

    return () => {
      active = false;
      markers.forEach((marker) => marker.setMap(null));
      overlays.forEach((overlay) => overlay.setMap(null));
    };
  }, [listings]);

  return <div className="kakao-map"><div ref={containerRef} className="kakao-map__canvas" />{error && <div className="kakao-map__error"><strong>카카오맵 설정 필요</strong><span>{error}</span><code>REACT_APP_KAKAO_MAP_APP_KEY</code></div>}</div>;
}
