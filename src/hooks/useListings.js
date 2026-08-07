import { useEffect, useRef, useState } from 'react';
import { getListings } from '../services';

export function useListings(filters, searchCenter) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const filtersKey = JSON.stringify(filters || {});
  const previousFiltersKeyRef = useRef(filtersKey);

  useEffect(() => {
    let active = true;
    const filtersChanged = previousFiltersKeyRef.current !== filtersKey;
    previousFiltersKeyRef.current = filtersKey;

    async function loadListings() {
      setIsLoading(true);
      setError('');
      try {
        const response = await getListings(filters, searchCenter);
        if (active) {
          setListings((currentListings) => {
            if (filtersChanged) return response;
            if (response.length === 0) return currentListings;
            return mergeListingsById(currentListings, response);
          });
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

  return { listings, isLoading, error };
}

function mergeListingsById(currentListings, nextListings) {
  const listingsById = new Map(currentListings.map((listing) => [String(listing.id), listing]));
  nextListings.forEach((listing) => listingsById.set(String(listing.id), listing));
  return Array.from(listingsById.values());
}
