import Icon from '../Icon';
import './BusinessListingList.css';

function formatAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  const manwon = amount >= 100000 ? Math.round(amount / 10000) : amount;
  return manwon.toLocaleString('ko-KR');
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} 등록`;
}

function getStatusLabel(listing) {
  const status = String(listing.status || listing.listingStatus || listing.exposureStatus || '').toUpperCase();
  return { ACTIVE: '학생 노출 중', INACTIVE: '노출 중지', HIDDEN: '노출 중지', COMPLETED: '계약 완료' }[status] || listing.status || listing.listingStatus || '등록 대기';
}

function getRawStatus(listing) {
  return String(listing.rawHouse?.listingStatus || listing.listingStatus || listing.rawHouse?.status || '').toUpperCase();
}

export default function BusinessListingList({ listings, username, onRegister, onEdit, onTakeDown, onDelete }) {
  return <section className="business-list">
    <div className="business-list__intro">
      <div>
        <span className="business-list__eyebrow">{username || '관리자'}님이 등록한 매물</span>
        <h2>등록 매물 확인</h2>
        <p>등록한 매물의 노출 상태와 등록일을 확인하세요.</p>
      </div>
      <button className="business-page__primary business-page__primary--small" type="button" onClick={onRegister}><Icon name="plus" size={14} /> 새 매물 등록</button>
    </div>
    <div className="business-list__cards">
      {listings.length === 0 ? <p className="business-list__empty">등록된 매물이 없습니다.</p> : listings.map((listing) => <article className="business-list__card" key={listing.id}>
        <div className="business-list__main">
          <div className="business-list__image"><Icon name="home" size={43} /><span>{listing.imageCount || 0}장</span></div>
          <div className="business-list__content">
            <div className="business-list__meta"><span className={`business-list__status ${getStatusLabel(listing) === '학생 노출 중' ? 'is-live' : ''}`}>{getStatusLabel(listing)}</span><small className="business-list__date">{formatDate(listing.updatedAt)}</small></div>
            <h3>{listing.title || '이름 없는 매물'}</h3>
            <p>{listing.address || '주소를 입력해 주세요.'}{listing.builtYear ? ` · ${listing.builtYear}년 건축` : ''}</p>
            <strong className="business-list__price">{listing.leaseType === 'JEONSE' ? <>전세 <b>{formatAmount(listing.deposit)}만원</b></> : <>월세 <b>{formatAmount(listing.deposit)} / {formatAmount(listing.monthlyRent)}</b></>}</strong>
          </div>
        </div>
        <div className="business-list__actions"><button type="button" onClick={() => onEdit?.(listing)}><Icon name="edit" size={18} />수정</button>{getRawStatus(listing) !== 'COMPLETED' && <button type="button" onClick={() => onTakeDown?.(listing)}><Icon name={getRawStatus(listing) === 'HIDDEN' ? 'arrowUp' : 'arrowDown'} size={18} />{getRawStatus(listing) === 'HIDDEN' ? '다시 올리기' : '내리기'}</button>}{getRawStatus(listing) !== 'COMPLETED' && <button className="is-success" type="button" onClick={() => onTakeDown?.(listing, 'COMPLETED')}><Icon name="checkSimple" size={18} />거래완료</button>}<button className="is-danger" type="button" onClick={() => onDelete?.(listing)}><Icon name="trash" size={18} />삭제하기</button></div>
      </article>)}
    </div>
  </section>;
}
