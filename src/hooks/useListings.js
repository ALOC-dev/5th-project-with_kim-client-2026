import { useEffect, useState } from 'react';
import { getListings } from '../services';

export function useListings(filters) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadListings() {
      setIsLoading(true);
      setError('');
      try {
        const response = await getListings(filters);
        if (active) setListings(response);
      } catch (requestError) {
        if (active) setError('매물 정보를 불러오지 못했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.');
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadListings();
    return () => { active = false; };
  }, [filters]);

  return { listings, isLoading, error };
}
