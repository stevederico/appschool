# Progressive Web Apps (PWAs) - Interview Ready Guide

**1. Fundamentals** - What It Is, Core Technologies (HTTPS, Service Workers, Manifest)

**2. Web App Manifest** - Configuration, Icons, Display Modes

**3. Service Workers** - Registration, Lifecycle, Events

**4. Caching Strategies** - Cache First, Network First, Stale While Revalidate

**5. Offline Support** - IndexedDB, Offline UI Patterns

**6. Push Notifications** - Subscription, Sending, Handling

**7. Installation** - Install Prompt, beforeinstallprompt Event

**8. Background Sync** - Deferred Actions, Periodic Sync

**9. Testing** - DevTools, Lighthouse, PWA Checklist

**10. Interview Prep** - Common Questions, Practice Project

---

## What It Is

A Progressive Web App (PWA) is a web application that uses modern browser capabilities to deliver an app-like experience. PWAs can be installed on devices, work offline, send push notifications, and access device features—capabilities traditionally reserved for native apps.

The "progressive" part means they work for everyone. If a user's browser doesn't support PWA features, the app still works as a regular website. Enhanced features are added progressively based on browser capabilities.

PWAs bridge the gap between web and native:

| Feature | Traditional Web | PWA | Native App |
|---------|----------------|-----|------------|
| Discoverable via search | ✅ | ✅ | ❌ |
| No app store required | ✅ | ✅ | ❌ |
| Works offline | ❌ | ✅ | ✅ |
| Installable | ❌ | ✅ | ✅ |
| Push notifications | ❌ | ✅ | ✅ |
| Access to device features | Limited | Growing | Full |
| Automatic updates | ✅ | ✅ | Manual |
| Single codebase for all platforms | ✅ | ✅ | ❌ |

Companies like Twitter, Pinterest, Starbucks, and Uber have seen significant improvements in engagement and conversion after launching PWAs.

---

## Core Technologies

PWAs are built on three foundational technologies:

### 1. HTTPS
PWAs require secure connections. Service workers (the backbone of PWAs) only work over HTTPS (except localhost for development). This protects users from man-in-the-middle attacks.

### 2. Service Workers
JavaScript files that run separately from the web page, acting as a proxy between the browser and network. They enable offline functionality, background sync, and push notifications.

### 3. Web App Manifest
A JSON file that tells the browser how to display your app when installed: name, icons, colors, display mode, and more.

---

## The Web App Manifest

The manifest (`manifest.json` or `manifest.webmanifest`) defines how your app appears when installed:

```json
{
  "name": "My Awesome App",
  "short_name": "AwesomeApp",
  "description": "An awesome progressive web app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "/screenshots/mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "New Message",
      "short_name": "Message",
      "url": "/compose",
      "icons": [{ "src": "/icons/compose.png", "sizes": "96x96" }]
    }
  ]
}
```

### Key Properties

**name / short_name**: Full name and abbreviated name (used when space is limited).

**start_url**: URL that loads when the app is launched. Often includes a query parameter for analytics: `"/?source=pwa"`.

**display**: How the app appears:
- `fullscreen` - No browser UI, covers entire screen
- `standalone` - Looks like a native app, no URL bar
- `minimal-ui` - Like standalone but with some navigation controls
- `browser` - Opens in a regular browser tab

**background_color**: Splash screen background color while the app loads.

**theme_color**: Color of the browser toolbar and status bar.

**scope**: URL scope of the PWA. Pages outside this scope open in the browser.

**icons**: Different sizes for various contexts (home screen, splash screen, etc.). Include 192x192 and 512x512 minimum. The `maskable` purpose allows adaptive icons on Android.

**shortcuts**: Quick actions accessible from app icon long-press.

### Linking the Manifest

```html
<head>
  <link rel="manifest" href="/manifest.json">
  
  <!-- iOS specific (Safari doesn't fully support manifest) -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <meta name="apple-mobile-web-app-title" content="My App">
  <link rel="apple-touch-icon" href="/icons/icon-152.png">
  
  <!-- Theme color for browsers -->
  <meta name="theme-color" content="#3b82f6">
</head>
```

