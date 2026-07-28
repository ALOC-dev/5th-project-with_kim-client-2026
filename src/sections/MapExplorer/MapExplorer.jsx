import KakaoMap from '../../components/KakaoMap/KakaoMap';
import './MapExplorer.css';

export default function MapExplorer({ listings = [], onSelect, onSelectBuilding }) {
  return <section className="map-explorer"><KakaoMap listings={listings} onSelect={onSelect} onSelectBuilding={onSelectBuilding} /></section>;
}
