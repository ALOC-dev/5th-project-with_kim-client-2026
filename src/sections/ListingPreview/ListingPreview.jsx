import { useRef, useState } from 'react';
import Icon from '../../components/Icon';
import StatusBadge from '../../components/StatusBadge';
import ReviewCard from '../../components/ReviewCard';
import './ListingPreview.css';
import './ListingPreviewLock.css';
import './ListingPreviewReviews.css';
import './ListingPreviewBack.css';
import './ListingPreviewDrag.css';

export default function ListingPreview({ listing, reviews, averageRating, isReviewLoading, reviewsError, currentUserId, registryUpload, isFavorite, isLocked, onClose, onFavorite, onInquiry, onRequireLogin, onWriteReview, onEditReview, onDeleteReview, onUploadRegistry }) {
  const price = listing.rent ? `보증금 ${listing.deposit} / 월 ${listing.rent}` : `전세 ${listing.deposit}`;
  const isJeonse = listing.dealType === '전세';
  const isRegistryAnalyzed = hasRegistryAnalysis(registryUpload);
  const dragStartY = useRef(null);
  const dragOffsetRef = useRef(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const handleDragStart = (event) => {
    dragStartY.current = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleDragMove = (event) => {
    if (dragStartY.current === null) return;
    const nextOffset = Math.max(0, event.clientY - dragStartY.current);
    dragOffsetRef.current = nextOffset;
    setDragOffset(nextOffset);
  };
  const handleDragEnd = () => {
    const shouldClose = dragOffsetRef.current > 110;
    dragStartY.current = null;
    dragOffsetRef.current = 0;
    setIsDragging(false);
    setDragOffset(0);
    if (shouldClose) onClose();
  };

  return <aside className={`listing-preview ${isLocked ? 'is-locked' : ''} ${isDragging ? 'is-dragging' : ''}`} style={{ transform: `translateY(${dragOffset}px)` }}>
    <div className="listing-preview__drag-handle" aria-label="아래로 끌어 이전 화면으로 돌아가기" onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd} />
    <div className="listing-preview__photo">
      <span>{listing.title.slice(0, 1)}</span>
      <button className="listing-preview__back" onClick={onClose} aria-label="이전 화면으로 돌아가기"><Icon name="back" size={20} /></button>
      <StatusBadge>{listing.safetyScore ? `안전 ${listing.safetyScore}` : '분석 전'}</StatusBadge>
    </div>

    <div className="listing-preview__body">
      <div className="listing-preview__tags"><StatusBadge tone="green">집주인 인증</StatusBadge><StatusBadge>{listing.dealType}</StatusBadge></div>
      <h2>{price}</h2>
      <p className="listing-preview__summary">{listing.summary}</p>
      <em>시세 대비 {listing.marketDiff} · 인근 시세 {listing.marketPrice}</em>

      <section className="listing-preview__building"><Icon name="home" size={18} /><div><small>건물명</small><b>{listing.title}</b></div></section>
      <div className="listing-preview__specs"><Info icon="room" label="방 유형" value={listing.roomType} /><Info icon="compass" label="방향" value={listing.direction} /><Info icon="area" label="전용면적" value={listing.area} /><Info icon="area" label="공급면적" value={listing.supplyArea} /><Info icon="floor" label="층수" value={listing.floor} /><Info icon="receipt" label="관리비" value={listing.maintenance} /></div>

      <section className="listing-preview__walk"><Icon name="pin" size={18} /><div><small>내가 설정한 건물까지</small><b>정보대 도보 {listing.walkingMinutes}분 {listing.distance}</b></div></section>
      <SafetyScore listing={listing} isJeonse={isJeonse} isRegistryAnalyzed={isRegistryAnalyzed} />
      <RiskCard listing={listing} isRegistryAnalyzed={isRegistryAnalyzed} onUploadRegistry={onUploadRegistry} />
      <ReviewSummary reviews={reviews} averageRating={averageRating} isLoading={isReviewLoading} error={reviewsError} currentUserId={currentUserId} showAll={showAllReviews} onToggleReviews={() => setShowAllReviews((isOpen) => !isOpen)} onWriteReview={onWriteReview} onEditReview={onEditReview} onDeleteReview={onDeleteReview} />
      <section className="listing-preview__agent"><b>담당 공인중개사</b><div><span>{listing.agent.name.slice(0, 1)}</span><p><strong>{listing.agent.name} <StatusBadge tone="green">인증</StatusBadge></strong><small>{listing.agent.office}</small><small>{listing.agent.license}</small></p></div></section>
      <p className="listing-preview__stats">조회 정보 없음 · 리뷰 {reviews.length}개 · 문의 정보 없음</p>
    </div>

    <footer>
      <button className={isFavorite ? 'is-favorite' : ''} onClick={() => onFavorite(listing.id)}><span>♥</span><small>찜</small></button>
      <button onClick={() => window.alert('전화 문의는 중개사 연결 API 연동 후 제공됩니다.')}><Icon name="phone" size={18} /><small>전화</small></button>
      <button className="listing-preview__inquiry" onClick={() => onInquiry(listing)}><Icon name="message" size={18} />문자 문의</button>
    </footer>

    {isLocked && <div className="listing-preview__login-gate"><b>로그인 후 상세 정보를 볼 수 있어요.</b><button onClick={onRequireLogin}>카카오로 로그인</button></div>}
  </aside>;
}

function Info({ icon, label, value }) {
  return <div><Icon name={icon} size={18} /><div><small>{label}</small><b>{value}</b></div></div>;
}

function hasRegistryAnalysis(registryUpload) {
  return Boolean(registryUpload);
}

function isMyReview(review, currentUserId) {
  if (review.isMine || review.myReview || review.mine) return true;
  return Boolean(currentUserId && review.userId && String(review.userId) === String(currentUserId));
}

function getVisibleReviews(reviews, currentUserId, showAll) {
  const myReviews = reviews.filter((review) => isMyReview(review, currentUserId));
  if (showAll) return [...myReviews, ...reviews.filter((review) => !isMyReview(review, currentUserId))];
  if (!myReviews.length) return reviews.slice(0, 2);
  return [...myReviews, ...reviews.filter((review) => !isMyReview(review, currentUserId)).slice(0, 2)];
}

function ReviewSummary({ reviews, averageRating, isLoading, error, currentUserId, showAll, onToggleReviews, onWriteReview, onEditReview, onDeleteReview }) {
  const hasReviews = reviews.length > 0;
  const visibleReviews = getVisibleReviews(reviews, currentUserId, showAll);
  const remainingReviewCount = Math.max(reviews.length - visibleReviews.length, 0);
  return <section className="listing-preview__review"><header><div><b>학생 리뷰</b><span>등록 리뷰 {reviews.length}건</span></div>{hasReviews && <strong>{averageRating.toFixed(1)}</strong>}</header>{isLoading ? <p className="listing-preview__review-empty">리뷰를 불러오는 중이에요.</p> : hasReviews ? <div className="listing-preview__review-list">{visibleReviews.map((review) => {
    const mine = isMyReview(review, currentUserId);
    return <ReviewCard key={review.id} review={review} isMine={mine} onEdit={mine ? onEditReview : undefined} onDelete={mine ? onDeleteReview : undefined} />;
  })}</div> : <p className="listing-preview__review-empty">{error || '아직 등록된 학생 리뷰가 없어요.'}</p>}{!hasReviews && <button type="button" className="is-review-cta" onClick={onWriteReview}>첫 리뷰 작성하기</button>}{(remainingReviewCount > 0 || showAll) && reviews.length > 2 && <button type="button" onClick={onToggleReviews}>{showAll ? '리뷰 접기' : `${remainingReviewCount}개 리뷰 더보기`}</button>}</section>;
}

function SafetyScore({ listing, isJeonse, isRegistryAnalyzed }) {
  const safetyScore = Number(listing.safetyScore) || 0;
  const isPending = !isRegistryAnalyzed;
  const metrics = [
    { label: '시세 적정성', value: Math.min(10, Math.round(safetyScore + 1)), tone: 'green' },
    { label: isJeonse ? '등기부 안전' : '계약 안전', value: listing.risk.mortgage === '없음' ? 10 : 7, tone: 'green' },
    { label: '치안', value: Math.min(10, Math.round(safetyScore)), tone: 'blue' },
  ];
  const resultText = isPending
    ? '등기부: 업로드 전 · 미확인'
    : isJeonse
      ? `등기부: 근저당 ${listing.risk.mortgage} · ${listing.risk.level}`
      : '월세 계약 안전성 확인 완료';

  return <section className={`listing-preview__safety ${isPending ? 'is-pending' : ''}`}>
    <header><strong>{safetyScore.toFixed(1)}</strong><div><b>안전 점수</b><span>시세·등기부·치안·교통 종합 분석</span></div></header>
    {isRegistryAnalyzed && <div className="listing-preview__safety-metrics">{metrics.map((metric) => <div key={metric.label}><p><span>{metric.label}</span><b>{metric.value}</b></p><i className={`is-${metric.tone}`}><em style={{ width: `${metric.value * 10}%` }} /></i></div>)}</div>}
    <p className="listing-preview__safety-result"><Icon name={isPending ? 'shield' : 'check'} size={16} />{resultText}</p>
  </section>;
}

function RiskCard({ listing, isRegistryAnalyzed, onUploadRegistry }) {
  const fileInputRef = useRef(null);
  const title = listing.dealType === '월세' ? '월세 사기 위험도' : '전세 사기 위험도';
  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (file && onUploadRegistry) await onUploadRegistry(listing.id, file);
    event.target.value = '';
  };

  return <section className={`listing-preview__risk ${isRegistryAnalyzed ? '' : 'is-pending'}`}>
    <header><b>{title}</b><StatusBadge tone={isRegistryAnalyzed ? listing.risk.level === '안전' ? 'green' : 'orange' : 'gray'}>{isRegistryAnalyzed ? listing.risk.level : '미확인'}</StatusBadge></header>
    <div><span>근저당권 <b>{listing.risk.mortgage}</b></span><span>전세가율 <b>{listing.risk.ratio}</b></span><span>LH 보증보험 <b>{listing.risk.lh}</b></span><span>HUG 보증보험 <b>{listing.risk.hug}</b></span></div>
    {!isRegistryAnalyzed && onUploadRegistry && <label className="listing-preview__registry-upload"><input ref={fileInputRef} type="file" accept="application/pdf,image/*" onChange={handleFileChange} /><span><Icon name="upload" size={18} /></span><b>등기부등본 업로드하고 위험도 확인하기</b></label>}
  </section>;
}
