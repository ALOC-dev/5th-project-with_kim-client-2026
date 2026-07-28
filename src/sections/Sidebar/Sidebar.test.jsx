import { render, screen } from '@testing-library/react';
import Sidebar from './Sidebar';

test('매물 미리보기가 열려 있으면 전세사기 위험도 진단 버튼을 표시하지 않는다', () => {
  render(
    <Sidebar
      activePage="home"
      hideRiskGuide
      onNavigate={jest.fn()}
      onOpenRiskGuide={jest.fn()}
    />,
  );

  expect(screen.queryByRole('button', { name: /전세사기 위험도 진단/ })).not.toBeInTheDocument();
});
