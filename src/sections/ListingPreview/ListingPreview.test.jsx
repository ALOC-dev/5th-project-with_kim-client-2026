import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ListingPreview from './ListingPreview';

const listing = {
  id: 1,
  title: '서울 동대문구 전농동 295-1',
  rent: 55,
  deposit: 500,
  dealType: '월세',
  safetyScore: 8.5,
  summary: '시립대 정문 앞 신축 원룸',
  marketDiff: '정보 없음',
  marketPrice: '55만원',
  roomType: '원룸',
  direction: '남향',
  area: '24.2m²',
  supplyArea: '24.2m²',
  floor: '3층',
  maintenance: '월 6만원',
  walkingMinutes: 6,
  distance: '',
  risk: { mortgage: '없음', level: '안전', ratio: '-', lh: '-', hug: '-' },
  agent: { name: '김중개', office: '시립 부동산', license: '등록번호 1' },
  metadata: {
    restaurantCount: 199,
    cafeCount: 35,
    bankCount: 19,
    convenienceStoreCount: 18,
    parkingCount: 14,
    pharmacyCount: 8,
    hospitalCount: 6,
    subwayCount: 1,
    POCount: 1,
  },
};

const jeonseListing = {
  ...listing,
  id: 2,
  dealType: '전세',
  rent: 0,
  deposit: 5000,
  risk: { mortgage: '없음', level: '안전', ratio: '62%', lh: '가능', hug: '확인필요' },
};

const reviews = [
  { id: 1, initial: '김', name: '김시립', rating: 5, period: '2026.07', text: '채광이 좋아요.' },
  { id: 2, initial: '이', name: '이시립', rating: 4, period: '2026.06', text: '학교와 가까워요.' },
  { id: 3, initial: '박', name: '박시립', rating: 5, period: '2026.05', text: '관리 상태가 좋아요.' },
  { id: 4, initial: '최', name: '최시립', rating: 4, period: '2026.04', text: '주변이 조용해요.' },
  { id: 5, initial: '정', name: '정시립', rating: 5, period: '2026.03', text: '교통이 편리해요.' },
];

function dispatchDragEvent(element, type, y) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clientY', { value: y });
  Object.defineProperty(event, 'pageY', { value: y });
  Object.defineProperty(event, 'pointerId', { value: 1 });
  fireEvent(element, event);
}

test('미리보기에서 처음 두 리뷰만 보이고 남은 리뷰를 더보기로 펼친다', () => {
  render(
    <ListingPreview
      listing={listing}
      reviews={reviews}
      averageRating={4.5}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
    />,
  );

  expect(screen.getByText('채광이 좋아요.')).toBeInTheDocument();
  expect(screen.getByText('학교와 가까워요.')).toBeInTheDocument();
  expect(screen.queryByText('관리 상태가 좋아요.')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '3개 리뷰 더보기' }));

  expect(screen.getByText('관리 상태가 좋아요.')).toBeInTheDocument();
  expect(screen.getByText('교통이 편리해요.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '리뷰 접기' })).toBeInTheDocument();
});

test('내 리뷰가 있으면 내 리뷰를 먼저 보여주고 다른 리뷰 두 개를 이어서 보여준다', () => {
  const mixedReviews = [
    { id: 1, userId: '2', initial: '김', name: '김시립', rating: 5, period: '2026.07', text: '첫 번째 다른 리뷰입니다.' },
    { id: 2, userId: '4', initial: '이', name: '이시립', rating: 4, period: '2026.06', text: '두 번째 다른 리뷰입니다.' },
    { id: 3, userId: '9', initial: '박', name: '박시립', rating: 5, period: '2026.05', text: '내가 쓴 리뷰입니다.' },
    { id: 4, userId: '5', initial: '최', name: '최시립', rating: 4, period: '2026.04', text: '세 번째 다른 리뷰입니다.' },
  ];

  render(
    <ListingPreview
      listing={listing}
      reviews={mixedReviews}
      averageRating={4.5}
      isReviewLoading={false}
      reviewsError=""
      currentUserId="9"
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
    />,
  );

  const reviewTexts = screen.getAllByText(/리뷰입니다\./).map((element) => element.textContent);
  expect(reviewTexts).toEqual(['내가 쓴 리뷰입니다.', '첫 번째 다른 리뷰입니다.', '두 번째 다른 리뷰입니다.']);
  expect(screen.queryByText('세 번째 다른 리뷰입니다.')).not.toBeInTheDocument();
  expect(screen.getByText('내 리뷰')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '1개 리뷰 더보기' })).toBeInTheDocument();
});

