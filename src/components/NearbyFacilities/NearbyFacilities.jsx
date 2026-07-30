import './NearbyFacilities.css';

const FACILITY_ITEMS = [
  { key: 'restaurantCount', icon: '🍽️', label: '음식점' },
  { key: 'cafeCount', icon: '☕', label: '카페' },
  { key: 'bankCount', icon: '🏧', label: '은행' },
  { key: 'convenienceStoreCount', icon: '🏪', label: '편의점' },
  { key: 'parkingCount', icon: '🅿️', label: '주차장' },
  { key: 'pharmacyCount', icon: '💊', label: '약국' },
  { key: 'hospitalCount', icon: '🏥', label: '병원' },
  { key: 'subwayCount', icon: '🚇', label: '지하철' },
  { key: 'POCount', icon: '📮', label: '우체국' },
];

function getFacilityCount(metadata, key) {
  const value = Number(metadata?.[key]);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export default function NearbyFacilities({ metadata }) {
  const facilities = FACILITY_ITEMS
    .map((item) => ({ ...item, count: getFacilityCount(metadata, item.key) }))
    .filter((item) => item.count > 0);

  if (!facilities.length) return null;

  return <section className="nearby-facilities">
    <h3>주변 시설</h3>
    <div className="nearby-facilities__grid">
      {facilities.map((facility) => <div className="nearby-facilities__item" key={facility.key} aria-label={`${facility.label} ${facility.count}개`}>
        <span aria-hidden="true">{facility.icon}</span>
        <b>{facility.label} {facility.count}개</b>
      </div>)}
    </div>
  </section>;
}
