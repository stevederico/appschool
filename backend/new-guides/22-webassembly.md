# WebAssembly (Wasm) - Interview Ready Guide

**1. Fundamentals** - What It Is, Why WebAssembly?

**2. Browser Integration** - Using WebAssembly in JavaScript

**3. Rust to WebAssembly** - wasm-pack, wasm-bindgen

**4. AssemblyScript** - TypeScript-like Syntax

**5. Advanced** - Use Cases, WASI, Performance Tips

**6. Interview Prep** - Common Questions

---

## What It Is

WebAssembly (Wasm) is a binary instruction format designed as a portable compilation target for programming languages. It enables near-native performance in web browsers and beyond.

JavaScript is the only language browsers natively understand. WebAssembly adds a second language—a low-level, fast one. You write code in C, C++, Rust, or Go, compile to WebAssembly, and run it in the browser at near-native speed.

WebAssembly is:
- **Fast**: Near-native execution speed
- **Safe**: Runs in sandboxed environment  
- **Portable**: Same binary runs everywhere
- **Language-agnostic**: Compile from many languages

---

## Why WebAssembly?

JavaScript struggles with CPU-intensive tasks. WebAssembly enables:

| Use Case | Example |
|----------|---------|
| Gaming | Unity, Unreal Engine in browser |
| Media | Video/audio encoding, FFmpeg |
| Design | Figma, AutoCAD |
| Crypto | Fast cryptographic operations |
| AI/ML | TensorFlow acceleration |

---

## Using WebAssembly in JavaScript

### Loading Modules

```javascript
// Streaming instantiation (recommended)
const { instance } = await WebAssembly.instantiateStreaming(
  fetch('module.wasm'),
  importObject
);

// Use exported functions
const result = instance.exports.add(2, 3);
```

### Import Object

```javascript
const importObject = {
  env: {
    memory: new WebAssembly.Memory({ initial: 1 }),
    log: (value) => console.log('From Wasm:', value),
  }
};
```

### Memory

```javascript
// WebAssembly uses linear memory
const memory = instance.exports.memory;
const buffer = new Uint8Array(memory.buffer);

// String passing
function writeString(memory, offset, string) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(string);
  new Uint8Array(memory.buffer).set(bytes, offset);
  return bytes.length;
}
```

---

## Rust to WebAssembly

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

#[wasm_bindgen]
pub struct Counter {
    count: u32,
}

#[wasm_bindgen]
impl Counter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Counter {
        Counter { count: 0 }
    }
    
    pub fn increment(&mut self) {
        self.count += 1;
    }
    
    pub fn get_count(&self) -> u32 {
        self.count
    }
}
```

```bash
wasm-pack build --target web
```

```javascript
import init, { greet, fibonacci, Counter } from './pkg/my_lib.js';

await init();
console.log(greet('Steve'));
console.log(fibonacci(40));

const counter = new Counter();
counter.increment();
console.log(counter.get_count());
```

---

## AssemblyScript

TypeScript-like syntax for WebAssembly:

```typescript
// assembly/index.ts
export function add(a: i32, b: i32): i32 {
  return a + b;
}

export function fibonacci(n: i32): i32 {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

---

## Use Cases

### Image Processing

```rust
#[wasm_bindgen]
pub fn grayscale(pixels: &mut [u8]) {
    for chunk in pixels.chunks_exact_mut(4) {
        let gray = (chunk[0] as f32 * 0.299 
                  + chunk[1] as f32 * 0.587 
                  + chunk[2] as f32 * 0.114) as u8;
        chunk[0] = gray;
        chunk[1] = gray;
        chunk[2] = gray;
    }
}
```

---

## WASI

WebAssembly System Interface—run Wasm outside browsers:

```bash
# Compile for WASI
rustup target add wasm32-wasi
cargo build --target wasm32-wasi

# Run with wasmtime
wasmtime my-app.wasm
```

---

## Performance Tips

1. **Minimize JS/Wasm boundary crossings**
2. **Use typed arrays for data transfer**
3. **Batch operations instead of many small calls**
4. **Pre-allocate memory when possible**

---

## Interview Questions

**Q: What is WebAssembly and why use it?**

A: WebAssembly is a binary format for a stack-based VM enabling near-native performance in browsers. Use for CPU-intensive tasks (image processing, games, crypto), porting C/C++/Rust code, and performance-critical operations where JavaScript is too slow.

**Q: How does WebAssembly interact with JavaScript?**

A: Wasm exports functions JS can call and imports functions from JS. They share linear memory (ArrayBuffer). Complex data must be serialized through memory since Wasm only handles numbers natively. Tools like wasm-bindgen automate this.

**Q: What are WebAssembly limitations?**

A: No direct DOM access (must use JS). Only numeric types (strings need encoding). No garbage collection in Wasm itself. Limited debugging. No direct network/file access in browser.

**Q: What is WASI?**

A: WebAssembly System Interface—standard API for Wasm to access OS capabilities (files, network). Enables running Wasm on servers, edge, CLI. Sandboxed with explicit capability grants.

---

## Resources

- https://webassembly.org/
- https://rustwasm.github.io/book/
- https://www.assemblyscript.org/
- https://wasmbyexample.dev/
