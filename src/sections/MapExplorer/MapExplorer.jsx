import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import KakaoMap from '../../components/KakaoMap/KakaoMap';
import { ENABLED_INFRASTRUCTURE_CATEGORIES } from '../../constants/infrastructures';
import { getInfrastructuresByCategory } from '../../services';
import './MapExplorer.css';

export default function MapExplorer({ listings = [], isLoading = false, onSelect, onSelectBuilding, onCenterChange }) {
  const [infrastructuresByCategory, setInfrastructuresByCategory] = useState({});
  const requestedCategoriesRef = useRef(new Set());
  const mountedRef = useRef(true);
  const listingFacilities = useMemo(() => listings.flatMap((listing) => Array.isArray(listing.facilities) ? listing.facilities : []), [listings]);
  const infrastructureFacilities = useMemo(() => Object.values(infrastructuresByCategory).flat(), [infrastructuresByCategory]);
  const facilities = useMemo(() => [...infrastructureFacilities, ...listingFacilities], [infrastructureFacilities, listingFacilities]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleFacilityTypeChange = useCallback((category) => {
    if (!category || !ENABLED_INFRASTRUCTURE_CATEGORIES.includes(category)) return;
    if (requestedCategoriesRef.current.has(category)) return;

    requestedCategoriesRef.current.add(category);
    getInfrastructuresByCategory(category)
      .then((infrastructures) => {
        if (!mountedRef.current) return;
        setInfrastructuresByCategory((current) => ({ ...current, [category]: infrastructures }));
      })
      .catch(() => {
        requestedCategoriesRef.current.delete(category);
      });
  }, []);

  return <section className="map-explorer"><KakaoMap listings={listings} facilities={facilities} isLoading={isLoading} onSelect={onSelect} onSelectBuilding={onSelectBuilding} onCenterChange={onCenterChange} onFacilityTypeChange={handleFacilityTypeChange} /></section>;
}
