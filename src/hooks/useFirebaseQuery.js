import { useState, useEffect, useRef } from 'react';

const cache = new Map();

export function useFirebaseQuery(queryFn, deps = [], options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { 
    cacheKey, 
    cacheTime = 5 * 60 * 1000, // 5 minutos
    enabled = true 
  } = options;
  
  const mountedRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    
    const executeQuery = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar cache se tiver cacheKey
        if (cacheKey && cache.has(cacheKey)) {
          const cached = cache.get(cacheKey);
          if (Date.now() - cached.timestamp < cacheTime) {
            if (mountedRef.current) {
              setData(cached.data);
              setLoading(false);
            }
            return;
          }
        }
        
        const result = await queryFn();
        
        if (mountedRef.current) {
          setData(result);
          setLoading(false);
          
          // Salvar no cache se tiver cacheKey
          if (cacheKey) {
            cache.set(cacheKey, {
              data: result,
              timestamp: Date.now()
            });
          }
        }
      } catch (err) {
        if (mountedRef.current) {
          setError(err);
          setLoading(false);
        }
      }
    };

    executeQuery();
  }, deps);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const refetch = () => {
    if (cacheKey) {
      cache.delete(cacheKey);
    }
    executeQuery();
  };

  return { data, loading, error, refetch };
} 