import { useEffect, useState } from 'react';
import { getResidenceVerification } from '../services';

const STORAGE_PREFIX = 'sibang.residence-verification.';

const defaultVerification = {
  isVerified: false,
  isDeferred: false,
  address: '',
  history: [],
  rewardMessage: '실거주 인증을 완료하면 인증 리뷰를 확인할 수 있어요.',
};

export function useResidenceVerification(isAuthenticated, userId) {
  const [verification, setVerification] = useState(() => readLocalVerification(userId));
  const [isLoading, setIsLoading] = useState(Boolean(isAuthenticated));

  useEffect(() => {
    if (!isAuthenticated) {
      setVerification(null);
      setIsLoading(false);
      return undefined;
    }

    setVerification(readLocalVerification(userId));
    setIsLoading(true);
    let active = true;
    getResidenceVerification()
      .then((response) => {
        if (!active) return;
        if (!response) {
          setIsLoading(false);
          return;
        }
        const nextVerification = { ...readLocalVerification(userId), ...response };
        setVerification(nextVerification);
        persistVerification(userId, nextVerification);
        setIsLoading(false);
      })
      .catch(() => {
        if (active) setIsLoading(false);
        // 인증 API가 연결되기 전에는 로컬 상태를 유지합니다.
      });
    return () => { active = false; };
  }, [isAuthenticated, userId]);

  const deferVerification = () => {
    const nextVerification = { ...(verification || defaultVerification), isDeferred: true };
    setVerification(nextVerification);
    persistVerification(userId, nextVerification);
  };

  const completeVerification = (history = []) => {
    const nextVerification = {
      ...(verification || defaultVerification),
      isVerified: true,
      isDeferred: false,
      history,
      address: history.find((item) => item.current)?.address || history[0]?.address || '',
      rewardMessage: '실거주 인증이 완료되었어요. 인증 리뷰를 확인할 수 있어요.',
    };
    setVerification(nextVerification);
    persistVerification(userId, nextVerification);
  };

  if (!isAuthenticated) return null;
  return {
    ...(verification || defaultVerification),
    isLoading,
    shouldAutoOpen: !isLoading && !(verification || defaultVerification).isVerified && !(verification || defaultVerification).isDeferred,
    deferVerification,
    completeVerification,
  };
}

function readLocalVerification(userId) {
  if (!userId) return { ...defaultVerification };
  try {
    const saved = window.localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    return saved ? { ...defaultVerification, ...JSON.parse(saved) } : { ...defaultVerification };
  } catch {
    return { ...defaultVerification };
  }
}

function persistVerification(userId, verification) {
  if (!userId) return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(verification));
  } catch {
    // Storage may be unavailable in privacy mode; the in-memory state still works.
  }
}
