import { useState } from 'react';
import { mapListings } from '../../constants';
import { useResidenceVerification } from '../../hooks';
import Sidebar from '../../sections/Sidebar';
import Topbar from '../../sections/Topbar';
import MapExplorer from '../../sections/MapExplorer';
import ListingPreview from '../../sections/ListingPreview/ListingPreview';
import FilterPanel from '../../sections/FilterPanel/FilterPanel';
import ChatAssistant from '../../sections/ChatAssistant';
import ListingDetails from '../../sections/ListingDetails';
import FavoritesSection from '../../sections/FavoritesSection';
import MarketAnalysis from '../../sections/MarketAnalysis';
import ChecklistSection from '../../sections/ChecklistSection';
import ProfileSection from '../../sections/ProfileSection';
import OnboardingSection from '../../sections/OnboardingSection';
import ResidenceVerificationBanner from '../../sections/ResidenceVerificationBanner';
import './HousingPage.css';

export default function HousingPage({ isAuthenticated, userId, onRequireLogin, onLogout }) {
  const [activePage, setActivePage] = useState('home');
  const [selectedListing, setSelectedListing] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [compareIds, setCompareIds] = useState([]);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [verificationDismissed, setVerificationDismissed] = useState(false);
  const [filters, setFilters] = useState({ dealType: '전체', depositLimit: 15000, rentLimit: 100, roomType: '전체', walking: '전체', safety: '전체', options: { elevator: true, parking: false, cctv: true, pets: false } });
  const listings = mapListings;
  const shownListings = listings.filter((listing) => matchesFilters(listing, filters));
  const residenceVerification = useResidenceVerification(isAuthenticated);

  const handleFavorite = async (id) => {
    if (!isAuthenticated) return onRequireLogin();
    const willFavorite = !favorites.includes(id);
    setFavorites((items) => willFavorite ? [...items, id] : items.filter((item) => item !== id));
  };
  const handleCompare = (id) => setCompareIds((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length < 3 ? [...items, id] : items);
  const handleInquiry = async (listing) => {
    if (!isAuthenticated) return onRequireLogin();
    window.alert(`${listing.agent.name} 공인중개사에게 문의를 준비했어요.`);
  };
  const openDetail = async (listing) => {
    if (!isAuthenticated) {
      setSelectedListing(listing);
      return;
    }
    setActivePage('detail');
    setSelectedListing(listing);
  };
  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    if (selectedListing && !matchesFilters(selectedListing, nextFilters)) setSelectedListing(null);
  };
  const resetFilters = () => setFilters({ dealType: '전체', depositLimit: 15000, rentLimit: 100, roomType: '전체', walking: '전체', safety: '전체', options: { elevator: true, parking: false, cctv: true, pets: false } });
  const homeContent = <><Topbar mapOnly count={shownListings.length} onOpenFilter={() => setFilterOpen(true)} isAuthenticated={isAuthenticated} userId={userId} onLogin={onRequireLogin} onLogout={onLogout} />{!verificationDismissed && <ResidenceVerificationBanner verification={residenceVerification} onDismiss={() => setVerificationDismissed(true)} />}<div className="housing-page__map"><MapExplorer listings={shownListings} onSelect={setSelectedListing} />{selectedListing && <ListingPreview listing={selectedListing} isFavorite={favorites.includes(selectedListing.id)} isLocked={!isAuthenticated} onClose={() => setSelectedListing(null)} onFavorite={handleFavorite} onInquiry={handleInquiry} onRequireLogin={onRequireLogin} />}</div></>;
  const content = activePage === 'home' ? homeContent : activePage === 'detail' && selectedListing ? <ListingDetails listing={selectedListing} isFavorite={favorites.includes(selectedListing.id)} onBack={() => setActivePage('home')} onFavorite={handleFavorite} onInquiry={handleInquiry} /> : activePage === 'favorites' ? <FavoritesSection listings={listings} favorites={favorites} compareIds={compareIds} onSelect={openDetail} onFavorite={handleFavorite} onCompare={handleCompare} /> : activePage === 'market' ? <MarketAnalysis listings={listings} /> : activePage === 'checklist' ? <ChecklistSection /> : <ProfileSection onOpenOnboarding={() => setOnboardingOpen(true)} />;
  return <main className="housing-page"><Sidebar activePage={activePage === 'detail' ? 'home' : activePage} onNavigate={(page) => { if (!isAuthenticated && page !== 'home') return onRequireLogin(); setActivePage(page); setSelectedListing(null); }} onOpenOnboarding={() => isAuthenticated ? setOnboardingOpen(true) : onRequireLogin()} /><div className="housing-page__main">{content}</div><ChatAssistant />{filterOpen && <FilterPanel filters={filters} onChange={handleFilterChange} onClose={() => setFilterOpen(false)} onReset={resetFilters} count={shownListings.length} />}{onboardingOpen && <OnboardingSection onClose={() => setOnboardingOpen(false)} />}</main>;
}

function matchesFilters(listing, filters) {
  const deposit = parseMoney(listing.deposit);
  const rent = parseMoney(listing.rent);
  const walkingLimit = { '10분 이내': 10, '15분 이내': 15, '20분 이내': 20 }[filters.walking];
  const safetyLimit = { '8점 이상': 8, '6점 이상': 6 }[filters.safety];
  const roomMatches = filters.roomType === '전체' || (filters.roomType === '원룸' && listing.roomNumber === 1) || (filters.roomType === '투룸' && listing.roomNumber === 2);
  const optionsMatch = Object.entries(filters.options).every(([option, required]) => !required || listing.features.includes({ elevator: '엘리베이터', parking: '주차 가능', cctv: 'CCTV', pets: '반려동물 가능' }[option]));
  return (filters.dealType === '전체' || listing.dealType === filters.dealType)
    && deposit <= filters.depositLimit
    && (!listing.rent || rent <= filters.rentLimit)
    && roomMatches
    && (!walkingLimit || listing.walkingMinutes <= walkingLimit)
    && (!safetyLimit || listing.safetyScore >= safetyLimit)
    && optionsMatch;
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  if (value.includes('억')) return Number(value.replace('억', '')) * 10000;
  return Number(value.replace(/,/g, '')) || 0;
}
