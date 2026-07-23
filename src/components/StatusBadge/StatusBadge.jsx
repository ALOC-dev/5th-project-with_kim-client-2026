import './StatusBadge.css';

export default function StatusBadge({ children, tone = 'blue' }) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}
