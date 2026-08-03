import { useState } from 'react';
import { BusinessListingForm, BusinessListingList, BusinessSidebar } from '../../components';
import { INITIAL_BUSINESS_LISTINGS } from '../../constants';
import './BusinessPage.css';

export default function BusinessPage({ username, onLogout, onOpenRiskGuide = () => {} }) {
  const [activeSection, setActiveSection] = useState('register');
  const [listings, setListings] = useState(INITIAL_BUSINESS_LISTINGS);

  const handleCreateListing = (listing) => {
    setListings((current) => [listing, ...current]);
    setActiveSection('list');
  };

  return <main className="business-page">
    <BusinessSidebar activeSection={activeSection} onNavigate={setActiveSection} onOpenRiskGuide={onOpenRiskGuide} />
    <section className="business-page__main">
      <header className="business-page__header">
        <div><div className="business-page__title-row"><h1>{activeSection === 'register' ? '매물 등록' : '등록 매물 확인'}</h1><span>관리자</span></div><p>{activeSection === 'register' ? '새 자취방 매물을 등록하고, 등록 후 학생들에게 즉시 노출됩니다.' : '내가 등록한 매물의 노출 상태와 등록일을 확인하세요.'}</p></div>
        <div className="business-page__actions"><button className="business-page__logout" type="button" onClick={onLogout}>로그아웃</button>{activeSection === 'register' && <button className="business-page__primary" type="submit" form="business-listing-form">+ 등록 완료</button>}</div>
      </header>
      <div className="business-page__body">{activeSection === 'register' ? <BusinessListingForm onCreate={handleCreateListing} /> : <BusinessListingList listings={listings} username={username} onRegister={() => setActiveSection('register')} />}</div>
    </section>
  </main>;
}
