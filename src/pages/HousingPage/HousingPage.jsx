import { useEffect, useRef, useState } from 'react';
import { RegistryAnalysisOverlay } from '../../components';
import { canAutoOpenResidenceVerification, useListingReviews, useListings, useResidenceVerification, useUserPreferences } from '../../hooks';
import Sidebar from '../../sections/Sidebar';
import Topbar from '../../sections/Topbar';
import MapExplorer from '../../sections/MapExplorer';
import ListingPreview from '../../sections/ListingPreview/ListingPreview';
import BuildingListingsPanel from '../../sections/BuildingListingsPanel';
import FilterPanel from '../../sections/FilterPanel/FilterPanel';
import ChatAssistant from '../../sections/ChatAssistant';
import ReviewFormModal from '../../sections/ReviewFormModal';
import FavoritesSection from '../../sections/FavoritesSection';
import MarketAnalysis from '../../sections/MarketAnalysis';
import ChecklistSection from '../../sections/ChecklistSection';
import ProfileSection from '../../sections/ProfileSection/ProfileSection';
import OnboardingSection from '../../sections/OnboardingSection/OnboardingSection';
import ResidenceVerificationBanner from '../../sections/ResidenceVerificationBanner';
import ResidenceVerificationModal from '../../sections/ResidenceVerificationModal';
import RiskDiagnosisGuide from '../../sections/RiskDiagnosisGuide';
import { applyRegistrySubmissionToListing, buildRegistrySubmissionMetadata, createListingReview, deleteListingReview, getListingDetail, getMyWishList, pollRegistrySubmission, shouldRefreshListingAfterRegistrySubmission, toggleFavorite, updateListingReview, uploadRegistryDocument } from '../../services';
import { getRegistryStatus } from '../../utils/registry';
import './HousingPage.css';

const defaultFilters = { dealType: '전체', depositLimit: 15000, rentLimit: 100, roomType: '전체', walking: '전체', safety: '전체', options: { elevator: false, parking: false, cctv: false, pets: false } };
const registryPollingOptions = { intervalMs: 10000, maxAttempts: 30 };

