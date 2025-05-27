// 🚀 SERVICE WORKER PWA - Sistema Iara Imports
const CACHE_NAME = 'iara-imports-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Páginas principais
  '/dashboard',
  '/chat-interno',
  '/pdv',
  '/estoque',
  '/vendas',
  '/clientes',
  '/relatorios',
  '/configuracoes'
];

// 📦 INSTALAÇÃO DO SERVICE WORKER
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('✅ Service Worker: Instalado com sucesso!');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Erro na instalação:', error);
      })
  );
});

// 🔄 ATIVAÇÃO DO SERVICE WORKER
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker: Ativado!');
      return self.clients.claim();
    })
  );
});

// 🌐 INTERCEPTAÇÃO DE REQUISIÇÕES
self.addEventListener('fetch', (event) => {
  // Ignorar requisições para APIs externas e Firebase
  if (event.request.url.includes('firebaseapp.com') || 
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('firebase.com') ||
      event.request.url.includes('chrome-extension') ||
      event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Se encontrou no cache, retorna
        if (response) {
          console.log('📦 Servindo do cache:', event.request.url);
          return response;
        }

        // Se não encontrou, busca na rede
        console.log('🌐 Buscando na rede:', event.request.url);
        return fetch(event.request).then((response) => {
          // Verifica se a resposta é válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta para cachear
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
              console.log('💾 Adicionado ao cache:', event.request.url);
            });

          return response;
        }).catch(() => {
          // Se falhou, tenta servir página offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// 📱 NOTIFICAÇÕES PUSH
self.addEventListener('push', (event) => {
  console.log('📱 Push recebido:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova mensagem no sistema',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      image: data.image,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        action: data.action
      },
      actions: [
        {
          action: 'open',
          title: '📖 Abrir',
          icon: '/icons/open-icon.png'
        },
        {
          action: 'close',
          title: '❌ Fechar',
          icon: '/icons/close-icon.png'
        }
      ],
      requireInteraction: true,
      silent: false,
      tag: data.tag || 'default'
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Iara Imports', options)
    );
  }
});

// 🔔 CLIQUE EM NOTIFICAÇÃO
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notificação clicada:', event);
  
  event.notification.close();

  const action = event.action;
  const url = event.notification.data?.url || '/';

  if (action === 'close') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Se já tem uma janela aberta, foca nela
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Se não tem, abre nova janela
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

// 📡 SINCRONIZAÇÃO EM BACKGROUND
self.addEventListener('sync', (event) => {
  console.log('📡 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Aqui você pode sincronizar dados offline
      console.log('🔄 Sincronizando dados offline...')
    );
  }
});

// 💾 GESTÃO DE CACHE INTELIGENTE
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏭️ Pulando espera do Service Worker');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_NAME,
      cached: urlsToCache.length
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      console.log('🗑️ Cache limpo');
      event.ports[0].postMessage({ success: true });
    });
  }
});

// 🔍 LOG DE STATUS
console.log('📱 Service Worker carregado - Iara Imports PWA v1.0.0');
console.log('🎯 Cache Name:', CACHE_NAME);
console.log('📦 URLs para cache:', urlsToCache.length); 