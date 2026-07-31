import { useEffect, useState } from 'react';
import { deferResidenceVerification as requestDeferResidenceVerification, getResidenceVerification, normalizeResidenceVerification, uploadResidenceVerification } from '../services';

const STORAGE_PREFIX = 'sibang.residence-verification.';

const defaultVerification = {
  isVerified: false,
  status: null,
  uploadedAt: null,
  error: null,
  addresses: [],
  isDeferred: false,
  address: '',
  history: [],
  rewardMessage: '실거주 인증을 완료하면 인증 리뷰를 확인할 수 있어요.',
};

export function canAutoOpenResidenceVerification({
  isAuthenticated,
  requiredOnboardingMode,
  onboardingMode,
  shouldAutoOpen,
  status,
}) {
  return Boolean(
    isAuthenticated
      && !requiredOnboardingMode
      && !onboardingMode
      && shouldAutoOpen
      && (status === null || status === undefined),
  );
}

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
        const nextVerification = { ...readLocalVerification(userId), ...normalizeResidenceVerification(response) };
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

  const deferVerification = async () => {
    await requestDeferResidenceVerification();
    const nextVerification = { ...(verification || defaultVerification), isDeferred: true };
    setVerification(nextVerification);
    persistVerification(userId, nextVerification);
  };

  const completeVerification = (history = []) => {
    const nextVerification = {
      ...(verification || defaultVerification),
      isVerified: true,
      status: 'COMPLETED',
      isDeferred: false,
      history,
      address: history.find((item) => item.current)?.address || history[0]?.address || '',
      rewardMessage: '실거주 인증이 완료되었어요. 인증 리뷰를 확인할 수 있어요.',
    };
    setVerification(nextVerification);
    persistVerification(userId, nextVerification);
  };

  const refreshVerification = async () => {
    const response = await getResidenceVerification();
    if (!response) return verification || defaultVerification;
    const nextVerification = { ...readLocalVerification(userId), ...normalizeResidenceVerification(response) };
    setVerification(nextVerification);
    persistVerification(userId, nextVerification);
    return nextVerification;
  };

  const uploadVerification = async (file) => {
    const uploadResponse = await uploadResidenceVerification(file);
    const result = await getResidenceVerification();
    const nextVerification = {
      ...readLocalVerification(userId),
      ...normalizeResidenceVerification(result || uploadResponse),
      isDeferred: false,
    };
    setVerification(nextVerification);
    persistVerification(userId, nextVerification);
    return nextVerification;
  };

  if (!isAuthenticated) return null;
  return {
    ...(verification || defaultVerification),
    isLoading,
    shouldAutoOpen: !isLoading
      && !(verification || defaultVerification).isVerified
      && !(verification || defaultVerification).isDeferred
      && ((verification || defaultVerification).status === null || (verification || defaultVerification).status === undefined),
    deferVerification,
    completeVerification,
    uploadVerification,
    refreshVerification,
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
