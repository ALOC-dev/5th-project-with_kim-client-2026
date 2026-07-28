export async function getUserProfile() {
  // TODO: API 연동 필요 - GET '-'
  // 설명: 로그인 사용자 정보, 학교 건물 설정, 알림 설정과 찜한 매물 식별자 응답을 기대합니다.
  return Promise.resolve(null);
}

export async function getResidenceVerification() {
  // TODO: API 연동 필요 - GET '-'
  // 설명: 로그인 사용자의 실거주 인증 여부, 인증 주소, 리뷰 혜택 문구를 반환하는 응답이 필요합니다.
  // 인증 API가 연결되기 전에는 완료 상태를 추정하지 않습니다.
  return Promise.resolve(null);
}

export async function updateUserPreferences(preferences) {
  // TODO: API 연동 필요 - PUT '-'
  // 설명: 사용자의 수업 건물 목록, 보증금·월세 예산, 알림 수신 여부 변경 결과를 기대합니다.
  return Promise.resolve(preferences);
}