test('등기부등본 업로드 전에는 위험도를 미확인 상태로 잠그고 업로드 버튼을 보여준다', () => {
  render(
    <ListingPreview
      listing={jeonseListing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={jest.fn()}
    />,
  );

  expect(screen.getByText('전세 사기 위험도')).toBeInTheDocument();
  expect(screen.getByText('등기부: 업로드 전 · 미확인')).toBeInTheDocument();
  expect(screen.getAllByText('미확인').length).toBeGreaterThan(0);
  expect(screen.getByText('등기부등본 업로드하고 위험도 확인하기')).toBeInTheDocument();
  expect(screen.getByText('근저당권').closest('section')).toHaveClass('is-pending');
});

test('월세 매물도 등기부등본 업로드 전이면 안전 점수를 미확인 상태로 보여준다', () => {
  render(
    <ListingPreview
      listing={{ ...listing, safetyScore: null }}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={jest.fn()}
    />,
  );

  expect(screen.getByText('등기부: 업로드 전 · 미확인')).toBeInTheDocument();
  expect(screen.getByText('안전 점수').closest('section')).toHaveClass('is-pending');
  expect(screen.queryByText('0.0')).not.toBeInTheDocument();
  expect(screen.queryByText('시세 적정성')).not.toBeInTheDocument();
  expect(screen.queryByText('월세 계약 안전성 확인 완료')).not.toBeInTheDocument();
});

test('월세 매물도 등기부등본 업로드로 위험도를 확인할 수 있다', () => {
  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={jest.fn()}
    />,
  );

  expect(screen.getByText('월세 사기 위험도')).toBeInTheDocument();
  expect(screen.getByText('등기부등본 업로드하고 위험도 확인하기')).toBeInTheDocument();
  expect(screen.getByText('근저당권').closest('section')).toHaveClass('is-pending');
});

test('모바일 드래그로 상세 패널을 닫지 않고 중간 위치에 고정한다', () => {
  const onClose = jest.fn();
  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={onClose}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
    />,
  );

  const handle = screen.getByLabelText('매물 상세 패널 높이 조절');
  const panel = handle.closest('.listing-preview');

  dispatchDragEvent(handle, 'pointerdown', 80);
  dispatchDragEvent(handle, 'pointermove', 240);
  dispatchDragEvent(handle, 'pointerup', 240);

  expect(onClose).not.toHaveBeenCalled();
  expect(panel).toHaveClass('is-peeked');
  expect(panel).toHaveStyle({ transform: 'translateY(323px)' });
});

test('전세 매물 가격은 월 0 없이 전세금으로 보여준다', () => {
  render(
    <ListingPreview
      listing={{ ...jeonseListing, deposit: '13000', rent: '0' }}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={jest.fn()}
    />,
  );

  expect(screen.getByRole('heading', { name: '전세금 13,000만원' })).toBeInTheDocument();
  expect(screen.queryByText(/월 0/)).not.toBeInTheDocument();
});

test('등기부등본 업로드 CTA를 누르면 안내창을 띄우고 PDF만 업로드한다', async () => {
  const onUploadRegistry = jest.fn();
  const pdf = new File(['registry'], 'registry.pdf', { type: 'application/pdf' });

  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={onUploadRegistry}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: '등기부등본 업로드하고 위험도 확인하기' }));
  expect(screen.getByRole('dialog', { name: '등기부등본 업로드 안내' })).toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: '등기부등본 업로드 안내' }).closest('.listing-preview')).toBeNull();
  expect(screen.getByRole('dialog', { name: '등기부등본 업로드 안내' }).parentElement?.parentElement).toBe(document.body);
  expect(screen.getByText(/사이트나 앱에서 이 매물 주소로/).closest('.registry-upload-guide__step-text')).toBeInTheDocument();
  const fileInput = screen.getByLabelText('등기부등본 파일 선택');

  expect(fileInput).toHaveAttribute('accept', 'application/pdf,.pdf');
  expect(screen.getByText('PDF · 최대 1MB · 발급일 3개월 이내 등기부만 인정돼요')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('집주인 성함'), { target: { value: '김철수' } });
  fireEvent.change(fileInput, { target: { files: [pdf] } });
  fireEvent.click(screen.getByRole('button', { name: '업로드하기' }));

  await waitFor(() => expect(onUploadRegistry).toHaveBeenCalledWith(listing.id, pdf, { ownerName: '김철수' }));
});

