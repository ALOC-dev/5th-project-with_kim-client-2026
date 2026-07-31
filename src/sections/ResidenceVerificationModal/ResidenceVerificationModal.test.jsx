import { fireEvent, render, screen } from '@testing-library/react';
import ResidenceVerificationModal from './ResidenceVerificationModal';

function createPdfFile() {
  return new File(['resident document'], 'resident.pdf', { type: 'application/pdf' });
}

test('실거주 인증 모달은 PDF를 선택하면 2단계로 이동할 수 있다', () => {
  render(<ResidenceVerificationModal onClose={jest.fn()} onDefer={jest.fn()} onComplete={jest.fn()} />);

  expect(screen.getByRole('heading', { name: '증빙 서류 업로드' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('주민등록초본 파일 선택'), {
    target: { files: [createPdfFile()] },
  });
  fireEvent.click(screen.getByRole('button', { name: '다음' }));

  expect(screen.getByRole('heading', { name: '거주 이력 확인' })).toBeInTheDocument();
});

test('실거주 인증을 나중에 하면 onDefer를 호출한다', () => {
  const onDefer = jest.fn();
  render(<ResidenceVerificationModal onClose={jest.fn()} onDefer={onDefer} onComplete={jest.fn()} />);

  fireEvent.click(screen.getByRole('button', { name: '나중에 할게요' }));

  expect(onDefer).toHaveBeenCalledTimes(1);
});
