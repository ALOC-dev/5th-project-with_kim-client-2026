import { fireEvent, render, screen } from '@testing-library/react';
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
  expect(screen.getByText('미확인')).toBeInTheDocument();
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
  expect(screen.getByText('0.0').closest('section')).toHaveClass('is-pending');
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

  expect(screen.getByText('등기부: 근저당 없음 · 안전')).toBeInTheDocument();
  expect(screen.getByText('전세가율').closest('span')).toHaveTextContent('62%');
  expect(screen.queryByText('등기부등본 업로드하고 위험도 확인하기')).not.toBeInTheDocument();
});
