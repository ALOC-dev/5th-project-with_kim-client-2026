import { useEffect, useState } from 'react';
import ListingCard from '../../components/ListingCard';
import { buildNeighborhoodPriceSummary, getCachedNeighborhoodPriceStatistics, getComparedListings } from '../../services';
import { formatListingPrice } from '../../utils/price';
import './FavoritesSection.css';

export default function FavoritesSection({ listings, favorites, isLoading = false, error = '', compareIds, onSelect, onFavorite, onCompare, registryUploads = {}, onUploadRegistry }) {
  const favoriteIds = favorites.map(String);
  const selectedCompareIds = compareIds.map(String).slice(0, 3);
  const favoriteListings = listings.filter((listing) => favoriteIds.includes(String(listing.id)));
  const favoriteKey = favoriteListings.map((listing) => listing.id).join(',');
  const compareKey = selectedCompareIds.join(',');
  const [marketSummaries, setMarketSummaries] = useState({});
  const [comparedListings, setComparedListings] = useState([]);
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonError, setComparisonError] = useState('');

  useEffect(() => {
    if (!favoriteListings.length) {
      setMarketSummaries({});
      return undefined;
    }

    let active = true;
    Promise.all(favoriteListings.map(async (listing) => {
      try {
        const statistics = await getCachedNeighborhoodPriceStatistics(listing.id);
        return [String(listing.id), buildNeighborhoodPriceSummary(listing, statistics)];
      } catch {
        return [String(listing.id), null];
      }
    })).then((entries) => {
      if (active) setMarketSummaries(Object.fromEntries(entries));
    });

    return () => {
      active = false;
    };
  // favoriteKey represents the visible favorite house IDs and avoids requests on unrelated renders.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteKey]);

  const listingsWithMarket = favoriteListings.map((listing) => enrichListingWithMarket(listing, marketSummaries[listing.id]));

  useEffect(() => {
    if (selectedCompareIds.length < 2) {
      setComparedListings([]);
      setComparisonLoading(false);
      setComparisonError('');
      return undefined;
    }

    let active = true;
    setComparisonLoading(true);
    setComparisonError('');

    getComparedListings(selectedCompareIds)
      .then((response) => {
        if (active) setComparedListings(response);
      })
      .catch((requestError) => {
        if (!active) return;
        setComparedListings([]);
        setComparisonError(requestError.message || '비교 매물을 불러오지 못했어요.');
      })
      .finally(() => {
        if (active) setComparisonLoading(false);
      });

    return () => {
      active = false;
    };
  // compareKey captures the ordered set of selected house IDs without retriggering on array identity changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compareKey]);

  return (
    <section className="content-section favorites-section">
      <header><div><h1>찜한 매물</h1><p>나중에 비교할 매물을 모아 두었어요.</p></div><b>{favoriteListings.length}개</b></header>
      {isLoading ? (
        <EmptyState title="찜 목록을 불러오는 중이에요." description="잠시만 기다려 주세요." />
      ) : error ? (
        <EmptyState title="찜 목록을 불러오지 못했어요." description={error} />
      ) : favoriteListings.length ? (
        <>
          <div className="favorites-section__notice">최대 3개까지 선택해 주요 조건을 한눈에 비교할 수 있어요.</div>
          <div className="favorites-section__list">
            {listingsWithMarket.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                isFavorite
                onSelect={onSelect}
                onFavorite={onFavorite}
                compareSelected={selectedCompareIds.includes(String(listing.id))}
                onCompare={onCompare}
                registryUpload={registryUploads[listing.id]}
                onUploadRegistry={onUploadRegistry}
              />
            ))}
          </div>
          {selectedCompareIds.length > 1 && (
            <Comparison listings={comparedListings} marketSummaries={marketSummaries} isLoading={comparisonLoading} error={comparisonError} />
          )}
        </>
      ) : (
        <EmptyState title="아직 찜한 매물이 없어요." description="마음에 드는 매물의 하트를 눌러 보관해 보세요." />
      )}
    </section>
  );
}

function EmptyState({ title, description }) {
  return <div className="favorites-section__empty"><strong>{title}</strong><span>{description}</span></div>;
}

function Comparison({ listings, marketSummaries, isLoading, error }) {
  return (
    <section className="comparison" aria-live="polite">
      <h2>선택 매물 비교</h2>
      {isLoading ? <p className="comparison__state">비교 매물을 불러오는 중이에요.</p> : error ? <p className="comparison__state comparison__state--error">{error}</p> : (
        <div className="comparison__table">
          <ComparisonRow label="매물" listings={listings} value={(listing) => listing.address} isHeader />
          <ComparisonRow label="가격" listings={listings} value={formatListingPrice} />
          <ComparisonRow label="시세 대비" listings={listings} value={(listing) => marketSummaries[listing.id]?.differenceLabel} />
          <ComparisonRow label="인근 시세" listings={listings} value={(listing) => marketSummaries[listing.id]?.marketPriceLabel} />
          <ComparisonRow label="관리비" listings={listings} value={(listing) => listing.maintenance} />
          <ComparisonRow label="전용면적" listings={listings} value={(listing) => listing.area} />
          <ComparisonRow label="층수" listings={listings} value={(listing) => listing.floor} />
          <ComparisonRow label="방향" listings={listings} value={(listing) => listing.direction} />
          <ComparisonRow label="위험 분석" listings={listings} value={(listing) => listing.registryUpload ? listing.risk?.level : '분석 전'} />
        </div>
      )}
    </section>
  );
}

function enrichListingWithMarket(listing, summary) {
  if (!summary) return listing;
  return {
    ...listing,
    marketDiff: summary.differenceLabel,
    marketPrice: summary.marketPriceLabel,
  };
}

function ComparisonRow({ label, listings, value, isHeader = false }) {
  return (
    <div className={`comparison__row ${isHeader ? 'comparison__row--header' : ''}`} style={{ '--comparison-count': listings.length }}>
      <b>{label}</b>
      {listings.map((listing) => <span key={listing.id}>{value(listing) || '정보 없음'}</span>)}
    </div>
  );
}
