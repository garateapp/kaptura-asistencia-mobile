import { useEffect, useState } from 'react';

import { createTables } from '@/services/db';

export const useDatabaseInit = () => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    createTables()
      .then(() => setIsReady(true))
      .catch((err) => setError(err instanceof Error ? err : new Error('DB init failed')));
  }, []);

  return { isReady, error };
};
