import { act, fireEvent, render, screen } from '@testing-library/react';
import ResidenceVerificationModal from './ResidenceVerificationModal';

function createPdfFile() {
  return new File(['resident document'], 'resident.pdf', { type: 'application/pdf' });
}

test('실거주 인증 모달은 PDF 업로드가 성공하면 2단계로 이동할 수 있다', async () => {
  const onUpload = jest.fn().mockResolvedValue({});
  render(<ResidenceVerificationModal onClose={jest.fn()} onDefer={jest.fn()} onComplete={jest.fn()} onUpload={onUpload} />);

  expect(screen.getByRole('heading', { name: '증빙 서류 업로드' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('주민등록초본 파일 선택'), {
    target: { files: [createPdfFile()] },
  });
  fireEvent.click(screen.getByRole('button', { name: '다음' }));
  await screen.findByRole('heading', { name: '거주 이력 확인' });

  expect(onUpload).toHaveBeenCalledWith(expect.any(File));
});

test('실거주 인증 모달은 업로드가 실패하면 1단계에 머문다', async () => {
  const onUpload = jest.fn().mockRejectedValue(new Error('upload failed'));
  render(<ResidenceVerificationModal onClose={jest.fn()} onDefer={jest.fn()} onComplete={jest.fn()} onUpload={onUpload} />);

  fireEvent.change(screen.getByLabelText('주민등록초본 파일 선택'), {
    target: { files: [createPdfFile()] },
  });
  fireEvent.click(screen.getByRole('button', { name: '다음' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('주민등록초본 업로드에 실패했어요. 잠시 후 다시 시도해 주세요.');
  expect(screen.getByRole('heading', { name: '증빙 서류 업로드' })).toBeInTheDocument();
});

test('실거주 인증 모달은 분석 대기 상태를 안내한다', async () => {
  const onUpload = jest.fn().mockResolvedValue({ status: 'PENDING' });
  render(<ResidenceVerificationModal onClose={jest.fn()} onDefer={jest.fn()} onComplete={jest.fn()} onUpload={onUpload} />);

  fireEvent.change(screen.getByLabelText('주민등록초본 파일 선택'), {
    target: { files: [createPdfFile()] },
  });
  fireEvent.click(screen.getByRole('button', { name: '다음' }));

  expect(await screen.findByText('주민등록초본을 분석하고 있어요')).toBeInTheDocument();
});

test('실거주 인증 분석 상태는 20초마다 다시 조회한다', () => {
  jest.useFakeTimers();
  const refreshVerification = jest.fn().mockResolvedValue({ status: 'PENDING' });
  render(<ResidenceVerificationModal verification={{ status: 'PENDING', refreshVerification }} onClose={jest.fn()} onDefer={jest.fn()} onComplete={jest.fn()} />);

  act(() => jest.advanceTimersByTime(19999));
  expect(refreshVerification).not.toHaveBeenCalled();

  act(() => jest.advanceTimersByTime(1));
  expect(refreshVerification).toHaveBeenCalledTimes(1);
  jest.useRealTimers();
});

test('실거주 인증 완료 시 현재 거주 주소를 기본 선택하고 전체 이력을 표시한다', () => {
  render(<ResidenceVerificationModal verification={{
    status: 'COMPLETED',
    history: [
      { address: '경기도 하남시 덕풍동 365-18', period: '2002', current: false },
      { address: '경기도 하남시 신평로73번길 35-7', period: '2020', current: true },
      { address: '경기도 하남시 하남대로784번길 40-9', period: '2018', current: false },
    ],
  }} onClose={jest.fn()} onDefer={jest.fn()} onComplete={jest.fn()} />);

  expect(screen.getByRole('button', { name: /경기도 하남시 덕풍동 365-18/ })).not.toHaveClass('is-selected');
  expect(screen.getByRole('button', { name: /경기도 하남시 신평로73번길 35-7/ })).toHaveClass('is-selected');
  expect(screen.getByRole('button', { name: /경기도 하남시 하남대로784번길 40-9/ })).toBeInTheDocument();
});

test('실거주 인증을 나중에 하면 API 성공 후 모달을 닫는다', async () => {
  const onDefer = jest.fn();
  const onClose = jest.fn();
  onDefer.mockResolvedValue(undefined);
  render(<ResidenceVerificationModal onClose={onClose} onDefer={onDefer} onComplete={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: '나중에 할게요' }));

  await screen.findByRole('heading', { name: '증빙 서류 업로드' });
  expect(onDefer).toHaveBeenCalledTimes(1);
  expect(onClose).toHaveBeenCalledTimes(1);
});

test('실거주 인증 나중에 하기가 실패하면 모달을 유지한다', async () => {
  const onDefer = jest.fn().mockRejectedValue(new Error('defer failed'));
  const onClose = jest.fn();
  render(<ResidenceVerificationModal onClose={onClose} onDefer={onDefer} onComplete={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: '나중에 할게요' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('실거주 인증을 나중에 하도록 저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
  expect(onClose).not.toHaveBeenCalled();
});