test('등기부등본 안내창에서 시세와 공시가격을 둘 다 만원 단위로 입력해 업로드 metadata에 포함한다', async () => {
  const onUploadRegistry = jest.fn();
  const pdf = new File(['registry'], 'registry.pdf', { type: 'application/pdf' });

  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={onUploadRegistry}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: '등기부등본 업로드하고 위험도 확인하기' }));
  expect(screen.getByText('시세 또는 공시가격 입력')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '공시가격' })).toHaveClass('is-active');

  fireEvent.change(screen.getByLabelText('공시가격'), { target: { value: '1' } });
  expect(screen.getByText('만원')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: '시세' }));
  expect(screen.getByRole('button', { name: '시세' })).toHaveClass('is-active');
  fireEvent.change(screen.getByLabelText('시세'), { target: { value: '2' } });
  fireEvent.change(screen.getByLabelText('집주인 성함'), { target: { value: '김철수' } });
  fireEvent.change(screen.getByLabelText('등기부등본 파일 선택'), { target: { files: [pdf] } });
  fireEvent.click(screen.getByRole('button', { name: '업로드하기' }));

  await waitFor(() => expect(onUploadRegistry).toHaveBeenCalledWith(listing.id, pdf, {
    ownerName: '김철수',
    publicPrice: 10000,
    price: 20000,
  }));
});

test('등기부등본 안내창에서는 PDF가 아닌 파일을 업로드하지 않는다', () => {
  const onUploadRegistry = jest.fn();
  const image = new File(['image'], 'registry.png', { type: 'image/png' });

  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={onUploadRegistry}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: '등기부등본 업로드하고 위험도 확인하기' }));
  fireEvent.change(screen.getByLabelText('등기부등본 파일 선택'), { target: { files: [image] } });
  fireEvent.click(screen.getByRole('button', { name: '업로드하기' }));

  expect(screen.getByRole('alert')).toHaveTextContent('이미지는 업로드할 수 없어요. PDF 파일만 업로드해주세요.');
  expect(onUploadRegistry).not.toHaveBeenCalled();
});

test('등기부등본 안내창에서는 1MB를 초과한 PDF를 업로드하지 않는다', () => {
  const onUploadRegistry = jest.fn();
  const oversizedPdf = new File([new Uint8Array(1024 * 1024 + 1)], 'registry.pdf', { type: 'application/pdf' });

  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={onUploadRegistry}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: '등기부등본 업로드하고 위험도 확인하기' }));
  fireEvent.change(screen.getByLabelText('등기부등본 파일 선택'), { target: { files: [oversizedPdf] } });
  fireEvent.click(screen.getByRole('button', { name: '업로드하기' }));

  expect(screen.getByRole('alert')).toHaveTextContent('등기부등본은 최대 1MB까지만 업로드할 수 있어요.');
  expect(onUploadRegistry).not.toHaveBeenCalled();
});

test('등기부등본 업로드 요청이 실패하면 안내창에 실패 메시지를 보여준다', async () => {
  const onUploadRegistry = jest.fn().mockRejectedValue(new Error('upload failed'));
  const pdf = new File(['registry'], 'registry.pdf', { type: 'application/pdf' });

  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={onUploadRegistry}
    />,
  );

  fireEvent.click(screen.getByRole('button', { name: '등기부등본 업로드하고 위험도 확인하기' }));
  fireEvent.change(screen.getByLabelText('등기부등본 파일 선택'), { target: { files: [pdf] } });
  fireEvent.click(screen.getByRole('button', { name: '업로드하기' }));

  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('등기부등본 업로드에 실패했어요. 잠시 후 다시 시도해주세요.'));
  expect(screen.getByRole('dialog', { name: '등기부등본 업로드 안내' })).toBeInTheDocument();
});

test('매물 metadata로 주변 시설 개수를 상세 패널에 보여준다', () => {
  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
    />,
  );

  expect(screen.getByText('주변 시설')).toBeInTheDocument();
  expect(screen.getByLabelText('음식점 199개')).toBeInTheDocument();
  expect(screen.getByLabelText('카페 35개')).toBeInTheDocument();
  expect(screen.getByLabelText('은행 19개')).toBeInTheDocument();
  expect(screen.getByLabelText('편의점 18개')).toBeInTheDocument();
  expect(screen.getByLabelText('주차장 14개')).toBeInTheDocument();
  expect(screen.getByLabelText('약국 8개')).toBeInTheDocument();
  expect(screen.getByLabelText('병원 6개')).toBeInTheDocument();
  expect(screen.getByLabelText('지하철 1개')).toBeInTheDocument();
  expect(screen.getByLabelText('우체국 1개')).toBeInTheDocument();
});

test('주변 시설 metadata가 없으면 주변 시설 섹션을 숨긴다', () => {
  render(
    <ListingPreview
      listing={{ ...listing, metadata: null }}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
    />,
  );

  expect(screen.queryByText('주변 시설')).not.toBeInTheDocument();
});

