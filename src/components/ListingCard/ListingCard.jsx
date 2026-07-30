import { useRef } from 'react';
import Icon from '../Icon';
import RatingStars from '../RatingStars';
import StatusBadge from '../StatusBadge';
import { REGISTRY_UPLOAD_IMAGE_ERROR, REGISTRY_UPLOAD_MAX_SIZE_BYTES, REGISTRY_UPLOAD_SIZE_ERROR, REGISTRY_UPLOAD_TYPE_ERROR } from '../../constants';
import { formatListingPrice } from '../../utils/price';
import { canRequestRegistryUpload, getRegistryStatus } from '../../utils/registry';
import './ListingCard.css';

export default function ListingCard({ listing, isFavorite, isSelected, onSelect, onFavorite, compareSelected, onCompare, registryUpload, onUploadRegistry }) {
  const price = formatListingPrice(listing);
  const registryStatus = getRegistryStatus(registryUpload || listing.registryUpload);
  const canUploadRegistry = canRequestRegistryUpload(registryStatus);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const [file] = event.target.files;
    if (!file) return;
    if (!isPdfFile(file)) {
      window.alert(isImageFile(file) ? REGISTRY_UPLOAD_IMAGE_ERROR : REGISTRY_UPLOAD_TYPE_ERROR);
      event.target.value = '';
      return;
    }
    if (file.size > REGISTRY_UPLOAD_MAX_SIZE_BYTES) {
      window.alert(REGISTRY_UPLOAD_SIZE_ERROR);
      event.target.value = '';
      return;
    }
    onUploadRegistry(listing.id, file);
    event.target.value = '';
  };

  return (
    <article className={`listing-card ${isSelected ? 'listing-card--selected' : ''}`}>
      <button className="listing-card__photo" onClick={() => onSelect(listing)} aria-label={`${listing.title} 상세 보기`}><span>{listing.title.slice(0, 1)}</span><StatusBadge tone="blue">{listing.safetyScore ? `안전 ${listing.safetyScore}` : '분석 전'}</StatusBadge></button>
      <div className="listing-card__body"><div className="listing-card__tags"><StatusBadge tone="green">집주인 인증</StatusBadge><StatusBadge>{listing.dealType}</StatusBadge></div><button className="listing-card__title" onClick={() => onSelect(listing)}>{listing.title}</button><strong>{price}</strong><p>{listing.address} · 도보 {listing.walkingMinutes}분</p><div className="listing-card__meta"><RatingStars rating={listing.rating} compact /><span>리뷰 {listing.reviews}</span><em>시세 대비 {listing.marketDiff}</em></div></div>
      <div className="listing-card__actions">{onCompare && <label><input type="checkbox" checked={compareSelected} onChange={() => onCompare(listing.id)} /> <span>비교</span></label>}<button className={isFavorite ? 'listing-card__heart is-active' : 'listing-card__heart'} onClick={() => onFavorite(listing.id)} aria-label="찜하기">♥</button></div>
      {onUploadRegistry && <div className={`listing-card__registry ${getRegistryClassName(registryStatus)}`}>{registryStatus === 'ANALYZED' ? <><Icon name="check" size={16} /><span>위험 확인 완료 · {listing.risk.level}</span></> : registryStatus === 'PENDING' ? <><Icon name="shield" size={16} /><span>위험도 분석 중</span></> : canUploadRegistry ? <><button type="button" onClick={() => fileInputRef.current?.click()}><Icon name="upload" size={16} />{getRegistryUploadLabel(registryStatus)}</button><input ref={fileInputRef} type="file" accept="application/pdf,.pdf" aria-label="등기부등본 PDF 파일 선택" onChange={handleFileChange} /></> : null}</div>}
    </article>
  );
}

function getRegistryClassName(registryStatus) {
  if (registryStatus === 'ANALYZED') return 'is-complete';
  if (registryStatus === 'PENDING') return 'is-pending';
  if (registryStatus === 'NEEDS_MORE_DOCS' || registryStatus === 'FAILED') return 'is-warning';
  return '';
}

function getRegistryUploadLabel(registryStatus) {
  if (registryStatus === 'NEEDS_MORE_DOCS') return '보완 서류 업로드하고 다시 확인';
  if (registryStatus === 'FAILED') return '다시 업로드하고 위험도 확인';
  return '등기부등본 업로드하고 위험도 확인';
}

function isPdfFile(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function isImageFile(file) {
  return file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(file.name);
}
