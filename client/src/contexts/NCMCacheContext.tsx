import React, { createContext, useContext, useState, useEffect } from "react";

interface CachedNCM {
  ncm: string;
  description: string;
  ii: number;
  ipi: number;
  pis: number;
  cofins: number;
  timestamp: number;
}

interface NCMCacheContextType {
  cache: Map<string, CachedNCM>;
  getCachedNCM: (ncm: string) => CachedNCM | null;
  setCachedNCM: (ncm: string, data: Omit<CachedNCM, "timestamp">) => void;
  clearCache: () => void;
  getCacheStats: () => { total: number; expired: number };
}

const NCMCacheContext = createContext<NCMCacheContextType | undefined>(undefined);

const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 horas em ms
const CACHE_KEY = "ncm_cache";

export function NCMCacheProvider({ children }: { children: React.ReactNode }) {
  const [cache, setCache] = useState<Map<string, CachedNCM>>(new Map());

  // Carregar cache do localStorage ao montar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const newCache = new Map<string, CachedNCM>();

        Object.entries(parsed).forEach(([ncm, data]: [string, any]) => {
          // Verificar se expirou
          const now = Date.now();
          if (now - data.timestamp < CACHE_EXPIRY_TIME) {
            newCache.set(ncm, data);
          }
        });

        setCache(newCache);
      }
    } catch (error) {
      console.error("Erro ao carregar cache de NCM:", error);
    }
  }, []);

  // Salvar cache no localStorage quando mudar
  useEffect(() => {
    try {
      const obj: Record<string, CachedNCM> = {};
      cache.forEach((value, key) => {
        obj[key] = value;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error("Erro ao salvar cache de NCM:", error);
    }
  }, [cache]);

  const getCachedNCM = (ncm: string): CachedNCM | null => {
    const cached = cache.get(ncm);
    if (!cached) return null;

    // Verificar expiração
    const now = Date.now();
    if (now - cached.timestamp > CACHE_EXPIRY_TIME) {
      // Remover do cache se expirou
      const newCache = new Map(cache);
      newCache.delete(ncm);
      setCache(newCache);
      return null;
    }

    return cached;
  };

  const setCachedNCM = (ncm: string, data: Omit<CachedNCM, "timestamp">) => {
    const newCache = new Map(cache);
    newCache.set(ncm, {
      ...data,
      timestamp: Date.now(),
    });
    setCache(newCache);
  };

  const clearCache = () => {
    setCache(new Map());
    localStorage.removeItem(CACHE_KEY);
  };

  const getCacheStats = () => {
    const now = Date.now();
    let expired = 0;

    cache.forEach((item) => {
      if (now - item.timestamp > CACHE_EXPIRY_TIME) {
        expired++;
      }
    });

    return {
      total: cache.size,
      expired,
    };
  };

  return (
    <NCMCacheContext.Provider
      value={{
        cache,
        getCachedNCM,
        setCachedNCM,
        clearCache,
        getCacheStats,
      }}
    >
      {children}
    </NCMCacheContext.Provider>
  );
}

export function useNCMCache() {
  const context = useContext(NCMCacheContext);
  if (!context) {
    throw new Error("useNCMCache deve ser usado dentro de NCMCacheProvider");
  }
  return context;
}
