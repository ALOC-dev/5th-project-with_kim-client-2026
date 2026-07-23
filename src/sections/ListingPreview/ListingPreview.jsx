import Icon from '../../components/Icon';
import StatusBadge from '../../components/StatusBadge';
import RatingStars from '../../components/RatingStars';
import './ListingPreview.css';
import './ListingPreviewLock.css';

export default function ListingPreview({ listing, isFavorite, isLocked, onClose, onFavorite, onInquiry, onRequireLogin }) {
  const price = listing.rent ? `보증금 ${listing.deposit} / 월 ${listing.rent}` : `전세 ${listing.deposit}`;

  return <aside className={`listing-preview ${isLocked ? 'is-locked' : ''}`}>
    <div className="listing-preview__photo">
      <span>{listing.title.slice(0, 1)}</span>
      <button onClick={onClose} aria-label="미리보기 닫기"><Icon name="close" size={17} /></button>
      <StatusBadge>안전 {listing.safetyScore}</StatusBadge>
    </div>

    <div className="listing-preview__body">
      <div className="listing-preview__tags"><StatusBadge tone="green">집주인 인증</StatusBadge><StatusBadge>{listing.dealType}</StatusBadge></div>
      <h2>{price}</h2>
      <p className="listing-preview__summary">{listing.summary}</p>
      <em>시세 대비 {listing.marketDiff} · 인근 시세 {listing.marketPrice}</em>

      <section className="listing-preview__building"><Icon name="home" size={18} /><div><small>건물명</small><b>{listing.title}</b></div></section>
      <div className="listing-preview__specs"><Info label="전용면적" value={listing.area} /><Info label="공급면적" value={listing.supplyArea} /><Info label="층수" value={listing.floor} /><Info label="관리비" value={listing.maintenance} /></div>

      <section className="listing-preview__walk"><Icon name="pin" size={18} /><div><small>내가 설정한 건물까지</small><b>정보대 도보 {listing.walkingMinutes}분 {listing.distance}</b></div></section>
      <SafetyScore listing={listing} />
      <section className="listing-preview__risk"><header><b>전세사기 위험도</b><StatusBadge tone={listing.risk.level === '안전' ? 'green' : 'orange'}>{listing.risk.level}</StatusBadge></header><div><span>근저당권 <b>{listing.risk.mortgage}</b></span><span>전세가율 <b>{listing.risk.ratio}</b></span><span>LH 보증보험 <b>{listing.risk.lh}</b></span><span>HUG 보증보험 <b>{listing.risk.hug}</b></span></div></section>
      <section className="listing-preview__review"><header><div><b>학생 리뷰</b><span>실거주 인증 {listing.reviews}건</span></div><strong>{listing.rating}</strong></header><div className="listing-preview__reviewer"><span>{listing.agent.name.slice(0, 1)}</span><p><b>{listing.agent.name.slice(0, 1)}*수 <RatingStars rating={listing.rating} compact /></b><small>학교 가기 정말 가깝고 채광이 좋아요.</small></p></div><button>리뷰 전체보기</button></section>
      <section className="listing-preview__agent"><b>담당 공인중개사</b><div><span>{listing.agent.name.slice(0, 1)}</span><p><strong>{listing.agent.name} <StatusBadge tone="green">인증</StatusBadge></strong><small>{listing.agent.office}</small><small>{listing.agent.license}</small></p></div></section>
      <p className="listing-preview__stats">조회 87회 · 찜 {listing.reviews}개 · 문의 3회</p>
    </div>

    <footer>
      <button className={isFavorite ? 'is-favorite' : ''} onClick={() => onFavorite(listing.id)}><span>♥</span><small>찜</small></button>
      <button onClick={() => window.alert('전화 문의는 중개사 연결 API 연동 후 제공됩니다.')}><Icon name="phone" size={18} /><small>전화</small></button>
      <button className="listing-preview__inquiry" onClick={() => onInquiry(listing)}><Icon name="message" size={18} />문자 문의</button>
    </footer>

    {isLocked && <div className="listing-preview__login-gate"><b>로그인 후 상세 정보를 볼 수 있어요.</b><button onClick={onRequireLogin}>카카오로 로그인</button></div>}
  </aside>;
}

function Info({ label, value }) {
  return <div><small>{label}</small><b>{value}</b></div>;
}

function SafetyScore({ listing }) {
  const safetyScore = Number(listing.safetyScore) || 0;
  const metrics = [
    { label: '시세 적정성', value: Math.min(10, Math.round(safetyScore + 1)), tone: 'green' },
    { label: '등기부 안전', value: listing.risk.mortgage === '없음' ? 10 : 7, tone: 'green' },
    { label: '치안', value: Math.min(10, Math.round(safetyScore)), tone: 'blue' },
  ];

  return <section className="listing-preview__safety">
    <header><strong>{safetyScore.toFixed(1)}</strong><div><b>안전 점수</b><span>시세·등기부·치안·교통 종합 분석</span></div></header>
    <div className="listing-preview__safety-metrics">{metrics.map((metric) => <div key={metric.label}><p><span>{metric.label}</span><b>{metric.value}</b></p><i className={`is-${metric.tone}`}><em style={{ width: `${metric.value * 10}%` }} /></i></div>)}</div>
    <p className="listing-preview__safety-result"><Icon name="check" size={16} />등기부: 근저당 {listing.risk.mortgage} · {listing.risk.level}</p>
  </section>;
}