---

## Service Workers

Service workers are the heart of PWAs. They're JavaScript files that run in a separate thread and can intercept network requests, enabling offline functionality and advanced caching.

### Lifecycle

```
                    ┌─────────────┐
                    │  Installing │
                    └──────┬──────┘
                           │
    install event          │ waitUntil() complete
                           ▼
                    ┌─────────────┐
                    │   Waiting   │
                    └──────┬──────┘
                           │
    all tabs closed/       │ skipWaiting()
    refresh                │
                           ▼
                    ┌─────────────┐
                    │   Active    │ ← fetch, push, sync events
                    └──────┬──────┘
                           │
    new version            │
    installed              │
                           ▼
                    ┌─────────────┐
                    │  Redundant  │
                    └─────────────┘
```

### Registration

```javascript
// main.js - Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      console.log('SW registered:', registration.scope);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000); // Every hour
      
    } catch (error) {
      console.error('SW registration failed:', error);
    }
  });
}
```

### Basic Service Worker

```javascript
// sw.js
const CACHE_NAME = 'my-app-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/icons/icon-192.png',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Activate immediately without waiting
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      })
  );
});
```

---

## Caching Strategies

Different resources benefit from different caching strategies:

### Cache First (Cache Falling Back to Network)

Best for: Static assets that rarely change (fonts, images, CSS).

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

### Network First (Network Falling Back to Cache)

Best for: Frequently updated content where freshness matters (API data, news).

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response to store in cache
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
```

### Stale While Revalidate

Best for: Content that can be slightly stale (avatars, non-critical data). Returns cached version immediately, updates cache in background.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        
        return cachedResponse || fetchPromise;
      });
    })
  );
});
```

### Cache Only

Best for: Offline-only assets that never need network.

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});
```

### Network Only

Best for: Non-cacheable requests (analytics, POST requests).

```javascript
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
```

### Combined Strategy

Real apps use different strategies for different resources:

```javascript
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API calls - Network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }
  
  // Static assets - Cache first
  if (request.destination === 'image' || 
      request.destination === 'font' ||
      request.destination === 'style') {
    event.respondWith(cacheFirst(request));
    return;
  }
  
  // HTML pages - Stale while revalidate
  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  
  // Default - Network first
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  return cached || fetch(request);
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch {
    return caches.match(request);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    cache.put(request, response.clone());
    return response;
  });
  
  return cached || fetchPromise;
}
```

---

## Offline Support

### Offline Page

Create a dedicated offline page:

```html
<!-- offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - My App</title>
  <style>
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      font-family: system-ui, sans-serif;
      text-align: center;
      padding: 20px;
    }
    .offline-content {
      max-width: 400px;
    }
    h1 { color: #333; }
    p { color: #666; }
    button {
      margin-top: 20px;
      padding: 12px 24px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="offline-content">
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Some features may be unavailable.</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
```

### Detecting Online/Offline Status

```javascript
// Check current status
console.log(navigator.onLine ? 'Online' : 'Offline');

// Listen for changes
window.addEventListener('online', () => {
  console.log('Back online!');
  showNotification('Connection restored');
  syncPendingData();
});

window.addEventListener('offline', () => {
  console.log('Gone offline');
  showNotification('You are offline. Changes will sync when reconnected.');
});
```

### Queuing Offline Actions

Store actions when offline, sync when online:

```javascript
// Simple offline queue using IndexedDB
const DB_NAME = 'offline-queue';
const STORE_NAME = 'pending-requests';

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME, { 
        keyPath: 'id', 
        autoIncrement: true 
      });
    };
  });
}

async function queueRequest(url, options) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).add({
    url,
    options,
    timestamp: Date.now()
  });
}

async function processQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  const requests = await store.getAll();
  
  for (const req of requests) {
    try {
      await fetch(req.url, req.options);
      store.delete(req.id);
    } catch (err) {
      console.error('Failed to sync:', err);
    }
  }
}

