// Configurações de Performance para IARA HUB

export const PERFORMANCE_CONFIG = {
  // Limites de dados
  MAX_ITEMS_PER_PAGE: 20,
  MAX_FIREBASE_QUERY_LIMIT: 100,
  
  // Debounce delays
  SEARCH_DEBOUNCE_MS: 300,
  FILTER_DEBOUNCE_MS: 150,
  
  // Cache settings
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutos
  
  // Animation settings (reduzidas para melhor performance)
  ANIMATION_DURATION: 0.2,
  STAGGER_DELAY: 0.03,
  
  // Virtual scrolling
  VIRTUAL_ITEM_HEIGHT: 120,
  VIRTUAL_BUFFER_SIZE: 5,
  
  // Toast settings
  TOAST_DURATION: 3000,
  MAX_TOASTS: 3,
};

// Funções utilitárias de performance
export const performanceUtils = {
  // Throttle para eventos frequentes
  throttle: (func, delay) => {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  },
  
  // Chunking para processar arrays grandes
  processInChunks: async (array, chunkSize, processor) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    
    for (const chunk of chunks) {
      await processor(chunk);
      // Dar uma pausa para não bloquear a UI
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  },
  
  // Lazy loading para imagens
  createIntersectionObserver: (callback, options = {}) => {
    const defaultOptions = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    };
    
    return new IntersectionObserver(callback, defaultOptions);
  },
  
  // Memoização simples para funções custosas
  memoize: (fn) => {
    const cache = new Map();
    return (...args) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }
};

// Configurações específicas por página
export const PAGE_CONFIGS = {
  servicos: {
    maxOSVisible: 20,
    enableVirtualScrolling: false,
    cacheKey: 'ordens_servico',
  },
  
  configuracoes: {
    maxUsersVisible: 15,
    enablePagination: true,
    cacheKey: 'users_config',
  },
  
  produtos: {
    maxProductsVisible: 24,
    enableLazyLoading: true,
    cacheKey: 'produtos',
  },
  
  clientes: {
    maxClientsVisible: 25,
    enableVirtualScrolling: true,
    cacheKey: 'clientes',
  }
}; 