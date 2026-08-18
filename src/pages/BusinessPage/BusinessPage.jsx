import { useEffect, useState } from 'react';
import { BusinessListingForm, BusinessListingList, BusinessSidebar } from '../../components';
import { deleteHouse, getMyListings, updateHouse, updateHouseStatus } from '../../services/listingService';
import './BusinessPage.css';

export default function BusinessPage({ username, onLogout, onOpenRiskGuide = () => {} }) {
  const [activeSection, setActiveSection] = useState('register');
  const [listings, setListings] = useState([]);
  const [editingListing, setEditingListing] = useState(null);

  useEffect(() => {
    let active = true;
    getMyListings().then((myListings) => {
      if (active) setListings(myListings);
    }).catch(() => {
      // Keep the empty state visible when the API is unavailable.
    });
    return () => { active = false; };
  }, []);

  const handleCreateListing = (listing) => {
    setListings((current) => [listing, ...current]);
    setEditingListing(null);
    setActiveSection('list');
  };

  const handleEditListing = (listing) => {
    setEditingListing(listing);
    setActiveSection('register');
  };

  const handleUpdateListing = async (listing) => {
    try {
      const updated = await updateHouse(listing.id, listing);
      setListings((current) => current.map((item) => item.id === listing.id ? (updated || listing) : item));
      setEditingListing(null);
      setActiveSection('list');
    } catch {
      window.alert('매물 수정에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleStatusChange = async (listing, requestedStatus) => {
    const currentStatus = String(listing.rawHouse?.listingStatus || listing.listingStatus || '').toUpperCase();
    const nextStatus = requestedStatus || (currentStatus === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN');
    try {
      await updateHouseStatus(listing.id, nextStatus);
      const statusLabel = { ACTIVE: '학생 노출 중', HIDDEN: '노출 중지', COMPLETED: '계약 완료' }[nextStatus] || nextStatus;
      setListings((current) => current.map((item) => item.id === listing.id
        ? { ...item, status: statusLabel, listingStatus: nextStatus, rawHouse: { ...(item.rawHouse || {}), listingStatus: nextStatus } }
        : item));
    } catch {
      window.alert('매물 상태 변경에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleDeleteListing = async (listing) => {
    if (!window.confirm('이 매물을 삭제할까요?')) return;
    try {
      await deleteHouse(listing.id);
      setListings((current) => current.filter((item) => item.id !== listing.id));
    } catch {
      window.alert('매물 삭제에 실패했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  return <main className="business-page">
    <BusinessSidebar activeSection={activeSection} onNavigate={setActiveSection} onOpenRiskGuide={onOpenRiskGuide} />
    <section className="business-page__main">
      <header className="business-page__header">
        <div><div className="business-page__title-row"><h1>{activeSection === 'register' ? '매물 등록' : '등록 매물 확인'}</h1><span>관리자</span></div><p>{activeSection === 'register' ? '새 자취방 매물을 등록하고, 등록 후 학생들에게 즉시 노출됩니다.' : '내가 등록한 매물의 노출 상태와 등록일을 확인하세요.'}</p></div>
        <div className="business-page__actions"><button className="business-page__logout" type="button" onClick={onLogout}>로그아웃</button>{activeSection === 'register' && <button className="business-page__primary" type="submit" form="business-listing-form">{editingListing ? '수정 완료' : '+ 등록 완료'}</button>}</div>
      </header>
      <div className="business-page__body">{activeSection === 'register' ? <BusinessListingForm initialListing={editingListing} onCreate={handleCreateListing} onUpdate={handleUpdateListing} /> : <BusinessListingList listings={listings} username={username} onRegister={() => { setEditingListing(null); setActiveSection('register'); }} onEdit={handleEditListing} onTakeDown={handleStatusChange} onDelete={handleDeleteListing} />}</div>
    </section>
  </main>;
}
