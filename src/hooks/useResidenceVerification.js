import { useEffect, useState } from 'react';
import { getResidenceVerification } from '../services';

export function useResidenceVerification(isAuthenticated) {
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setVerification(null);
      return undefined;
    }

    let active = true;
    getResidenceVerification()
      .then((response) => { if (active) setVerification(response); })
      .catch(() => { if (active) setVerification(null); });
    return () => { active = false; };
  }, [isAuthenticated]);

  return verification;
}
