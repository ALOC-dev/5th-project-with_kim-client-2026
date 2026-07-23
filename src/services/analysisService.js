export async function getMarketAnalysis() {
  // TODO: API 연동 필요 - GET '-'
  // 설명: 지역별 기간 단위 시세, 평균 가격, 신규 매물 수를 포함한 분석 응답을 기대합니다.
  return Promise.resolve(null);
}

export async function getContractChecklist() {
  // TODO: API 연동 필요 - GET '-'
  // 설명: 사용자별 계약 체크리스트 항목과 완료 상태 응답을 기대합니다.
  return Promise.resolve([]);
}

export async function updateContractChecklist(itemId, completed) {
  // TODO: API 연동 필요 - PUT '-'
  // 설명: 계약 체크리스트 한 항목의 완료 상태 변경 결과를 기대합니다.
  return Promise.resolve({ itemId, completed });
}
