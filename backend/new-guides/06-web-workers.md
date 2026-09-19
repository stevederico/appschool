# Web Workers - Interview Ready Guide

**1. Fundamentals** - What It Is, Concurrency Model, Event Loop

**2. Worker Types** - Dedicated, Shared, Service Workers

**3. When to Use** - Heavy Computation, When NOT to Use

**4. Basic Usage** - Creating Workers, postMessage, Termination

**5. Data Transfer** - Structured Clone, Transferable Objects

**6. Patterns** - Worker Pool, Comlink, Progress Reporting

**7. Modern Setup** - ES Modules, Vite/Webpack Integration

**8. Limitations** - No DOM, Same-Origin, Gotchas

**9. Interview Prep** - Common Questions, Practice Project

---

## What It Is

Web Workers allow you to run JavaScript in background threads, separate from the main thread that handles the user interface. This is significant because JavaScript is traditionally single-threaded—long-running computations block everything else, making the page unresponsive.

Consider what happens when you run intensive code on the main thread:

```javascript
// This blocks the UI for several seconds
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

button.addEventListener('click', () => {
  const result = fibonacci(45); // UI freezes!
  console.log(result);
});
```

While `fibonacci(45)` runs, the browser can't:
- Respond to clicks or scrolling
- Update animations
- Render any changes
- Process other event handlers

The page appears frozen. Users might think it crashed.

Web Workers solve this by running code in a separate thread:

```javascript
// main.js
const worker = new Worker('worker.js');

worker.postMessage(45);

worker.onmessage = (e) => {
  console.log('Result:', e.data); // UI stayed responsive!
};

// worker.js
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

self.onmessage = (e) => {
  const result = fibonacci(e.data);
  self.postMessage(result);
};
```

Now the calculation happens in the background. The main thread remains free to handle user interactions, animations, and rendering.

---

## The JavaScript Concurrency Model

To understand why Web Workers matter, you need to understand JavaScript's execution model.

### The Event Loop

JavaScript uses an event loop with a single call stack:

```
┌─────────────────────────────────────────┐
│              Call Stack                  │
│  (only one thing executes at a time)    │
└─────────────────────────────────────────┘
                    ↑
┌─────────────────────────────────────────┐
│              Event Loop                  │
│    (picks tasks from queues)            │
└─────────────────────────────────────────┘
         ↑                    ↑
┌─────────────────┐  ┌─────────────────┐
│   Task Queue    │  │ Microtask Queue │
│ (setTimeout,    │  │  (Promises,     │
│  events, etc.)  │  │   queueMicrotask)│
└─────────────────┘  └─────────────────┘
```

When you call `setTimeout` or handle a click event, the callback goes into a queue. The event loop processes one task at a time. If a task takes 5 seconds, nothing else can run for 5 seconds.

### The 60fps Budget

For smooth 60fps animations, each frame must complete in ~16ms. If your JavaScript takes longer, frames are dropped:

```
Frame 1: 16ms ✓
Frame 2: 16ms ✓
Frame 3: 200ms (heavy computation) ✗ — 12 frames dropped!
Frame 4: 16ms ✓
```

Users perceive this as jank or freezing.

### How Workers Help

Workers run in separate threads with their own event loops:

```
Main Thread                    Worker Thread
┌─────────────┐               ┌─────────────┐
│ Call Stack  │               │ Call Stack  │
│ Event Loop  │               │ Event Loop  │
│     UI      │  postMessage  │ Heavy Work  │
│  Rendering  │ ←──────────→  │   Only      │
└─────────────┘               └─────────────┘
```

The worker can spend 5 seconds on a computation while the main thread continues handling UI at 60fps.

---

## Types of Workers

### Dedicated Workers

The most common type. Each worker is owned by a single script:

```javascript
// One-to-one relationship
const worker = new Worker('worker.js');
```

### Shared Workers

Can be accessed by multiple scripts (different tabs, iframes):

```javascript
// Multiple scripts can connect to the same worker
const worker = new SharedWorker('shared-worker.js');
worker.port.start();
worker.port.postMessage('hello');
```

Useful for: shared state across tabs, connection pooling.

### Service Workers

Special workers that act as proxy servers between web apps and the network:

```javascript
// Registered, not instantiated directly
navigator.serviceWorker.register('/sw.js');
```

Useful for: offline functionality, push notifications, background sync.

This guide focuses on **Dedicated Workers**, the most commonly used type.

---

## When to Use Web Workers

### CPU-Intensive Calculations
- Mathematical computations (cryptography, physics simulations)
- Data processing (parsing large datasets, transformations)
- Image/video processing (filters, encoding)
- Machine learning inference

### Large Data Operations
- Sorting/filtering large arrays
- Searching through big datasets
- JSON parsing of large files
- Compression/decompression

