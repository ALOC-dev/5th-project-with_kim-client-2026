import { useEffect, useMemo, useState } from 'react';
import { getCachedNeighborhoodPriceStatisticsByCodes } from '../../services';
import './MarketAnalysis.css';

const DONGDAEMUN_SGG_CODE = '11230';
const marketAreas = [
  { code: '10100', name: '신설동' },
  { code: '10200', name: '용두동' },
  { code: '10300', name: '제기동' },
  { code: '10400', name: '전농동' },
  { code: '10500', name: '답십리동' },
  { code: '10600', name: '장안동' },
  { code: '10700', name: '청량리동' },
  { code: '10800', name: '회기동' },
  { code: '10900', name: '휘경동' },
  { code: '11000', name: '이문동' },
];

export default function MarketAnalysis() {
  const [emdCd, setEmdCd] = useState('10900');
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const selectedArea = marketAreas.find((area) => area.code === emdCd);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError('');
    getCachedNeighborhoodPriceStatisticsByCodes(DONGDAEMUN_SGG_CODE, emdCd)
      .then((response) => {
        if (active) setStatistics(response);
      })
      .catch(() => {
        if (active) {
          setStatistics(null);
          setError('시세 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [emdCd]);

  const priceCards = useMemo(() => buildPriceCards(statistics), [statistics]);
  const maxListingCount = Math.max(...priceCards.map((card) => card.listingCount), 1);

  return <section className="content-section market-analysis">
    <header>
      <div><h1>시세 분석</h1><p>{statistics?.neighborhoodName || selectedArea?.name}의 등록 매물 평균을 분석했어요.</p></div>
      <label className="market-analysis__area"><span>지역 선택</span><select aria-label="시세 분석 지역" value={emdCd} onChange={(event) => setEmdCd(event.target.value)}>{marketAreas.map((area) => <option key={area.code} value={area.code}>{area.name}</option>)}</select></label>
    </header>

    {isLoading ? <p className="market-analysis__state">시세 정보를 불러오는 중이에요.</p> : error ? <p className="market-analysis__state is-error">{error}</p> : <>
      <div className="market-analysis__summary">{priceCards.map((card) => <article key={card.type}><span>{card.title}</span><strong>{card.price}</strong><em>{card.managementFee}</em></article>)}</div>
      <section className="market-analysis__chart">
        <h2>거래 유형별 등록 매물</h2>
        <div className="chart-bars">{priceCards.map((card) => <div key={card.type}><b>{card.type} 매물 {card.listingCount}개</b><i style={{ height: `${Math.max(12, (card.listingCount / maxListingCount) * 150)}px` }} /><span>{card.type}</span></div>)}</div>
      </section>
    </>}

    <section className="market-analysis__tip"><b>시세를 이렇게 활용해 보세요</b><p>평균 금액은 같은 법정동에 등록된 매물 기준입니다. 면적과 층수, 관리비를 함께 비교해 보세요.</p></section>
  </section>;
}

function buildPriceCards(statistics) {
  return [
    {
      type: '월세',
      title: '평균 월세',
      price: statistics ? `보증금 ${formatWon(statistics.averageMonthlyDeposit, 1000000)} / 월 ${formatWon(statistics.averageMonthlyRent)}` : '-',
      managementFee: buildManagementFeeLabel(statistics?.averageMonthlyManagementFee),
      listingCount: Number(statistics?.monthlyRentListingCount) || 0,
    },
    {
      type: '전세',
      title: '평균 전세 보증금',
      price: statistics ? formatWon(statistics.averageJeonseDeposit, 1000000) : '-',
      managementFee: buildManagementFeeLabel(statistics?.averageJeonseManagementFee),
      listingCount: Number(statistics?.jeonseListingCount) || 0,
    },
    {
      type: '매매',
      title: '평균 매매가',
      price: statistics ? formatWon(statistics.averageSalePrice, 1000000) : '-',
      managementFee: buildManagementFeeLabel(statistics?.averageSaleManagementFee),
      listingCount: Number(statistics?.saleListingCount) || 0,
    },
  ];
}

function formatWon(value, roundingUnit = 10000) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return '정보 없음';
  const roundedAmount = Math.ceil(amount / roundingUnit) * roundingUnit;
  return `${(roundedAmount / 10000).toLocaleString('ko-KR')}만원`;
}

function buildManagementFeeLabel(value) {
  const formatted = formatWon(value);
  return formatted === '정보 없음' ? '평균 관리비 정보 없음' : `평균 관리비 ${formatted}`;
}
