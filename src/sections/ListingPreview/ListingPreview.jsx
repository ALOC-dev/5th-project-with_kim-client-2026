import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../../components/Icon';
import NearbyFacilities from '../../components/NearbyFacilities';
import StatusBadge from '../../components/StatusBadge';
import ReviewCard from '../../components/ReviewCard';
import { REGISTRY_UPLOAD_IMAGE_ERROR, REGISTRY_UPLOAD_MAX_SIZE_BYTES, REGISTRY_UPLOAD_MAX_SIZE_LABEL, REGISTRY_UPLOAD_SIZE_ERROR, REGISTRY_UPLOAD_TYPE_ERROR } from '../../constants';
import { formatListingPrice } from '../../utils/price';
import { canRequestRegistryUpload, getRegistryStatus } from '../../utils/registry';
import { getSafetySummaryLabel, normalizeSafetyScore } from '../../utils/safety';
import './ListingPreview.css';
import './ListingPreviewLock.css';
import './ListingPreviewReviews.css';
import './ListingPreviewBack.css';
import './ListingPreviewDrag.css';
import './ListingPreviewSafety.css';

export default function ListingPreview({ listing, reviews, averageRating, isReviewLoading, reviewsError, currentUserId, registryUpload, isFavorite, isLocked, preferredSchoolBuilding, schoolDistance, isSchoolDistanceLoading, onClose, onFavorite, onInquiry, onRequireLogin, onWriteReview, onEditReview, onDeleteReview, onUploadRegistry }) {
  const price = formatListingPrice(listing);
  const isJeonse = listing.dealType === '전세';
  const registryStatus = getRegistryStatus(registryUpload || listing.registryUpload);
  const safetyLevel = getSafetyLevelLabel(listing);
  const photoSafetyLabel = isLocked ? '로그인 필요' : registryStatus === 'ANALYZED' ? safetyLevel : '분석 전';
  const dragStartY = useRef(null);
  const dragStartOffset = useRef(0);
  const sheetOffsetRef = useRef(0);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [isRegistryGuideOpen, setIsRegistryGuideOpen] = useState(false);
  const schoolBuildingName = schoolDistance?.schoolBuildingName || preferredSchoolBuilding?.name;
  const distanceMeters = Number(schoolDistance?.distanceMeters);
  const schoolDistanceLabel = !schoolBuildingName
    ? '학교 건물을 먼저 설정해 주세요'
    : isSchoolDistanceLoading
      ? `${schoolBuildingName} 거리 확인 중`
      : Number.isFinite(distanceMeters)
        ? `${schoolBuildingName}까지 ${Math.round(distanceMeters).toLocaleString('ko-KR')}m`
        : `${schoolBuildingName} 거리 정보 없음`;

  const handleDragStart = (event) => {
    dragStartY.current = getPointerY(event);
    dragStartOffset.current = sheetOffsetRef.current;
    setIsDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleDragMove = (event) => {
    if (dragStartY.current === null) return;
    const dragDistance = getPointerY(event) - dragStartY.current;
    const nextOffset = Math.min(getMobilePreviewPeekOffset(), Math.max(0, dragStartOffset.current + dragDistance));
    sheetOffsetRef.current = nextOffset;
    setSheetOffset(nextOffset);
  };
  const handleDragEnd = () => {
    const currentOffset = sheetOffsetRef.current;
    const peekOffset = getMobilePreviewPeekOffset();
    const startedExpanded = dragStartOffset.current === 0;
    const nextOffset = startedExpanded
      ? (currentOffset > 90 ? peekOffset : 0)
      : (currentOffset < peekOffset - 90 ? 0 : peekOffset);

    dragStartY.current = null;
    dragStartOffset.current = 0;
    sheetOffsetRef.current = nextOffset;
    setIsDragging(false);
    setSheetOffset(nextOffset);
  };

  return <>
  <aside className={`listing-preview ${isLocked ? 'is-locked' : ''} ${isDragging ? 'is-dragging' : ''} ${sheetOffset > 0 ? 'is-peeked' : ''}`} style={{ transform: `translateY(${sheetOffset}px)` }}>
    <div className="listing-preview__drag-handle" aria-label="매물 상세 패널 높이 조절" onPointerDown={handleDragStart} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd} />
    <div className="listing-preview__photo">
      <span>{listing.title.slice(0, 1)}</span>
      <button className="listing-preview__back" onClick={onClose} aria-label="이전 화면으로 돌아가기"><Icon name="back" size={20} /></button>
      <StatusBadge>{photoSafetyLabel}</StatusBadge>
    </div>

    <div className="listing-preview__body">
      <div className="listing-preview__tags"><StatusBadge tone="green">집주인 인증</StatusBadge><StatusBadge>{listing.dealType}</StatusBadge></div>
      <h2>{price}</h2>
      <p className="listing-preview__summary">{listing.summary}</p>
      <em>시세 대비 {listing.marketDiff} · 인근 시세 {listing.marketPrice}</em>

      <section className="listing-preview__building"><Icon name="home" size={18} /><div><small>위치</small><b>{listing.title}</b></div></section>
      <div className="listing-preview__specs"><Info icon="room" label="방 유형" value={listing.roomType} /><Info icon="compass" label="방향" value={listing.direction} /><Info icon="area" label="전용면적" value={listing.area} /><Info icon="area" label="공급면적" value={listing.supplyArea} /><Info icon="floor" label="층수" value={listing.floor} /><Info icon="receipt" label="관리비" value={listing.maintenance} /></div>

      <section className="listing-preview__walk"><Icon name="pin" size={18} /><div><small>내가 설정한 건물까지</small><b>{schoolDistanceLabel}</b></div></section>
      <SafetyScore listing={listing} isJeonse={isJeonse} registryStatus={registryStatus} />
      <RiskCard listing={listing} registryStatus={registryStatus} onOpenGuide={() => setIsRegistryGuideOpen(true)} canUpload={Boolean(onUploadRegistry)} />
      <NearbyFacilities metadata={listing.metadata} />
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
  </aside>
  {isRegistryGuideOpen && <RegistryUploadGuide listing={listing} onClose={() => setIsRegistryGuideOpen(false)} onUpload={onUploadRegistry} />}
  </>;
}