### Real-Time Processing
- Audio processing
- Canvas manipulation
- Game logic

### Background Tasks
- Prefetching and caching data
- Periodic data synchronization
- Log processing and analytics

---

## When NOT to Use Web Workers

### DOM Manipulation
Workers cannot access the DOM. They can't read or modify HTML, CSS, or anything visual. All UI updates must happen on the main thread.

### Simple Operations
Worker creation has overhead. For operations that complete in milliseconds, the overhead exceeds the benefit.

### Frequent Small Messages
Each `postMessage` has serialization overhead. If you're sending thousands of small messages per second, that overhead adds up.

### When Shared State Is Required
Workers communicate through message passing, not shared memory (with some exceptions). If your code relies heavily on shared mutable state, refactoring for workers is complex.

---

## Basic Usage

### Creating a Worker

**External file (recommended):**
```javascript
// main.js
const worker = new Worker('worker.js');

// worker.js (separate file)
self.onmessage = (e) => {
  // Handle messages
};
```

**Inline with Blob (useful for bundlers):**
```javascript
const workerCode = `
  self.onmessage = (e) => {
    const result = e.data * 2;
    self.postMessage(result);
  };
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));
```

### Communication

Workers communicate via message passing:

```javascript
// main.js
const worker = new Worker('worker.js');

// Send data to worker
worker.postMessage({ type: 'calculate', data: [1, 2, 3, 4, 5] });

// Receive data from worker
worker.onmessage = (event) => {
  console.log('Result:', event.data);
};

// Handle errors
worker.onerror = (error) => {
  console.error('Worker error:', error.message);
};
```

```javascript
// worker.js
self.onmessage = (event) => {
  const { type, data } = event.data;
  
  if (type === 'calculate') {
    const sum = data.reduce((a, b) => a + b, 0);
    self.postMessage({ type: 'result', sum });
  }
};
```

### Terminating Workers

```javascript
// From main thread
worker.terminate(); // Immediate termination

// From within worker
self.close(); // Graceful shutdown
```

---

## Data Transfer

### Structured Clone Algorithm

When you call `postMessage`, data is copied using the structured clone algorithm. This handles most JavaScript types:

**Supported:**
- Primitives (strings, numbers, booleans, null, undefined)
- Arrays and Objects (deep cloned)
- Date, RegExp, Blob, File, FileList
- ArrayBuffer, TypedArrays
- Map, Set
- ImageData, ImageBitmap

**NOT Supported:**
- Functions
- DOM nodes
- Error objects (partially)
- Symbols
- WeakMap, WeakSet

```javascript
// This works (deep clone)
worker.postMessage({
  name: 'test',
  numbers: [1, 2, 3],
  nested: { deep: { data: true } },
  date: new Date(),
  buffer: new ArrayBuffer(8)
});

// This throws an error
worker.postMessage({
  callback: () => console.log('nope'), // Functions can't be cloned
  element: document.body              // DOM nodes can't be cloned
});
```

### Transferable Objects

For large binary data, cloning is expensive. Transferable objects move ownership instead of copying:

```javascript
// Without transfer (copies the buffer - slow for large data)
const buffer = new ArrayBuffer(1024 * 1024 * 100); // 100MB
worker.postMessage(buffer); // Copies 100MB - slow!
console.log(buffer.byteLength); // Still 100MB (we have a copy)

// With transfer (moves the buffer - instant)
const buffer = new ArrayBuffer(1024 * 1024 * 100); // 100MB
worker.postMessage(buffer, [buffer]); // Transfers ownership - instant!
console.log(buffer.byteLength); // 0! Buffer is now "neutered"
```

**Transferable types:**
- ArrayBuffer
- MessagePort
- ImageBitmap
- OffscreenCanvas

```javascript
// Transfer syntax
worker.postMessage(message, [transferable1, transferable2]);

// Example: transferring multiple buffers
const buffer1 = new ArrayBuffer(1000);
const buffer2 = new ArrayBuffer(2000);
worker.postMessage(
  { data1: buffer1, data2: buffer2 },
  [buffer1, buffer2]
);
```

### SharedArrayBuffer

For true shared memory (both threads access the same memory):

```javascript
// main.js
const shared = new SharedArrayBuffer(1024);
const view = new Int32Array(shared);

worker.postMessage({ buffer: shared });

// Both threads now access the same memory!
view[0] = 42; // Worker can see this immediately