export default function HousingPage({ isAuthenticated, userId, username, onRequireLogin, onLogout }) {
  const [activePage, setActivePage] = useState('home');
  const [selectedListing, setSelectedListing] = useState(null);
  const [selectedBuildingListings, setSelectedBuildingListings] = useState([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState('');
  const [favorites, setFavorites] = useState([]);
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState('');
  const [compareIds, setCompareIds] = useState([]);
  const [registryUploads, setRegistryUploads] = useState({});
  const [registryAnalysis, setRegistryAnalysis] = useState(null);
  const registryAnalysisTimerRef = useRef(null);
  const [onboardingMode, setOnboardingMode] = useState(null);
  const [riskGuideOpen, setRiskGuideOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [verificationDismissed, setVerificationDismissed] = useState(false);
  const [isResidenceVerificationOpen, setIsResidenceVerificationOpen] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const { listings, isLoading: isListingLoading, error: listingError } = useListings(filters);
  const { reviews: listingReviews, averageRating, isLoading: isReviewsLoading, error: reviewsError, refetch: refetchReviews } = useListingReviews(selectedListing?.id);
  const shownListings = listings.filter((listing) => matchesFilters(listing, filters));
  const residenceVerification = useResidenceVerification(isAuthenticated, userId);
  const { preferences, savePreferences, requiredOnboardingMode } = useUserPreferences(userId, isAuthenticated);

  useEffect(() => {
    if (requiredOnboardingMode) setOnboardingMode(requiredOnboardingMode);
  }, [requiredOnboardingMode]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsResidenceVerificationOpen(false);
      return;
    }
    if (canAutoOpenResidenceVerification({
      isAuthenticated,
      requiredOnboardingMode,
      onboardingMode,
      shouldAutoOpen: residenceVerification?.shouldAutoOpen,
      status: residenceVerification?.status,
    })) {
      setIsResidenceVerificationOpen(true);
    }
  }, [isAuthenticated, requiredOnboardingMode, onboardingMode, residenceVerification?.shouldAutoOpen, residenceVerification?.status]);

  useEffect(() => {
    let active = true;
    async function loadFavorites() {
      if (!isAuthenticated) {
        setFavorites([]);
        setFavoriteListings([]);
        setFavoritesError('');
        return;
      }

      setIsFavoritesLoading(true);
      setFavoritesError('');
      try {
        const wishlist = await getMyWishList();
        if (!active) return;
        setFavoriteListings(wishlist);
        setFavorites(wishlist.map((listing) => listing.id));
      } catch {
        if (active) setFavoritesError('찜 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
      } finally {
        if (active) setIsFavoritesLoading(false);
      }
    }
    loadFavorites();
    return () => { active = false; };
  }, [isAuthenticated]);

  useEffect(() => () => {
    if (registryAnalysisTimerRef.current) clearTimeout(registryAnalysisTimerRef.current);
  }, []);

  const openOnboarding = (mode = 'all') => setOnboardingMode(mode);
  const closeOnboarding = () => setOnboardingMode(null);
  const deferOnboarding = () => savePreferences({ onboardingDeferred: true });
  const handleFavorite = async (id) => {
    if (!isAuthenticated) return onRequireLogin();
    const willFavorite = !favorites.map(String).includes(String(id));
    setFavorites((items) => willFavorite ? [...items, id] : items.filter((item) => String(item) !== String(id)));
    if (willFavorite) {
      const listing = findListingById(id, [selectedListing, ...selectedBuildingListings, ...listings, ...favoriteListings]);
      if (listing) setFavoriteListings((items) => mergeListingsById(items, [listing]));
    } else {
      setFavoriteListings((items) => items.filter((item) => String(item.id) !== String(id)));
      setCompareIds((items) => items.filter((item) => String(item) !== String(id)));
    }

    try {
      await toggleFavorite(id, willFavorite);
      const wishlist = await getMyWishList();
      setFavoriteListings(wishlist);
      setFavorites(wishlist.map((listing) => listing.id));
    } catch {
      setFavorites((items) => willFavorite ? items.filter((item) => String(item) !== String(id)) : mergeIds(items, [id]));
      if (willFavorite) {
        setFavoriteListings((items) => items.filter((item) => String(item.id) !== String(id)));
      } else {
        const listing = findListingById(id, [selectedListing, ...selectedBuildingListings, ...listings, ...favoriteListings]);
        if (listing) setFavoriteListings((items) => mergeListingsById(items, [listing]));
      }
      window.alert('찜 목록을 변경하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };
  const handleCompare = (id) => setCompareIds((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length < 3 ? [...items, id] : items);
  const handleRegistryUpload = async (listingId, file, metadata) => {
    const listing = findListingById(listingId, [selectedListing, ...selectedBuildingListings, ...listings]);
    const upload = await uploadRegistryDocument(listingId, file, buildRegistrySubmissionMetadata(listing || { id: listingId }, userId, metadata));
    setRegistryUploads((uploads) => ({ ...uploads, [listingId]: upload }));
    const submissionId = getSubmissionId(upload);
    if (submissionId) {
      setRegistryAnalysis({ listingId, status: upload?.status || 'QUEUED' });
      pollRegistrySubmission(submissionId, registryPollingOptions)
        .then(async (submission) => {
          setRegistryUploads((uploads) => ({ ...uploads, [listingId]: submission }));
          showRegistryAnalysisResult(listingId, submission);
          if (shouldRefreshListingAfterRegistrySubmission(submission)) await refreshAnalyzedListing(listingId, submission);
        })
        .catch(() => {
          setRegistryUploads((uploads) => ({ ...uploads, [listingId]: { ...uploads[listingId], submissionId, status: 'FAILED' } }));
          showRegistryAnalysisResult(listingId, { submissionId, status: 'FAILED' });
        });
    } else {
      showRegistryAnalysisResult(listingId, upload);
    }
    return upload;
  };
  const showRegistryAnalysisResult = (listingId, submission) => {
    const registryStatus = getRegistryStatus(submission);
    if (registryStatus === 'NOT_UPLOADED' || registryStatus === 'PENDING') return;
    if (registryAnalysisTimerRef.current) clearTimeout(registryAnalysisTimerRef.current);
    setRegistryAnalysis({ listingId, status: submission?.status || registryStatus });
    registryAnalysisTimerRef.current = setTimeout(() => {
      setRegistryAnalysis(null);
      registryAnalysisTimerRef.current = null;
    }, 1400);
  };
  const refreshAnalyzedListing = async (listingId, submission) => {
    try {
      const detail = await getListingDetail(listingId);
      const analyzedDetail = applyRegistrySubmissionToListing(detail, submission);
      setSelectedListing((current) => String(current?.id) === String(listingId) ? analyzedDetail : current);
      setSelectedBuildingListings((items) => items.map((item) => String(item.id) === String(listingId) ? analyzedDetail : item));
      return analyzedDetail;
    } catch {
      setSelectedListing((current) => String(current?.id) === String(listingId) ? applyRegistrySubmissionToListing(current, submission) : current);
      setSelectedBuildingListings((items) => items.map((item) => String(item.id) === String(listingId) ? applyRegistrySubmissionToListing(item, submission) : item));
      return null;
    }
  };
  const handleInquiry = async (listing) => {
    if (!isAuthenticated) return onRequireLogin();
    window.alert(`${listing.agent.name} 공인중개사에게 문의를 준비했어요.`);
  };
  const handleReviewSubmit = async (review) => {
    if (!selectedListing) return;
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }

    setIsReviewSubmitting(true);
    setReviewSubmitError('');
    try {
      if (editingReview) {
        await updateListingReview(selectedListing.id, editingReview.id, review);
      } else {
        await createListingReview(selectedListing.id, review);
      }
      setIsReviewFormOpen(false);
      setEditingReview(null);
      refetchReviews();
    } catch {
      setReviewSubmitError('리뷰를 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsReviewSubmitting(false);
    }
  };
  const openReviewWriter = () => {
    if (!isAuthenticated) return onRequireLogin();
    setEditingReview(null);
    setReviewSubmitError('');
    setIsReviewFormOpen(true);
  };
  const openReviewEditor = (review) => {
    if (!isAuthenticated) return onRequireLogin();
    setEditingReview(review);
    setReviewSubmitError('');
    setIsReviewFormOpen(true);
  };
  const handleReviewDelete = async (review) => {
    if (!selectedListing) return;
    if (!window.confirm('작성한 리뷰를 삭제할까요?')) return;
    setReviewSubmitError('');
    try {
      await deleteListingReview(selectedListing.id, review.id);
      refetchReviews();
    } catch {
      setReviewSubmitError('리뷰를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      setIsReviewFormOpen(true);
      setEditingReview(null);
    }
  };
  const loadListingDetail = async (listing) => {
    setIsDetailLoading(true);
    setDetailError('');
    try {
      const detail = await getListingDetail(listing.id);
      setSelectedListing(detail);
      return detail;
    } catch {
      // Keep the list response usable when the detail request is temporarily unavailable.
      setDetailError('매물 상세 정보를 불러오지 못해 목록 정보를 표시합니다.');
      setSelectedListing(listing);
      return listing;
    } finally {
      setIsDetailLoading(false);
    }
  };
  const openDetail = async (listing) => {
    await loadListingDetail(listing);
    setActivePage('home');
  };
  const handleMapListingSelect = async (listing) => {
    setSelectedBuildingListings([]);
    setSelectedListing(null);
    await loadListingDetail(listing);
  };
  const handleBuildingSelect = (buildingListings) => {
    setSelectedListing(null);
    setSelectedBuildingListings(buildingListings);
  };
  const handleBuildingListingSelect = async (listing) => {
    await loadListingDetail(listing);
  };
  const handleFilterChange = (nextFilters) => {
    setFilters(nextFilters);
    if (selectedListing && !matchesFilters(selectedListing, nextFilters)) setSelectedListing(null);
  };
  const resetFilters = () => setFilters(defaultFilters);
  const openResidenceVerification = () => {
    if (!isAuthenticated) return onRequireLogin();
    setIsResidenceVerificationOpen(true);
  };
  const deferResidenceVerification = async () => residenceVerification?.deferVerification();
  const completeResidenceVerification = (history) => residenceVerification?.completeVerification(history);
  const uploadResidenceVerificationDocument = (file) => residenceVerification?.uploadVerification(file);
  const openFavoritesFromRiskGuide = () => {
    setRiskGuideOpen(false);
    setActivePage('favorites');
    setSelectedListing(null);
  };
  const statusMessage = isDetailLoading
    ? '매물 상세 정보를 불러오는 중이에요.'
    : isListingLoading
      ? '매물 정보를 불러오는 중이에요.'
      : detailError || listingError;
  const homeContent = <><Topbar mapOnly count={shownListings.length} onOpenFilter={() => setFilterOpen(true)} isAuthenticated={isAuthenticated} username={username} userId={userId} onLogin={onRequireLogin} onLogout={onLogout} />{!verificationDismissed && <ResidenceVerificationBanner verification={residenceVerification} onOpen={openResidenceVerification} onDismiss={() => setVerificationDismissed(true)} />}<div className="housing-page__map"><MapExplorer listings={shownListings} onSelect={handleMapListingSelect} onSelectBuilding={handleBuildingSelect} />{statusMessage && <p className="housing-page__loading">{statusMessage}</p>}{selectedBuildingListings.length > 0 && !selectedListing && <BuildingListingsPanel listings={selectedBuildingListings} onClose={() => setSelectedBuildingListings([])} onSelect={handleBuildingListingSelect} />}{selectedListing && <ListingPreview listing={selectedListing} reviews={listingReviews} averageRating={averageRating} isReviewLoading={isReviewsLoading} reviewsError={reviewsError} currentUserId={userId} registryUpload={registryUploads[selectedListing.id]} isFavorite={favorites.map(String).includes(String(selectedListing.id))} isLocked={!isAuthenticated} onClose={() => setSelectedListing(null)} onFavorite={handleFavorite} onInquiry={handleInquiry} onRequireLogin={onRequireLogin} onWriteReview={openReviewWriter} onEditReview={openReviewEditor} onDeleteReview={handleReviewDelete} onUploadRegistry={handleRegistryUpload} />}</div></>;
  const content = activePage === 'home' ? homeContent : activePage === 'favorites' ? <FavoritesSection listings={favoriteListings} favorites={favorites} isLoading={isFavoritesLoading} error={favoritesError} compareIds={compareIds} onSelect={openDetail} onFavorite={handleFavorite} onCompare={handleCompare} registryUploads={registryUploads} onUploadRegistry={handleRegistryUpload} /> : activePage === 'market' ? <MarketAnalysis listings={listings} /> : activePage === 'checklist' ? <ChecklistSection /> : <ProfileSection preferences={preferences} username={username} onOpenBuildingSettings={() => openOnboarding('building')} onOpenBudgetSettings={() => openOnboarding('budget')} onSavePreferences={savePreferences} />;

  const isMapPanelOpen = Boolean(selectedListing || selectedBuildingListings.length);
  return <main className="housing-page"><Sidebar activePage={activePage} hideRiskGuide={isMapPanelOpen} onNavigate={(page) => { if (!isAuthenticated && page !== 'home') return onRequireLogin(); setActivePage(page); setSelectedListing(null); setIsReviewFormOpen(false); }} onOpenRiskGuide={() => isAuthenticated ? setRiskGuideOpen(true) : onRequireLogin()} /><div className="housing-page__main">{content}</div>{!filterOpen && !isMapPanelOpen && <ChatAssistant />}{filterOpen && <FilterPanel filters={filters} onChange={handleFilterChange} onClose={() => setFilterOpen(false)} onReset={resetFilters} count={shownListings.length} />}{onboardingMode && <OnboardingSection mode={onboardingMode} preferences={preferences} onClose={closeOnboarding} onDefer={deferOnboarding} onSave={savePreferences} />}{riskGuideOpen && <RiskDiagnosisGuide onClose={() => setRiskGuideOpen(false)} onGoToFavorites={openFavoritesFromRiskGuide} />}{isReviewFormOpen && selectedListing && <ReviewFormModal listing={selectedListing} verification={residenceVerification} initialReview={editingReview} isSubmitting={isReviewSubmitting} error={reviewSubmitError} onClose={() => { setIsReviewFormOpen(false); setEditingReview(null); }} onSubmit={handleReviewSubmit} />}{isResidenceVerificationOpen && <ResidenceVerificationModal verification={residenceVerification} onClose={() => setIsResidenceVerificationOpen(false)} onDefer={deferResidenceVerification} onComplete={completeResidenceVerification} onUpload={uploadResidenceVerificationDocument} />}{registryAnalysis && <RegistryAnalysisOverlay status={registryAnalysis.status} />}</main>;
}

function matchesFilters(listing, filters) {
  const deposit = parseMoney(listing.deposit);
  const rent = parseMoney(listing.rent);
  const walkingLimit = { '10분 이내': 10, '15분 이내': 15, '20분 이내': 20 }[filters.walking];
  const safetyLimit = { '8점 이상': 8, '6점 이상': 6 }[filters.safety];
  const roomMatches = filters.roomType === '전체' || filters.roomType === '오피스텔' || filters.roomType === '아파트' || (filters.roomType === '원룸' && listing.roomNumber === 1) || (filters.roomType === '투룸' && listing.roomNumber === 2);
  const parkingMatches = !filters.options.parking || !listing.metadata || listing.metadata.parkingCount > 0;
  const walkingMatches = !walkingLimit || listing.walkingMinutes === null || listing.walkingMinutes === undefined || listing.walkingMinutes <= walkingLimit;
  const safetyMatches = !safetyLimit || listing.safetyScore === null || listing.safetyScore === undefined || listing.safetyScore >= safetyLimit;
  return (filters.dealType === '전체' || listing.dealType === filters.dealType)
    && deposit <= filters.depositLimit
    && (!listing.rent || rent <= filters.rentLimit)
    && roomMatches
    && walkingMatches
    && safetyMatches
    && parkingMatches;
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  if (value.includes('억')) return Number(value.replace('억', '')) * 10000;
  return Number(value.replace(/,/g, '')) || 0;
}

function findListingById(listingId, listings) {
  return listings.find((listing) => listing && String(listing.id) === String(listingId));
}

function mergeIds(currentIds, nextIds) {
  return Array.from(new Set([...currentIds.map(String), ...nextIds.map(String)]));
}

function mergeListingsById(currentListings, nextListings) {
  const listingMap = new Map(currentListings.map((listing) => [String(listing.id), listing]));
  nextListings.filter(Boolean).forEach((listing) => listingMap.set(String(listing.id), listing));
  return Array.from(listingMap.values());
}

function getSubmissionId(upload) {
  return upload?.submissionId ?? upload?.submission_id ?? upload?.id ?? null;
}
