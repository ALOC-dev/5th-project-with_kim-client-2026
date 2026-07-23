import './MarketAnalysis.css';

export default function MarketAnalysis({ listings }) {
  const average = Math.round(listings.filter((listing) => listing.rent).reduce((total, listing) => total + Number(listing.rent), 0) / listings.filter((listing) => listing.rent).length);
  return <section className="content-section market-analysis"><header><div><h1>시세 분석</h1><p>시립대 인근 실거래·등록 매물을 분석했어요.</p></div><button>지역 선택</button></header><div className="market-analysis__summary"><div><span>인근 원룸 평균 월세</span><strong>{average}만원</strong><em>지난달 대비 -1%</em></div><div><span>안전 매물 비율</span><strong>82%</strong><em>등기부 분석 완료 기준</em></div><div><span>이번 주 신규 매물</span><strong>12개</strong><em>전주 대비 +3개</em></div></div><section className="market-analysis__chart"><h2>최근 6개월 월세 시세</h2><div className="chart-bars">{[46, 47, 45, 48, 46, average].map((value, index) => <div key={index}><i style={{ height: `${value * 3}px` }} /><span>{index + 1}월</span><b>{value}</b></div>)}</div></section><section className="market-analysis__tip"><b>시세를 이렇게 활용해 보세요</b><p>인근 평균보다 지나치게 저렴한 전세 매물은 등기부와 보증보험 가입 여부를 꼭 함께 확인하세요.</p></section></section>;
}
