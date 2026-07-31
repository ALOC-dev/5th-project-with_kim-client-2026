import ListingCard from '../../components/ListingCard';
import { formatListingPrice } from '../../utils/price';
import './FavoritesSection.css';

export default function FavoritesSection({ listings, favorites, isLoading = false, error = '', compareIds, onSelect, onFavorite, onCompare, registryUploads, onUploadRegistry }) {
  const favoriteIds = favorites.map(String);
  const selectedCompareIds = compareIds.map(String);
  const favoriteListings = listings.filter((listing) => favoriteIds.includes(String(listing.id)));
  return <section className="content-section favorites-section"><header><div><h1>찜한 매물</h1><p>나중에 비교할 매물을 모아 두었어요.</p></div><b>{favoriteListings.length}개</b></header>{isLoading ? <div className="favorites-section__empty"><strong>찜 목록을 불러오는 중이에요.</strong><span>잠시만 기다려 주세요.</span></div> : error ? <div className="favorites-section__empty"><strong>찜 목록을 불러오지 못했어요.</strong><span>{error}</span></div> : favoriteListings.length ? <><div className="favorites-section__notice">최대 3개까지 선택해 주요 조건을 한눈에 비교할 수 있어요.</div><div className="favorites-section__list">{favoriteListings.map((listing) => <ListingCard key={listing.id} listing={listing} isFavorite onSelect={onSelect} onFavorite={onFavorite} compareSelected={selectedCompareIds.includes(String(listing.id))} onCompare={onCompare} registryUpload={registryUploads[listing.id]} onUploadRegistry={onUploadRegistry} />)}</div>{compareIds.length > 1 && <Comparison listings={favoriteListings.filter((listing) => selectedCompareIds.includes(String(listing.id)))} />}</> : <div className="favorites-section__empty"><strong>아직 찜한 매물이 없어요.</strong><span>마음에 드는 매물의 하트를 눌러 보관해 보세요.</span></div>}</section>;
}
function Comparison({ listings }) { return <section className="comparison"><h2>선택 매물 비교</h2><div>{['가격', '안전 점수', '학교까지', '리뷰 평점'].map((label) => <div className="comparison__row" key={label}><b>{label}</b>{listings.map((listing) => <span key={listing.id}>{label === '가격' ? formatListingPrice(listing) : label === '안전 점수' ? listing.safetyScore : label === '학교까지' ? `도보 ${listing.walkingMinutes}분` : listing.rating}</span>)}</div>)}</div></section>; }
