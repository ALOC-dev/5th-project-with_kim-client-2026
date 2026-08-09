const listingSearchCache = new Map();
const listingSearchInFlight = new Map();
const listingDetailCache = new Map();
const listingDetailInFlight = new Map();

export const readListingSearchCache = (key) => listingSearchCache.get(key);

export const loadListingSearchWithCache = (key, loader) => {
  if (listingSearchCache.has(key)) {
    return Promise.resolve(listingSearchCache.get(key));
  }

  if (listingSearchInFlight.has(key)) {
    return listingSearchInFlight.get(key);
  }

  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      listingSearchCache.set(key, value);
      return value;
    })
    .finally(() => {
      listingSearchInFlight.delete(key);
    });

  listingSearchInFlight.set(key, request);
  return request;
};

const normalizeDetailKey = (listingId) => String(listingId);

export const readListingDetailCache = (listingId) => listingDetailCache.get(normalizeDetailKey(listingId));

export const loadListingDetailWithCache = (listingId, loader) => {
  const key = normalizeDetailKey(listingId);

  if (listingDetailCache.has(key)) {
    return Promise.resolve(listingDetailCache.get(key));
  }

  if (listingDetailInFlight.has(key)) {
    return listingDetailInFlight.get(key);
  }

  const request = Promise.resolve()
    .then(loader)
    .then((value) => {
      listingDetailCache.set(key, value);
      return value;
    })
    .finally(() => {
      listingDetailInFlight.delete(key);
    });

  listingDetailInFlight.set(key, request);
  return request;
};

export const writeListingDetailCache = (listing) => {
  listingDetailCache.set(normalizeDetailKey(listing.id), listing);
};

export const clearListingMemoryCache = () => {
  listingSearchCache.clear();
  listingSearchInFlight.clear();
  listingDetailCache.clear();
  listingDetailInFlight.clear();
};
