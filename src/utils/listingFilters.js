export function matchesListingFilters(listing, filters) {
  const deposit = parseMoney(listing.deposit);
  const rent = parseMoney(listing.rent);
  const monthlyDepositLimit = finiteLimit(filters.depositLimit);
  const jeonseLimit = finiteLimit(filters.jeonseLimit, monthlyDepositLimit);
  const rentLimit = finiteLimit(filters.rentLimit);
  const isJeonse = listing.dealType === '전세' || listing.contractType === 'JEONSE';
  const walkingLimit = { '10분 이내': 10, '15분 이내': 15, '20분 이내': 20 }[filters.walking];
  const safetyLimit = { '8점 이상': 8, '6점 이상': 6 }[filters.safety];
  const roomMatches = filters.roomType === '전체'
    || filters.roomType === '오피스텔'
    || filters.roomType === '아파트'
    || (filters.roomType === '원룸' && listing.roomNumber === 1)
    || (filters.roomType === '투룸' && listing.roomNumber === 2);
  const parkingMatches = !filters.options?.parking || !listing.metadata || listing.metadata.parkingCount > 0;
  const walkingMatches = !walkingLimit || listing.walkingMinutes === null || listing.walkingMinutes === undefined || listing.walkingMinutes <= walkingLimit;
  const safetyMatches = !safetyLimit || listing.safetyScore === null || listing.safetyScore === undefined || listing.safetyScore >= safetyLimit;
  const priceMatches = isJeonse
    ? deposit <= jeonseLimit
    : deposit <= monthlyDepositLimit && (!listing.rent || rent <= rentLimit);

  return (filters.dealType === '전체' || listing.dealType === filters.dealType)
    && priceMatches
    && roomMatches
    && walkingMatches
    && safetyMatches
    && parkingMatches;
}

function finiteLimit(value, fallback = Number.POSITIVE_INFINITY) {
  return Number.isFinite(value) ? value : fallback;
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  if (value.includes('억')) return Number(value.replace('억', '')) * 10000;
  return Number(value.replace(/,/g, '')) || 0;
}
