import './MapPin.css';
import { formatMapPrice } from '../../utils/price';

export default function MapPin({ listing, isSelected, onClick }) {
  const price = formatMapPrice(listing);
  const dealToneClass = listing.dealType === '전세' ? 'map-pin--jeonse' : 'map-pin--monthly';
  return <button className={`map-pin ${isSelected ? 'map-pin--selected' : ''} ${dealToneClass}`} style={listing.position} onClick={() => onClick(listing)}><span>{price}</span><i /></button>;
}
