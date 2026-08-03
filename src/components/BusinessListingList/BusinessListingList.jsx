import Icon from '../Icon';
import './BusinessListingList.css';

export default function BusinessListingList({ listings, username, onRegister }) {
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
      {listings.map((listing) => <article className="business-list__card" key={listing.id}>
        <div className="business-list__image"><Icon name="home" size={29} /><span>{listing.imageCount || 0}장</span></div>
        <div className="business-list__content">
          <div className="business-list__card-top"><div><h3>{listing.title || '이름 없는 매물'}</h3><p>{listing.address || '주소를 입력해 주세요.'} · {listing.leaseType === 'JEONSE' ? `전세 ${Number(listing.deposit).toLocaleString()}만원` : `월세 ${Number(listing.deposit).toLocaleString()}/${Number(listing.monthlyRent).toLocaleString()}`}</p></div><span className={`business-list__status ${listing.status === '학생 노출 중' ? 'is-live' : ''}`}>{listing.status}</span></div>
          <small className="business-list__date">{listing.updatedAt}</small>
        </div>
        <div className="business-list__actions"><button type="button">수정</button><button className="is-danger" type="button">{listing.status === '학생 노출 중' ? '내리기' : '삭제'}</button></div>
      </article>)}
    </div>
  </section>;
}
