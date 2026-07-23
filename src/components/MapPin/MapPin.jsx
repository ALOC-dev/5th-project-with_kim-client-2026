import './MapPin.css';

export default function MapPin({ listing, isSelected, onClick }) {
  const price = listing.rent ? `월세 ${listing.deposit}/${listing.rent}` : `전세 ${listing.deposit}`;
  return <button className={`map-pin ${isSelected ? 'map-pin--selected' : ''} ${listing.dealType === '전세' ? 'map-pin--jeonse' : ''}`} style={listing.position} onClick={() => onClick(listing)}><span>{price}</span><i /></button>;
}
