import { useEffect, useRef, useState } from 'react';
import { getCachedListings, readCachedListings } from '../services';

export function useListings(filters, searchCenter) {
  const cachedListings = readCachedListings(filters, searchCenter);
  const hasCachedListings = cachedListings !== undefined;
  const [listings, setListings] = useState(cachedListings || []);
  const [isLoading, setIsLoading] = useState(!hasCachedListings);
  const [error, setError] = useState('');
  const filtersKey = JSON.stringify(filters || {});
  const previousFiltersKeyRef = useRef(filtersKey);
  const filtersChanged = previousFiltersKeyRef.current !== filtersKey;
  const visibleListings = hasCachedListings
    ? resolveListings(listings, cachedListings, filtersChanged)
    : listings;

  useEffect(() => {
    let active = true;
    const filtersChanged = previousFiltersKeyRef.current !== filtersKey;
    previousFiltersKeyRef.current = filtersKey;
    const cachedListings = readCachedListings(filters, searchCenter);

    if (cachedListings !== undefined) {
      setListings((currentListings) => resolveListings(currentListings, cachedListings, filtersChanged));
      setIsLoading(false);
      setError('');
      return () => { active = false; };
    }

    async function loadListings() {
      setIsLoading(true);
      setError('');
      try {
        const response = await getCachedListings(filters, searchCenter);
        if (active) {
          setListings((currentListings) => resolveListings(currentListings, response, filtersChanged));
        }
      } catch (requestError) {
        if (active) setError('매물 정보를 불러오지 못했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadListings();
    return () => { active = false; };
  }, [filters, filtersKey, searchCenter]);

  return { listings: visibleListings, isLoading: hasCachedListings ? false : isLoading, error };
}

function resolveListings(currentListings, nextListings, filtersChanged) {
  if (filtersChanged) return nextListings;
  if (nextListings.length === 0) return currentListings;
  return mergeListingsById(currentListings, nextListings);
}

function mergeListingsById(currentListings, nextListings) {
  const listingsById = new Map(currentListings.map((listing) => [String(listing.id), listing]));
  let changed = false;
  nextListings.forEach((listing) => {
    const id = String(listing.id);
    if (listingsById.get(id) === listing) return;
    listingsById.set(id, listing);
    changed = true;
  });
  return changed ? Array.from(listingsById.values()) : currentListings;
}
