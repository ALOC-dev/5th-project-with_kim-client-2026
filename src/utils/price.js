export function formatListingPrice(listing) {
  if (listing.dealType === '전세') return `전세금 ${formatManwon(listing.deposit)}`;
  if (listing.dealType === '매매') return `매매가 ${formatManwon(listing.deposit)}`;
  return `보증금 ${formatManwon(listing.deposit)} / 월 ${formatManwon(listing.rent)}`;
}

export function formatMapPrice(listing) {
  if (listing.dealType === '전세') return `전세 ${formatAmount(listing.deposit)}`;
  if (listing.dealType === '매매') return `매매 ${formatAmount(listing.deposit)}`;
  return `월세 ${formatAmount(listing.deposit)}/${formatAmount(listing.rent)}`;
}

function formatManwon(value) {
  const amount = formatAmount(value);
  if (amount === '정보 없음') return amount;
  return hasCurrencyUnit(String(value)) ? amount : `${amount}만원`;
}

function formatAmount(value) {
  if (value === null || value === undefined || value === '') return '정보 없음';
  const normalized = String(value).replaceAll(',', '').trim();
  const amount = Number(normalized);
  if (Number.isFinite(amount)) return amount.toLocaleString('ko-KR');
  return String(value);
}

function hasCurrencyUnit(value) {
  return /만원|억|원/.test(value);
}