function getMobilePreviewPeekOffset() {
  if (typeof window === 'undefined') return 320;
  return Math.round(Math.min(360, Math.max(240, window.innerHeight * 0.42)));
}

function getPointerY(event) {
  return event.clientY ?? event.pageY ?? event.nativeEvent?.clientY ?? event.nativeEvent?.pageY ?? 0;
}

function Info({ icon, label, value }) {
  return <div><Icon name={icon} size={18} /><div><small>{label}</small><b>{value}</b></div></div>;
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

function SafetyScore({ listing, isJeonse, registryStatus }) {
  const isPending = registryStatus !== 'ANALYZED';
  const safetyLevel = isPending ? '미확인' : getSafetyLevelLabel(listing);
  const safetyTone = isPending ? 'is-pending' : getSafetyToneClass(safetyLevel);
  const resultText = getRegistrySafetyResultText(registryStatus, listing);
  const guideItems = getSafetyGuideItems(listing, isJeonse);

  return <section className={`listing-preview__safety ${safetyTone}`}>
    <header><strong>{safetyLevel}</strong><div><b>안전 점수</b><span>시세·등기부·치안·교통 종합 분석</span></div></header>
    {registryStatus === 'ANALYZED' && <div className="listing-preview__safety-guides">{guideItems.map((item) => <p key={item.label}><b>{item.label}</b><span>{item.description}</span></p>)}</div>}
    <p className={`listing-preview__safety-result ${safetyTone}`}><Icon name={isPending ? 'shield' : 'check'} size={16} />{resultText}</p>
  </section>;
}

function getSafetyGuideItems(listing, isJeonse) {
  const scores = getInternalSafetyScores(listing);
  return [
    { label: '시세 적정성', description: getMarketSafetyGuide(scores.market) },
    { label: '등기부', description: getRegistrySafetyGuide(scores.registry, listing, isJeonse) },
    { label: '치안', description: getSecuritySafetyGuide(scores.security) },
  ];
}

function getInternalSafetyScores(listing) {
  return {
    market: getScoreOrDefault(listing.marketSafetyScore ?? listing.marketScore, null),
    registry: getScoreOrDefault(listing.registrySafetyScore ?? listing.registryScore, getRegistryScoreFromRisk(listing)),
    security: getScoreOrDefault(listing.securitySafetyScore ?? listing.securityScore ?? listing.crimeScore, null),
  };
}

function getScoreOrDefault(value, defaultValue) {
  const score = normalizeSafetyScore(value);
  return score === null ? defaultValue : score;
}

function getRegistryScoreFromRisk(listing) {
  const mortgage = listing.risk?.mortgage;
  if (!mortgage || mortgage === '미확인') return null;
  if (mortgage === '없음') return 10;
  const mortgageAmount = parseKoreanManwonAmount(mortgage);
  if (mortgageAmount) return Math.max(0, Math.min(10, mortgageAmount / 1000));
  return null;
}

function parseKoreanManwonAmount(value) {
  if (!value || value === '미확인') return 0;
  const amount = Number(String(value).replace(/[^0-9.]/g, ''));
  return Number.isFinite(amount) ? amount : 0;
}

function getMarketSafetyGuide(score) {
  if (score === null) return '시세 점수는 아직 준비 중이에요. 실제 시세 점수가 들어오면 주변 시세와 공시가격 차이를 기준으로 안내할게요.';
  if (score >= 9) return '주변 시세와 비교했을 때 이 매물의 가격은 적정 범위 안에 있어요. 인근 거래가와 큰 차이가 없어 가격 측면에서는 안심하고 검토하셔도 좋아요.';
  if (score >= 7) return '주변 시세와 거의 비슷한 수준이에요. 특별히 우려할 만한 가격 차이는 없어요.';
  if (score >= 5) return '주변 시세보다 약간 높게 책정된 편이에요. 같은 조건의 다른 매물과 한 번 더 비교해보시는 걸 권장해요.';
  if (score >= 3) return '주변 시세 대비 가격이 다소 높게 책정돼 있어요. 신축 여부·옵션·구조 차이가 있는지 임장 시 확인해보시는 게 좋아요.';
  return '주변 시세 대비 가격이 눈에 띄게 높아요. 왜 이런 차이가 나는지 반드시 확인 후 계약을 진행하시길 권장해요.';
}

function getRegistrySafetyGuide(score, listing, isJeonse) {
  const ratioLabel = isJeonse ? '전세가율' : '보증금 비율';
  const ratioValue = listing.risk?.ratio || '미확인';
  const mortgageValue = listing.risk?.mortgage || '미확인';
  if (score === null) return '등기부 점수는 아직 준비 중이에요. 실제 등기부 점수가 들어오면 근저당, 선순위 권리, 보증보험 가능 여부를 함께 안내할게요.';
  if (score >= 9) return '근저당이나 선순위 채권이 없고, 전세가율도 안정적인 수준이에요. 등기부 상으로는 특별히 우려할 부분이 없어요.';
  if (score >= 7) return '근저당이 소액 설정되어 있지만 전세가율이 안정적인 편이에요. 계약 전 말소 조건 정도만 확인하면 충분해요.';
  if (score >= 5) return `${ratioLabel}이 ${ratioValue}이고 근저당 ${mortgageValue}이 확인됐어요. 이 내용만 보고 판단하기보다 계약 전 말소 조건, 선순위 권리, 보증보험 가능 여부도 함께 확인하는 게 좋아요.`;
  if (score >= 3) return '전세가율이 높은 편이고 근저당 설정액도 상당해요. 보증금을 지키기 어려울 수 있으니 보증보험 가입 가능 여부를 반드시 확인하세요.';
  return '전세가율이 매우 높고 선순위 채권까지 확인돼요. 보증금 반환에 위험이 있을 수 있어 계약에 신중을 기하시길 권장해요.';
}

function getSecuritySafetyGuide(score) {
  if (score === null) return '치안 점수는 아직 준비 중이에요. 실제 치안 점수가 들어오면 야간 이동과 주변 안전 정보를 함께 안내할게요.';
  if (score >= 9) return 'CCTV와 가로등이 충분히 갖춰져 있고, 이 지역의 최근 치안 지표도 양호한 편이에요.';
  if (score >= 7) return '치안 인프라가 전반적으로 잘 갖춰진 지역이에요. 야간 이동에도 큰 무리가 없을 것으로 보여요.';
  if (score >= 5) return '치안 인프라는 평균적인 수준이에요. 다만 밤늦게 다니실 일이 많다면 주변 동선을 한 번 직접 확인해보시는 게 좋아요.';
  if (score >= 3) return '이 지역은 야간 유동인구가 적고 CCTV 밀도가 낮은 편이에요. 늦은 시간 귀가가 잦으시다면 이 부분을 신중히 고려해보시는 게 좋아요.';
  return 'CCTV·가로등 등 치안 인프라가 부족하고 야간 유동인구도 매우 적은 지역이에요. 야간 이동이 잦다면 신중히 검토하시길 권장해요.';
}

function getSafetyLevelLabel(listing) {
  return getSafetySummaryLabel(listing.safetyScore);
}

function getSafetyToneClass(label) {
  if (label === '안심') return 'is-reassuring';
  if (label === '참고') return 'is-reference';
  if (label === '주의') return 'is-caution';
  return 'is-pending';
}

function RiskCard({ listing, registryStatus, canUpload, onOpenGuide }) {
  const title = listing.dealType === '월세' ? '월세 사기 위험도' : '전세 사기 위험도';
  const isRegistryAnalyzed = registryStatus === 'ANALYZED';
  const canRequestUpload = canUpload && canRequestRegistryUpload(registryStatus);
  const statusBadge = getRegistryRiskStatusBadge(registryStatus, listing);

  return <section className={`listing-preview__risk ${isRegistryAnalyzed ? '' : 'is-pending'}`}>
    <header><b>{title}</b><StatusBadge tone={statusBadge.tone}>{statusBadge.label}</StatusBadge></header>
    <div><span>근저당권 <b>{listing.risk.mortgage}</b></span><span>전세가율 <b>{listing.risk.ratio}</b></span><span>LH 보증보험 <b>{listing.risk.lh}</b></span><span>HUG 보증보험 <b>{listing.risk.hug}</b></span></div>
    {!isRegistryAnalyzed && canRequestUpload && <button type="button" className="listing-preview__registry-upload" onClick={onOpenGuide}><span><Icon name="upload" size={18} /></span><b>등기부등본 업로드하고 위험도 확인하기</b></button>}
  </section>;
}

function getRegistrySafetyResultText(registryStatus, listing) {
  if (registryStatus === 'PENDING') return '등기부: 분석 중이에요';
  if (registryStatus === 'NEEDS_MORE_DOCS') return '등기부: 보완 서류가 필요해요';
  if (registryStatus === 'FAILED') return '등기부: 분석에 실패했어요';
  if (registryStatus !== 'ANALYZED') return '등기부: 업로드 전 · 미확인';
  return `등기부: 근저당 ${listing.risk.mortgage} · ${getRegistrySummaryLabel(listing)}`;
}

function getRegistryRiskStatusBadge(registryStatus, listing) {
  if (registryStatus === 'ANALYZED') {
    const label = getRegistrySummaryLabel(listing);
    return { label, tone: label === '안심' ? 'green' : 'orange' };
  }
  if (registryStatus === 'PENDING') return { label: '분석 중', tone: 'gray' };
  if (registryStatus === 'NEEDS_MORE_DOCS') return { label: '보완 필요', tone: 'orange' };
  if (registryStatus === 'FAILED') return { label: '실패', tone: 'orange' };
  return { label: '미확인', tone: 'gray' };
}

function getRegistrySummaryLabel(listing) {
  return getSafetySummaryLabel(getInternalSafetyScores(listing).registry);
}

function RegistryUploadGuide({ listing, onClose, onUpload }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [ownerName, setOwnerName] = useState('');
  const [selectedPriceTypes, setSelectedPriceTypes] = useState(['OFFICIAL_PRICE']);
  const [officialPriceInput, setOfficialPriceInput] = useState('');
  const [marketPriceInput, setMarketPriceInput] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const togglePriceType = (priceType) => {
    setSelectedPriceTypes((types) => {
      if (!types.includes(priceType)) return [...types, priceType];
      return types.length === 1 ? types : types.filter((type) => type !== priceType);
    });
  };
  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!isPdfFile(file)) {
      setSelectedFile(null);
      setUploadError(isImageFile(file) ? REGISTRY_UPLOAD_IMAGE_ERROR : REGISTRY_UPLOAD_TYPE_ERROR);
      event.target.value = '';
      return;
    }
    if (file.size > REGISTRY_UPLOAD_MAX_SIZE_BYTES) {
      setSelectedFile(null);
      setUploadError(REGISTRY_UPLOAD_SIZE_ERROR);
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
    setUploadError('');
  };
  const handleUploadClick = async () => {
    if (!selectedFile) {
      fileInputRef.current?.click();
      return;
    }
    setUploadError('');
    setIsUploading(true);
    try {
      const metadata = buildRegistryUploadMetadata(ownerName, selectedPriceTypes, { officialPriceInput, marketPriceInput });
      if (onUpload) await onUpload(listing.id, selectedFile, metadata);
      onClose();
      setSelectedFile(null);
      setOwnerName('');
      setSelectedPriceTypes(['OFFICIAL_PRICE']);
      setOfficialPriceInput('');
      setMarketPriceInput('');
    } catch {
      setUploadError('등기부등본 업로드에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
    }
  };

  const guide = <div className="registry-upload-guide" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <div className="registry-upload-guide__dialog" role="dialog" aria-modal="true" aria-labelledby="registry-upload-guide-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><span><Icon name="message" size={22} /></span><h2 id="registry-upload-guide-title">등기부등본 업로드 안내</h2><button type="button" onClick={onClose} aria-label="등기부등본 업로드 안내 닫기"><Icon name="close" size={18} /></button></header>
        <div className="registry-upload-guide__body">
          <p>등기부등본을 준비해 업로드하면 이 매물의 사기 위험도를 바로 확인할 수 있어요.</p>
          <ol>
            <li><span className="registry-upload-guide__step-text"><strong>정부24</strong> 사이트나 앱에서 이 매물 주소로 <strong>등기사항전부증명서(등기부등본)</strong>를 발급받아요</span></li>
            <li><span className="registry-upload-guide__step-text">발급받은 <strong>PDF 파일</strong>을 그대로 준비해요. 주민번호 뒷자리는 가려도 돼요</span></li>
            <li><span className="registry-upload-guide__step-text">아래 <strong>파일 선택</strong> 후 업로드하면 근저당·전월세가율·보증보험 여부를 자동으로 분석해요</span></li>
          </ol>
          <section className="registry-upload-guide__price">
            <b>시세 또는 공시가격 입력</b>
            <p><Icon name="shield" size={15} /><span>공시가격은 <strong>부동산공시가격알리미</strong>(realtyprice.kr), 시세는 <strong>KB부동산</strong>(kbland.kr)에서 확인할 수 있어요.</span></p>
            <div className="registry-upload-guide__price-tabs">
              <button type="button" className={selectedPriceTypes.includes('OFFICIAL_PRICE') ? 'is-active' : ''} onClick={() => togglePriceType('OFFICIAL_PRICE')}>공시가격</button>
              <button type="button" className={selectedPriceTypes.includes('MARKET_PRICE') ? 'is-active' : ''} onClick={() => togglePriceType('MARKET_PRICE')}>시세</button>
            </div>
            <div className="registry-upload-guide__price-inputs">
              {selectedPriceTypes.includes('OFFICIAL_PRICE') && <label className="registry-upload-guide__price-input">
                <input type="text" inputMode="numeric" aria-label="공시가격" value={officialPriceInput} onChange={(event) => setOfficialPriceInput(formatManwonInput(event.target.value))} placeholder="공시가격 예: 25,000" autoComplete="off" />
                {officialPriceInput && <span>만원</span>}
              </label>}
              {selectedPriceTypes.includes('MARKET_PRICE') && <label className="registry-upload-guide__price-input">
                <input type="text" inputMode="numeric" aria-label="시세" value={marketPriceInput} onChange={(event) => setMarketPriceInput(formatManwonInput(event.target.value))} placeholder="시세 예: 25,000" autoComplete="off" />
                {marketPriceInput && <span>만원</span>}
              </label>}
            </div>
          </section>
          <label className="registry-upload-guide__owner">
            <span>집주인 성함 <small>선택 입력</small></span>
            <input type="text" aria-label="집주인 성함" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} placeholder="예: 김철수" autoComplete="off" />
          </label>
          <label className="registry-upload-guide__picker">
            <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" aria-label="등기부등본 파일 선택" onChange={handleFileChange} />
            <span><Icon name="upload" size={22} /></span>
            <b>{selectedFile ? selectedFile.name : '등기부등본 파일 선택'}</b>
            <small>PDF · 최대 {REGISTRY_UPLOAD_MAX_SIZE_LABEL} · 발급일 3개월 이내 등기부만 인정돼요</small>
          </label>
          {uploadError && <p className="registry-upload-guide__error" role="alert">{uploadError}</p>}
          <p className="registry-upload-guide__notice">등기부등본은 위험도 분석 목적으로만 사용되고, 분석 후 즉시 폐기돼요.</p>
        </div>
        <footer><button type="button" onClick={handleUploadClick} disabled={isUploading}>{isUploading ? '업로드 중...' : '업로드하기'}</button></footer>
      </div>
    </div>;

  return createPortal(guide, document.body);
}

function isPdfFile(file) {
  return file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
}

function isImageFile(file) {
  return file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(file.name);
}

function buildRegistryUploadMetadata(ownerName, selectedPriceTypes, priceInputs) {
  const metadata = {};
  const trimmedOwnerName = ownerName.trim();
  const officialPrice = selectedPriceTypes.includes('OFFICIAL_PRICE') ? parseManwonInputToWon(priceInputs.officialPriceInput) : undefined;
  const marketPrice = selectedPriceTypes.includes('MARKET_PRICE') ? parseManwonInputToWon(priceInputs.marketPriceInput) : undefined;

  if (trimmedOwnerName) metadata.ownerName = trimmedOwnerName;
  if (officialPrice) metadata.publicPrice = officialPrice;
  if (marketPrice) metadata.price = marketPrice;

  return Object.keys(metadata).length ? metadata : undefined;
}

function formatManwonInput(value) {
  const digits = value.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('ko-KR');
}

function parseManwonInputToWon(value) {
  const amount = Number(value.replace(/[^\d]/g, ''));
  return Number.isFinite(amount) && amount > 0 ? amount * 10000 : undefined;
}
