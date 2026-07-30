import { fireEvent, render, screen } from '@testing-library/react';
import ListingCard from './ListingCard';

const listing = {
  id: 1,
  title: '서울 동대문구 전농동 295-1',
  address: '전농동 295-1',
  rent: 55,
  deposit: 500,
  dealType: '월세',
  walkingMinutes: 6,
  safetyScore: 8.5,
  rating: 4.5,
  reviews: 3,
  marketDiff: '-5%',
  risk: { level: '안전' },
};

test('찜 목록 등기부등본 업로드도 PDF 파일만 전달한다', () => {
  const onUploadRegistry = jest.fn();
  const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
  const pdf = new File(['registry'], 'registry.pdf', { type: 'application/pdf' });
  const image = new File(['image'], 'registry.png', { type: 'image/png' });
  const oversizedPdf = new File([new Uint8Array(1024 * 1024 + 1)], 'large-registry.pdf', { type: 'application/pdf' });

  render(<ListingCard listing={listing} onSelect={jest.fn()} onFavorite={jest.fn()} onUploadRegistry={onUploadRegistry} />);
  const fileInput = screen.getByLabelText('등기부등본 PDF 파일 선택');

  expect(fileInput).toHaveAttribute('accept', 'application/pdf,.pdf');
  fireEvent.change(fileInput, { target: { files: [image] } });
  expect(alertSpy).toHaveBeenCalledWith('이미지는 업로드할 수 없어요. PDF 파일만 업로드해주세요.');
  expect(onUploadRegistry).not.toHaveBeenCalled();

  fireEvent.change(fileInput, { target: { files: [oversizedPdf] } });
  expect(alertSpy).toHaveBeenCalledWith('등기부등본은 최대 1MB까지만 업로드할 수 있어요.');
  expect(onUploadRegistry).not.toHaveBeenCalled();

  fireEvent.change(fileInput, { target: { files: [pdf] } });
  expect(onUploadRegistry).toHaveBeenCalledWith(listing.id, pdf);

  alertSpy.mockRestore();
});

test('찜 목록 전세 매물 가격은 월 0 없이 전세금으로 보여준다', () => {
  render(<ListingCard listing={{ ...listing, dealType: '전세', deposit: '13000', rent: '0' }} onSelect={jest.fn()} onFavorite={jest.fn()} />);

  expect(screen.getByText('전세금 13,000만원')).toBeInTheDocument();
  expect(screen.queryByText(/월 0/)).not.toBeInTheDocument();
});

test('찜 목록에서 등기부 분석 대기 중이면 완료로 표시하지 않는다', () => {
  render(<ListingCard listing={listing} registryUpload={{ submissionId: 'sub_123', status: 'QUEUED' }} onSelect={jest.fn()} onFavorite={jest.fn()} onUploadRegistry={jest.fn()} />);

  expect(screen.getByText('위험도 분석 중')).toBeInTheDocument();
  expect(screen.queryByText(/위험 확인 완료/)).not.toBeInTheDocument();
});