// worker.js
self.onmessage = (e) => {
  const view = new Int32Array(e.data.buffer);
  console.log(view[0]); // 42 (same memory!)
  view[1] = 100; // Main thread sees this
};
```

**⚠️ Warning:** SharedArrayBuffer requires special HTTP headers due to Spectre vulnerabilities:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

For synchronization with SharedArrayBuffer, use `Atomics`:
```javascript
Atomics.store(view, 0, 42);      // Atomic write
Atomics.load(view, 0);           // Atomic read
Atomics.add(view, 0, 1);         // Atomic increment
Atomics.wait(view, 0, expected); // Wait for value change
Atomics.notify(view, 0);         // Wake waiting threads
```

---

## Practical Patterns

### Request-Response Pattern

Treat the worker like an async function:

```javascript
// main.js
class WorkerWrapper {
  constructor(url) {
    this.worker = new Worker(url);
    this.pending = new Map();
    this.nextId = 0;
    
    this.worker.onmessage = (e) => {
      const { id, result, error } = e.data;
      const { resolve, reject } = this.pending.get(id);
      this.pending.delete(id);
      
      if (error) {
        reject(new Error(error));
      } else {
        resolve(result);
      }
    };
  }
  
  call(method, ...args) {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, method, args });
    });
  }
  
  terminate() {
    this.worker.terminate();
  }
}

// Usage
const worker = new WorkerWrapper('worker.js');

const result = await worker.call('fibonacci', 40);
console.log(result);
```

```javascript
// worker.js
const methods = {
  fibonacci(n) {
    if (n <= 1) return n;
    return methods.fibonacci(n - 1) + methods.fibonacci(n - 2);
  },
  
  sum(numbers) {
    return numbers.reduce((a, b) => a + b, 0);
  }
};

self.onmessage = (e) => {
  const { id, method, args } = e.data;
  
  try {
    const result = methods[method](...args);
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: err.message });
  }
};
```

### Worker Pool

Distribute work across multiple workers:

```javascript
class WorkerPool {
  constructor(url, size = navigator.hardwareConcurrency || 4) {
    this.workers = Array.from({ length: size }, () => ({
      worker: new Worker(url),
      busy: false
    }));
    this.queue = [];
    
    this.workers.forEach(w => {
      w.worker.onmessage = (e) => {
        w.busy = false;
        w.resolve(e.data);
        this.processQueue();
      };
    });
  }
  
  exec(data) {
    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.processQueue();
    });
  }
  
  processQueue() {
    if (this.queue.length === 0) return;
    
    const available = this.workers.find(w => !w.busy);
    if (!available) return;
    
    const { data, resolve, reject } = this.queue.shift();
    available.busy = true;
    available.resolve = resolve;
    available.reject = reject;
    available.worker.postMessage(data);
  }
  
  terminate() {
    this.workers.forEach(w => w.worker.terminate());
  }
}

// Usage
const pool = new WorkerPool('compute-worker.js', 4);

// Process many items in parallel
const results = await Promise.all(
  items.map(item => pool.exec(item))
);
```

### Chunked Processing with Progress

Process large datasets in chunks, reporting progress:

```javascript
// main.js
const worker = new Worker('chunk-worker.js');

worker.postMessage({
  type: 'process',
  data: largeArray,
  chunkSize: 10000
});

worker.onmessage = (e) => {
  const { type, progress, result } = e.data;
  
  if (type === 'progress') {
    updateProgressBar(progress); // 0 to 1
  } else if (type === 'complete') {
    console.log('Done:', result);
  }
};
```

```javascript
// chunk-worker.js
self.onmessage = (e) => {
  const { data, chunkSize } = e.data;
  const results = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    
    // Process chunk
    const processed = chunk.map(item => heavyComputation(item));
    results.push(...processed);
    
    // Report progress
    self.postMessage({
      type: 'progress',
      progress: Math.min(1, (i + chunkSize) / data.length)
    });
  }
  
  self.postMessage({ type: 'complete', result: results });
};
```

### OffscreenCanvas

Perform canvas rendering in a worker:

```javascript
// main.js
const canvas = document.getElementById('canvas');
const offscreen = canvas.transferControlToOffscreen();

const worker = new Worker('canvas-worker.js');
worker.postMessage({ canvas: offscreen }, [offscreen]);
```

```javascript
// canvas-worker.js
let ctx;

self.onmessage = (e) => {
  if (e.data.canvas) {
    ctx = e.data.canvas.getContext('2d');
    render();
  }
};

function render() {
  // Heavy rendering logic runs in worker
  ctx.fillStyle = 'blue';
  ctx.fillRect(0, 0, 100, 100);
  
  // Continue animation
  requestAnimationFrame(render);
}
```

---

## Worker with ES Modules

Modern browsers support ES modules in workers:

```javascript
// main.js
const worker = new Worker('worker.js', { type: 'module' });
```

```javascript
// worker.js
import { heavyComputation } from './utils.js';