// Usage
async function saveData(data) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };
  
  if (navigator.onLine) {
    await fetch('/api/save', options);
  } else {
    await queueRequest('/api/save', options);
  }
}

// Sync when back online
window.addEventListener('online', processQueue);
```

---

## Push Notifications

Push notifications allow your app to receive messages from a server even when the app isn't open.

### Requesting Permission

```javascript
async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    console.log('Notification permission granted');
    await subscribeToPush();
  } else if (permission === 'denied') {
    console.log('Notification permission denied');
  } else {
    console.log('Notification permission dismissed');
  }
}

// Only request after user action (better UX)
button.addEventListener('click', requestNotificationPermission);
```

### Subscribing to Push

```javascript
async function subscribeToPush() {
  const registration = await navigator.serviceWorker.ready;
  
  // Get VAPID public key from server
  const response = await fetch('/api/push/vapid-public-key');
  const vapidPublicKey = await response.text();
  
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true, // Required: must show notification
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });
  
  // Send subscription to server
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });
}

// Helper function
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### Handling Push in Service Worker

```javascript
// sw.js
self.addEventListener('push', (event) => {
  let data = { title: 'New Message', body: 'You have a new notification' };
  
  if (event.data) {
    data = event.data.json();
  }
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});
```

### Server-Side Push (Node.js)

```javascript
import webpush from 'web-push';

// Generate VAPID keys once: npx web-push generate-vapid-keys
webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Store subscriptions in database
const subscriptions = [];

// Subscribe endpoint
app.post('/api/push/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.push(subscription);
  res.status(201).json({ message: 'Subscribed' });
});

// Send push notification
async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 410) {
      // Subscription expired, remove it
      removeSubscription(subscription);
    }
  }
}

// Send to all subscribers
async function broadcastNotification(payload) {
  await Promise.all(
    subscriptions.map(sub => sendPushNotification(sub, payload))
  );
}

// Usage
broadcastNotification({
  title: 'New Update',
  body: 'Check out the latest features!',
  url: '/whats-new'
});
```

---

## Install Prompt

Browsers show an install prompt automatically, but you can also control when to show it:

```javascript
let deferredPrompt;

// Capture the event
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Prevent automatic prompt
  deferredPrompt = e;
  
  // Show your custom install button
  showInstallButton();
});

// Show prompt when user clicks your button
installButton.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  
  // Show the browser's install prompt
  deferredPrompt.prompt();
  
  // Wait for user response
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} install`);
  
  deferredPrompt = null;
  hideInstallButton();
});

// Detect successful installation
window.addEventListener('appinstalled', () => {
  console.log('App installed successfully');
  hideInstallButton();
  deferredPrompt = null;
});

// Check if already installed
function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}

if (isInstalled()) {
  console.log('App is running in standalone mode');
}
```

---

## Background Sync

Sync data when connection is restored:

```javascript
// main.js - Register sync
async function scheduleSync(tag) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register(tag);
}

// Usage
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Save data locally
  await saveToIndexedDB(formData);
  
  if (navigator.onLine) {
    await syncData();
  } else {
    await scheduleSync('sync-form-data');
    showMessage('Data saved. Will sync when online.');
  }
});
```

```javascript
// sw.js - Handle sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-form-data') {
    event.waitUntil(syncFormData());
  }
});

async function syncFormData() {
  const pendingData = await getFromIndexedDB();
  
  for (const data of pendingData) {
    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await removeFromIndexedDB(data.id);
    } catch (err) {
      // Will retry on next sync
      throw err;
    }
  }
}
```

---

## Testing and Debugging

### Chrome DevTools

1. **Application Tab**: View manifest, service workers, cache storage
2. **Service Workers Section**: Update, unregister, skip waiting
3. **Cache Storage**: View cached files
4. **Lighthouse**: Audit PWA compliance

### Testing Offline

1. DevTools → Network Tab → Select "Offline"
2. Or: Application Tab → Service Workers → Check "Offline"

### Useful Service Worker Commands

```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((reg) => reg.unregister());
});

