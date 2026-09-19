# WebGL - Interview Ready Guide

**1. Fundamentals** - What It Is, Rendering Pipeline

**2. Core Concepts** - Shaders, Buffers, Textures, Transformations

**3. Three.js** - High-Level Alternative for 3D Graphics

**4. Key Concepts** - GPU, GLSL, Matrices

**5. Interview Prep** - Common Questions

---

## What It Is

WebGL (Web Graphics Library) is a JavaScript API for rendering 2D and 3D graphics in the browser without plugins. It's based on OpenGL ES and provides direct access to the GPU.

---

## Core Concepts

### Rendering Pipeline

```
Vertex Data → Vertex Shader → Rasterization → Fragment Shader → Framebuffer
```

1. **Vertex Shader**: Processes each vertex (position, transform)
2. **Rasterization**: Converts geometry to fragments (pixels)
3. **Fragment Shader**: Colors each fragment

### Basic Setup

```javascript
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

// Shaders (GLSL)
const vertexShaderSource = `#version 300 es
    in vec4 a_position;
    void main() {
        gl_Position = a_position;
    }
`;

const fragmentShaderSource = `#version 300 es
    precision highp float;
    out vec4 outColor;
    void main() {
        outColor = vec4(1.0, 0.0, 0.0, 1.0); // Red
    }
`;

// Compile shaders
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// Link program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

// Create geometry
const positions = new Float32Array([
    0.0,  0.5,   // Top
   -0.5, -0.5,   // Bottom left
    0.5, -0.5    // Bottom right
]);

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

// Connect attribute
const positionLocation = gl.getAttribLocation(program, 'a_position');
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Render
gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0, 0, 0, 1);
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.TRIANGLES, 0, 3);
```

---

## Three.js (High-Level Alternative)

```javascript
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

// Animate
function animate() {
    requestAnimationFrame(animate);
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
}
animate();
```

---

## Key Concepts

- **Buffers**: Store vertex data on GPU
- **Shaders**: Programs running on GPU (GLSL language)
- **Uniforms**: Values passed to shaders (constant per draw)
- **Attributes**: Per-vertex data (position, color, UV)
- **Textures**: 2D images mapped to geometry
- **Matrices**: Transform objects (model, view, projection)

---

## Interview Questions

**Q: What is WebGL?**

A: JavaScript API for GPU-accelerated 2D/3D graphics in browsers. Based on OpenGL ES. Uses shaders (GLSL) for vertex and fragment processing. Low-level but extremely fast.

**Q: When use WebGL vs Canvas 2D?**

A: WebGL for 3D, heavy 2D (thousands of objects), image processing, games. Canvas 2D for simpler 2D, charts, basic drawing. Consider Three.js/PixiJS over raw WebGL for productivity.

---

## Resources

- https://webglfundamentals.org/
- https://threejs.org/
