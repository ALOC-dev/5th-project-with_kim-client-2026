import { useMemo } from 'react';
import KakaoMap from '../../components/KakaoMap/KakaoMap';
import './MapExplorer.css';

export default function MapExplorer({ listings = [], isLoading = false, onSelect, onSelectBuilding, onCenterChange }) {
  const facilities = useMemo(() => listings.flatMap((listing) => Array.isArray(listing.facilities) ? listing.facilities : []), [listings]);
  return <section className="map-explorer"><KakaoMap listings={listings} facilities={facilities} isLoading={isLoading} onSelect={onSelect} onSelectBuilding={onSelectBuilding} onCenterChange={onCenterChange} /></section>;
}
