import { useRef, useState } from 'react';
import Icon from '../../components/Icon';
import StatusBadge from '../../components/StatusBadge';
import { formatListingPrice } from '../../utils/price';
import './BuildingListingsPanel.css';
import './BuildingListingsPanelBack.css';
import './BuildingListingsPanelDrag.css';

function ListingThumbnail({ listing }) {
  const imageUrl = listing.imageUrls?.[0];
  if (imageUrl) return <img src={imageUrl} alt="" />;
  return <span>{listing.title.slice(0, 1)}</span>;
}

export default function BuildingListingsPanel({ listings, onClose, onSelect }) {
  const address = listings[0]?.address || '';
  const dragStartY = useRef(null);
  const dragDistance = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDragStart = (event) => {
    dragStartY.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleDragMove = (event) => {
    if (dragStartY.current === null) return;
    const distance = event.clientY - dragStartY.current;
    dragDistance.current = distance;
    setDragOffset(Math.max(0, distance));
  };
  const handleDragEnd = () => {
    const distance = dragDistance.current;
    dragStartY.current = null;
    dragDistance.current = 0;
    setIsDragging(false);
    setDragOffset(0);

    if (distance < -80) setIsExpanded(true);
    if (distance > 110) {
      if (isExpanded) setIsExpanded(false);
      else onClose();
    }
  };

  if (!listings.length) return null;

  return <aside className={`building-listings-panel ${isDragging ? 'is-dragging' : ''} ${isExpanded ? 'is-expanded' : ''}`} aria-label={`${address} 매물 목록`} style={{ transform: `translateY(${dragOffset}px)` }}>
    <div className="building-listings-panel__drag-handle" aria-label="매물 목록을 아래로 끌어 지도 화면으로 돌아가기" onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd} />
    <header className="building-listings-panel__header">
      <button className="building-listings-panel__back" type="button" onClick={onClose} aria-label="지도 화면으로 돌아가기"><Icon name="back" size={20} /></button>
      <div>
        <span>같은 건물 매물</span>
        <h2>{address}</h2>
        <p>{listings.length}개 호실을 비교해 보세요.</p>
      </div>
    </header>

    <div className="building-listings-panel__list">
      {listings.map((listing) => <button key={listing.id} type="button" className="building-listings-panel__item" onClick={() => onSelect(listing)}>
        <div className="building-listings-panel__thumbnail"><ListingThumbnail listing={listing} /></div>
        <div className="building-listings-panel__content">
          <div><StatusBadge tone={listing.dealType === '전세' ? 'orange' : 'blue'}>{listing.dealType}</StatusBadge><span>{listing.roomType} · {listing.floor} · {listing.direction}</span></div>
          <strong>{formatListingPrice(listing)}</strong>
          <p>{listing.area} · {listing.maintenance}</p>
          <small>{listing.summary}</small>
        </div>
        <Icon name="back" size={18} className="building-listings-panel__arrow" />
      </button>)}
    </div>
  </aside>;
}
