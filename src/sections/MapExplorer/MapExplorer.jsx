import KakaoMap from '../../components/KakaoMap/KakaoMap';
import './MapExplorer.css';

export default function MapExplorer({ listings = [], onSelect }) {
  return <section className="map-explorer"><KakaoMap listings={listings} onSelect={onSelect} /></section>;
}