self.onmessage = (e) => {
  const result = heavyComputation(e.data);
  self.postMessage(result);
};
```

This allows you to:
- Use `import`/`export`
- Share code between main thread and workers
- Use npm packages (with bundler support)

---

## Workers with Bundlers (Vite, Webpack)

### Vite

```javascript
// Import worker with ?worker suffix
import MyWorker from './worker.js?worker';

const worker = new MyWorker();
worker.postMessage('hello');
```

Or with URL constructor:

```javascript
const worker = new Worker(
  new URL('./worker.js', import.meta.url),
  { type: 'module' }
);
```

### Webpack 5

```javascript
const worker = new Worker(
  new URL('./worker.js', import.meta.url)
);
```

---

## Limitations and Gotchas

### No DOM Access

Workers cannot:
- Access `document` or `window`
- Manipulate HTML/CSS
- Use DOM APIs like `querySelector`

They can:
- Use `fetch`, `WebSocket`, `IndexedDB`
- Use `setTimeout`, `setInterval`
- Use `crypto`, `TextEncoder/Decoder`
- Import scripts with `importScripts()` (non-module workers)

### Same-Origin Restriction

Workers must be loaded from the same origin as the page. You can't do:
```javascript
// ❌ This fails
const worker = new Worker('https://other-domain.com/worker.js');
```

### No Shared Scope

Workers don't share variables with the main thread:

```javascript
// main.js
let counter = 0;
const worker = new Worker('worker.js');

// Worker cannot access 'counter'
// Must use postMessage to communicate
```

### Debugging

Workers appear in browser DevTools under "Sources" → "Threads" or similar. You can set breakpoints and inspect variables just like main thread code.

---

## Interview Questions

**Q: What are Web Workers and why would you use them?**

A: Web Workers allow JavaScript to run in background threads separate from the main thread. Since JavaScript is single-threaded and the main thread handles UI, long-running computations block rendering and make the page unresponsive. Workers let you offload heavy work (data processing, calculations, image manipulation) to background threads while keeping the UI smooth at 60fps.

**Q: How do Web Workers communicate with the main thread?**

A: Workers communicate via message passing using `postMessage()` and the `onmessage` event handler. Data is copied between threads using the structured clone algorithm (deep copy). For large binary data, you can use transferable objects to move ownership without copying, or SharedArrayBuffer for true shared memory (with proper headers and Atomics for synchronization).

**Q: What can't Web Workers access?**

A: Workers cannot access the DOM—no `document`, `window`, or any DOM manipulation. They also can't access the parent's variables directly. However, they can use `fetch`, `WebSocket`, `IndexedDB`, `setTimeout`, `crypto`, and other non-DOM APIs. All UI updates must happen on the main thread.

**Q: What's the difference between copying and transferring data to a worker?**

A: By default, `postMessage` copies data using the structured clone algorithm—both threads have independent copies. For large ArrayBuffers, this is slow. Transferable objects (ArrayBuffer, ImageBitmap, OffscreenCanvas) can be transferred instead of copied—ownership moves to the receiving thread, and the original becomes unusable ("neutered"). Transfer is essentially instant regardless of size.

**Q: What is SharedArrayBuffer and when would you use it?**

A: SharedArrayBuffer creates memory that both threads can access simultaneously—true shared memory. Unlike transferables (which move ownership), both threads can read/write the same bytes. Use it when you need frequent, fine-grained communication between threads. Requires special HTTP headers (COOP/COEP) and use of Atomics for safe concurrent access to prevent race conditions.

**Q: How would you implement a worker pool?**

A: Create multiple workers upfront (typically matching CPU core count). Maintain a queue of pending tasks. When work arrives, assign it to an available worker. When a worker completes, mark it available and process the next queued item. This amortizes worker creation overhead and limits concurrent workers to prevent resource exhaustion.

**Q: What are the different types of workers?**

A: Dedicated Workers are the most common—one worker per script instance. Shared Workers can be accessed by multiple scripts/tabs from the same origin—useful for shared state. Service Workers act as network proxies between the app and network—used for offline functionality, caching, and push notifications.

---

## Practice Project

Build an image processing application:

**Requirements:**
1. Load images from file input
2. Apply filters (grayscale, blur, sharpen, brightness) in a worker
3. Show real-time progress for large images
4. Use transferable objects for image data
5. Allow cancellation of in-progress operations
6. Worker pool for batch processing multiple images

**Concepts you'll use:**
- OffscreenCanvas or ImageData manipulation
- Transferable ArrayBuffers
- Progress reporting
- Request/response pattern with cancellation

---

## Resources

- https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API (MDN documentation)
- https://web.dev/workers-basics/ (Web.dev guide)
- https://surma.dev/things/is-postmessage-slow/ (Performance deep dive)
- https://github.com/nickytonline/web-worker-patterns (Patterns and examples)