// Clear all caches
caches.keys().then((names) => {
  names.forEach((name) => caches.delete(name));
});
```

---

## PWA Checklist

### Minimum Requirements
- [ ] Served over HTTPS
- [ ] Valid web app manifest with required fields
- [ ] Service worker registered
- [ ] 192x192 and 512x512 icons
- [ ] Responsive design

### Enhanced Features
- [ ] Offline functionality
- [ ] Fast loading (< 3s on 3G)
- [ ] Installable (meets criteria)
- [ ] Splash screen configured
- [ ] Theme color set
- [ ] Push notifications (if applicable)
- [ ] Background sync (if applicable)

---

## Interview Questions

**Q: What is a Progressive Web App?**

A: A PWA is a web application that uses modern web capabilities to deliver app-like experiences. Key features include: working offline (via service workers), being installable on devices (via web app manifest), sending push notifications, and loading quickly. The "progressive" aspect means they work as regular websites in unsupported browsers but enhance progressively in modern browsers.

**Q: What are the core technologies of a PWA?**

A: Three core technologies: (1) HTTPS—required for security and service worker registration. (2) Service Workers—JavaScript files running in background threads that enable offline functionality, caching, and push notifications. (3) Web App Manifest—a JSON file describing how the app should appear when installed (name, icons, colors, display mode).

**Q: Explain the service worker lifecycle.**

A: A service worker goes through: (1) Installing—triggered when a new SW is detected, `install` event fires where you typically pre-cache assets. (2) Waiting—installed but not active because an older version controls pages. (3) Activating—takes control when all tabs using old SW close, or when `skipWaiting()` is called; `activate` event is where you clean old caches. (4) Active—now handles fetch, push, and sync events. (5) Redundant—replaced by a newer version.

**Q: What caching strategies do you know?**

A: Cache First—check cache, fallback to network; best for static assets. Network First—try network, fallback to cache; best for dynamic content. Stale While Revalidate—return cached immediately, update cache in background; good balance of speed and freshness. Cache Only—only serve from cache. Network Only—bypass cache entirely.

**Q: How do push notifications work in PWAs?**

A: Three components: (1) Client requests permission and subscribes to push via `pushManager.subscribe()`, receiving a subscription object with an endpoint URL. (2) Server stores this subscription and uses VAPID keys to send messages to the push service endpoint. (3) Service worker receives `push` event even when app is closed and displays notification via `showNotification()`. Clicking the notification triggers `notificationclick` event.

**Q: How do you handle offline functionality?**

A: Multiple layers: (1) Pre-cache essential assets during SW install. (2) Implement appropriate caching strategies for different resource types. (3) Detect online/offline status with `navigator.onLine` and events. (4) Queue failed requests to IndexedDB and sync when back online. (5) Show an offline page when navigation fails. (6) Use Background Sync API to retry failed operations.

**Q: What's in the web app manifest?**

A: The manifest defines: `name` and `short_name` for display, `start_url` when launched, `display` mode (standalone, fullscreen, etc.), `background_color` for splash screen, `theme_color` for browser UI, `icons` at various sizes for different contexts, `scope` to define URL boundaries, optionally `shortcuts` for quick actions, and `screenshots` for richer install UI.

---

## Practice Project

Build a note-taking PWA:

**Requirements:**
1. Full offline support—create, edit, delete notes offline
2. Installable with proper manifest and icons
3. Background sync—sync notes when connection restored
4. Push notifications—notify when notes are shared
5. Cache static assets and API responses appropriately
6. Custom install prompt
7. Offline indicator in UI

---

## Resources

- https://web.dev/progressive-web-apps/ (Google's PWA documentation)
- https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps (MDN PWA docs)
- https://whatpwacando.today/ (PWA capabilities showcase)
- https://pwa-workshop.js.org/ (Interactive PWA workshop)
- https://serviceworke.rs/ (Service worker cookbook)
