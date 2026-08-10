export const INFRASTRUCTURE_CATEGORIES = [
  { key: 'CCTV', label: 'CCTV', icon: '📹', color: '#3182f6', enabled: true },
  { key: 'POLICE', label: '경찰서', icon: '🚓', color: '#ef4444', enabled: true },
  { key: 'CONVENIENCE_STORE', label: '편의점', icon: '🏪', color: '#22a06b', enabled: false },
  { key: 'SUBWAY', label: '지하철', icon: '🚇', color: '#8b5cf6', enabled: true },
  { key: 'STREETLIGHT', label: '가로등', icon: '💡', color: '#f59e0b', enabled: false },
];

export const ENABLED_INFRASTRUCTURE_CATEGORIES = INFRASTRUCTURE_CATEGORIES
  .filter((category) => category.enabled)
  .map((category) => category.key);