test('로그인 전에는 사진 위 안전 점수를 노출하지 않는다', () => {
  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
    />,
  );

  expect(screen.getByText('로그인 필요')).toBeInTheDocument();
  expect(screen.queryByText('안전 8.5')).not.toBeInTheDocument();
});

test('분석 완료 후 안전 점수는 숫자가 아니라 3단계 요약 라벨로 보여준다', () => {
  render(
    <ListingPreview
      listing={{ ...jeonseListing, safetyScore: 54, risk: { ...jeonseListing.risk, level: '주의' } }}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      registryUpload={{ id: 1 }}
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
    />,
  );

  expect(screen.getAllByText('참고')).toHaveLength(2);
  expect(screen.queryByText('54.0')).not.toBeInTheDocument();
  expect(screen.queryByText('안전 54')).not.toBeInTheDocument();
});

test('위험도 라벨이 없어도 안전 점수 값으로 3단계 라벨을 계산한다', () => {
  render(
    <ListingPreview
      listing={{ ...jeonseListing, safetyScore: 54, risk: { ...jeonseListing.risk, level: '미확인' } }}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      registryUpload={{ id: 1 }}
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
    />,
  );

  expect(screen.getAllByText('참고')).toHaveLength(2);
  expect(screen.queryByText('54.0')).not.toBeInTheDocument();
});

test('내부 항목 점수는 숫자 대신 확인할 내용으로 안내한다', () => {
  render(
    <ListingPreview
      listing={{
        ...jeonseListing,
        safetyScore: 54,
        registrySafetyScore: 5.4,
        risk: { ...jeonseListing.risk, mortgage: '5,400만원', ratio: '63.17%', level: '주의' },
      }}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      registryUpload={{ id: 1 }}
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
    />,
  );

  expect(screen.getByText(/실제 시세 점수가 들어오면 주변 시세와 공시가격 차이/)).toBeInTheDocument();
  expect(screen.getByText(/전세가율이 63.17%이고 근저당 5,400만원이 확인됐어요/)).toBeInTheDocument();
  expect(screen.getByText(/이 내용만 보고 판단하기보다 계약 전 말소 조건, 선순위 권리, 보증보험 가능 여부/)).toBeInTheDocument();
  expect(screen.getByText(/실제 치안 점수가 들어오면 야간 이동과 주변 안전 정보/)).toBeInTheDocument();
  expect(screen.queryByText('5.4')).not.toBeInTheDocument();
  expect(screen.queryByText('등기부 안전')).not.toBeInTheDocument();
});

test('매물 데이터에 분석 완료처럼 보이는 필드가 있어도 사용자가 업로드하기 전이면 미확인으로 보여준다', () => {
  render(
    <ListingPreview
      listing={{ ...jeonseListing, registryAnalyzed: true, registryUploaded: true, hasRegistryDocument: true }}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={jest.fn()}
    />,
  );

  expect(screen.getByText('등기부: 업로드 전 · 미확인')).toBeInTheDocument();
  expect(screen.getByText('등기부등본 업로드하고 위험도 확인하기')).toBeInTheDocument();
});

test('등기부등본 업로드 후에는 위험도 분석 결과를 보여주고 업로드 버튼을 숨긴다', () => {
  render(
    <ListingPreview
      listing={jeonseListing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      registryUpload={{ id: 1 }}
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={jest.fn()}
    />,
  );

  expect(screen.getByText('등기부: 근저당 없음 · 안심')).toBeInTheDocument();
  expect(screen.getByText('전세가율').closest('span')).toHaveTextContent('62%');
  expect(screen.queryByText('등기부등본 업로드하고 위험도 확인하기')).not.toBeInTheDocument();
});

test('등기부등본 분석 대기 중에는 완료로 처리하지 않고 분석 중 상태를 보여준다', () => {
  render(
    <ListingPreview
      listing={listing}
      reviews={[]}
      averageRating={0}
      isReviewLoading={false}
      reviewsError=""
      registryUpload={{ submissionId: 'sub_123', status: 'QUEUED' }}
      isFavorite={false}
      isLocked={false}
      onClose={jest.fn()}
      onFavorite={jest.fn()}
      onInquiry={jest.fn()}
      onRequireLogin={jest.fn()}
      onWriteReview={jest.fn()}
      onUploadRegistry={jest.fn()}
    />,
  );

  expect(screen.getByText('분석 중')).toBeInTheDocument();
  expect(screen.getByText('등기부: 분석 중이에요')).toBeInTheDocument();
  expect(screen.getByText('근저당권').closest('section')).toHaveClass('is-pending');
  expect(screen.queryByText('등기부등본 업로드하고 위험도 확인하기')).not.toBeInTheDocument();
});
