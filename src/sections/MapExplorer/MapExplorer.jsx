import { useMemo } from 'react';
import KakaoMap from '../../components/KakaoMap/KakaoMap';
import './MapExplorer.css';

export default function MapExplorer({ listings = [], onSelect, onSelectBuilding }) {
  const facilities = useMemo(() => listings.flatMap((listing) => Array.isArray(listing.facilities) ? listing.facilities : []), [listings]);
  return <section className="map-explorer"><KakaoMap listings={listings} facilities={facilities} onSelect={onSelect} onSelectBuilding={onSelectBuilding} /></section>;
}
