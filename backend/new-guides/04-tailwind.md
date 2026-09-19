# Tailwind CSS - Interview Ready Guide

**1. Philosophy** - What It Is, Utility-First CSS, Problems Solved

**2. Core Concepts** - Utility Classes, Spacing Scale, Color System

**3. Essential Classes** - Layout, Spacing, Sizing, Typography, Backgrounds, Borders

**4. Responsive Design** - Breakpoints, Mobile-First, Responsive Patterns

**5. State Variants** - Hover, Focus, Form States, Group/Peer, Dark Mode

**6. Component Patterns** - Buttons, Cards, Forms, Navigation, Modal

**7. Customization** - Config File, Custom Values, Arbitrary Values

**8. React Integration** - Component Extraction, clsx, CVA

**9. Performance** - Tree Shaking, Production Builds

**10. Interview Prep** - Common Questions, Practice Project

---

## What It Is

Tailwind CSS is a utility-first CSS framework that provides low-level utility classes to build custom designs directly in your HTML. Instead of writing custom CSS or using pre-built components like Bootstrap, you compose designs by combining small, single-purpose classes.

Traditional CSS approach:
```html
<button class="primary-button">Click me</button>

<style>
.primary-button {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 600;
}
.primary-button:hover {
  background-color: #2563eb;
}
</style>
```

Tailwind approach:
```html
<button class="bg-blue-500 text-white px-4 py-2 rounded font-semibold hover:bg-blue-600">
  Click me
</button>
```

At first glance, the Tailwind version looks verbose and messy. But this approach has profound implications for how you build and maintain user interfaces, which is why it has become the dominant CSS methodology in modern web development.

---

## The Philosophy Behind Utility-First CSS

### The Problems with Traditional CSS

**Naming is hard**: Coming up with meaningful class names like `.card-header-subtitle-secondary` is tedious and leads to inconsistency across a codebase. Different developers name things differently.

**CSS grows forever**: Traditional CSS files only grow. Developers are afraid to delete styles because they might be used somewhere. Over time, stylesheets become bloated with dead code.

**Specificity wars**: As CSS grows, specificity conflicts emerge. Developers resort to `!important` or increasingly specific selectors, creating a maintenance nightmare.

**Context switching**: Writing HTML, then switching to a CSS file, finding or creating the right class, then switching back—this constant context switching slows development.

**Inconsistent design**: Without constraints, developers pick arbitrary values. One element has `padding: 14px`, another has `padding: 17px`. The design lacks visual harmony.

### How Tailwind Solves These Problems

**No naming required**: Classes are predefined and descriptive. `bg-blue-500` is self-documenting—it's a blue background at the 500 shade level.

**CSS doesn't grow**: You use the same utility classes everywhere. Adding a new component doesn't add new CSS. The stylesheet size is bounded.

**No specificity issues**: Every utility has the same specificity. The last class wins in case of conflicts, which is predictable and easy to reason about.

**No context switching**: Styles live directly in the HTML. You see exactly what an element looks like without jumping to another file.

**Design constraints**: Tailwind provides a curated set of spacing, colors, and typography. You choose from `p-2`, `p-4`, `p-6`—not arbitrary pixel values. This naturally creates consistent designs.

---

## Core Concepts

### Utility Classes

A utility class does one thing. It's a mapping from a class name to a small set of CSS properties:

```css
/* What .p-4 compiles to */
.p-4 {
  padding: 1rem; /* 16px */
}

/* What .flex compiles to */
.flex {
  display: flex;
}

/* What .text-center compiles to */
.text-center {
  text-align: center;
}
```

You combine these atoms to build molecules:

```html
<div class="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <!-- A horizontal flexbox, centered vertically, spaced apart, with padding, 
       white background, rounded corners, and a shadow -->
</div>
```

### The Spacing Scale

Tailwind uses a consistent spacing scale based on multiples of 4px (0.25rem):

| Class | Value |
|-------|-------|
| `p-0` | 0px |
| `p-1` | 4px (0.25rem) |
| `p-2` | 8px (0.5rem) |
| `p-3` | 12px (0.75rem) |
| `p-4` | 16px (1rem) |
| `p-5` | 20px (1.25rem) |
| `p-6` | 24px (1.5rem) |
| `p-8` | 32px (2rem) |
| `p-10` | 40px (2.5rem) |
| `p-12` | 48px (3rem) |
| `p-16` | 64px (4rem) |
| `p-20` | 80px (5rem) |
| `p-24` | 96px (6rem) |

This scale applies to padding (`p-`), margin (`m-`), width (`w-`), height (`h-`), gap (`gap-`), and more. The constraint forces consistency.

### The Color System

Tailwind provides a comprehensive color palette with 10 shades per color:

```
50   - Lightest (almost white)
100  - Very light
200  - Light
300  - Light medium
400  - Medium light
500  - Base color
600  - Medium dark
700  - Dark
800  - Very dark
900  - Darkest
950  - Almost black
```

Example with blue:
```html
<div class="bg-blue-50">Very light blue background</div>
<div class="bg-blue-500">Base blue background</div>
<div class="bg-blue-900">Very dark blue background</div>
<div class="text-blue-600">Dark blue text</div>
<div class="border-blue-300">Light blue border</div>
```

Colors available: slate, gray, zinc, neutral, stone, red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose.

---

## Essential Utility Classes

### Layout

```html
<!-- Display -->
<div class="block">Block element</div>
<div class="inline-block">Inline block</div>
<div class="inline">Inline</div>
<div class="hidden">Hidden (display: none)</div>

<!-- Flexbox -->
<div class="flex">Flex container</div>
<div class="flex flex-col">Vertical flex</div>
<div class="flex flex-row">Horizontal flex (default)</div>
<div class="flex items-center">Center vertically</div>
<div class="flex justify-center">Center horizontally</div>
<div class="flex justify-between">Space between items</div>
<div class="flex gap-4">Gap between flex items</div>

<!-- Grid -->
<div class="grid grid-cols-3">3 column grid</div>
<div class="grid grid-cols-12">12 column grid</div>
<div class="grid gap-4">Grid with gaps</div>
<div class="col-span-2">Span 2 columns</div>

<!-- Positioning -->
<div class="relative">Position relative</div>
<div class="absolute top-0 right-0">Absolute, top-right</div>
<div class="fixed bottom-4 right-4">Fixed, bottom-right</div>
<div class="sticky top-0">Sticky header</div>
```

### Spacing

```html
<!-- Padding -->
<div class="p-4">Padding all sides</div>
<div class="px-4">Padding horizontal (left + right)</div>
<div class="py-4">Padding vertical (top + bottom)</div>
<div class="pt-4">Padding top only</div>
<div class="pr-4">Padding right only</div>
<div class="pb-4">Padding bottom only</div>
<div class="pl-4">Padding left only</div>

<!-- Margin (same pattern) -->
<div class="m-4">Margin all sides</div>
<div class="mx-auto">Center horizontally with auto margins</div>
<div class="mt-8">Margin top</div>
<div class="-mt-4">Negative margin top</div>

<!-- Space between children -->
<div class="space-y-4">Vertical space between children</div>
<div class="space-x-4">Horizontal space between children</div>
```

### Sizing

```html
<!-- Width -->
<div class="w-full">100% width</div>
<div class="w-1/2">50% width</div>
<div class="w-1/3">33.33% width</div>
<div class="w-64">256px width</div>
<div class="w-screen">100vw</div>
<div class="max-w-md">Max width medium</div>
<div class="max-w-xl">Max width extra large</div>
<div class="min-w-0">Min width 0</div>

<!-- Height -->
<div class="h-full">100% height</div>
<div class="h-screen">100vh</div>
<div class="h-64">256px height</div>
<div class="min-h-screen">Minimum 100vh</div>
```

### Typography

```html
<!-- Font size -->
<p class="text-xs">Extra small (12px)</p>
<p class="text-sm">Small (14px)</p>
<p class="text-base">Base (16px)</p>
<p class="text-lg">Large (18px)</p>
<p class="text-xl">Extra large (20px)</p>
<p class="text-2xl">2XL (24px)</p>
<p class="text-4xl">4XL (36px)</p>

<!-- Font weight -->
<p class="font-light">Light</p>
<p class="font-normal">Normal</p>
<p class="font-medium">Medium</p>
<p class="font-semibold">Semibold</p>
<p class="font-bold">Bold</p>

<!-- Text alignment -->
<p class="text-left">Left aligned</p>
<p class="text-center">Centered</p>
<p class="text-right">Right aligned</p>

<!-- Text color -->
<p class="text-gray-500">Gray text</p>
<p class="text-blue-600">Blue text</p>
<p class="text-white">White text</p>

<!-- Line height -->
<p class="leading-none">No extra line height</p>
<p class="leading-tight">Tight line height</p>
<p class="leading-relaxed">Relaxed line height</p>

<!-- Other -->
<p class="uppercase">UPPERCASE</p>
<p class="lowercase">lowercase</p>
<p class="capitalize">Capitalize Each Word</p>
<p class="truncate">Truncate with ellipsis...</p>
<p class="line-clamp-3">Clamp to 3 lines...</p>
```

### Backgrounds and Borders

```html
<!-- Background color -->
<div class="bg-white">White background</div>
<div class="bg-gray-100">Light gray background</div>
<div class="bg-blue-500">Blue background</div>
<div class="bg-transparent">Transparent</div>

<!-- Background opacity -->
<div class="bg-black/50">50% opacity black</div>
<div class="bg-blue-500/75">75% opacity blue</div>

<!-- Borders -->
<div class="border">1px border all sides</div>
<div class="border-2">2px border</div>
<div class="border-t">Top border only</div>
<div class="border-gray-300">Gray border color</div>
<div class="border-none">No border</div>

<!-- Border radius -->
<div class="rounded">Small radius (4px)</div>
<div class="rounded-md">Medium radius (6px)</div>
<div class="rounded-lg">Large radius (8px)</div>
<div class="rounded-xl">XL radius (12px)</div>
<div class="rounded-full">Fully rounded (circles)</div>

<!-- Shadow -->
<div class="shadow">Small shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-xl">XL shadow</div>
<div class="shadow-none">No shadow</div>
```

### Interactivity

```html
<!-- Cursor -->
<div class="cursor-pointer">Pointer cursor</div>
<div class="cursor-not-allowed">Not allowed cursor</div>

<!-- Opacity -->
<div class="opacity-50">50% opacity</div>
<div class="opacity-0">Invisible</div>

<!-- Overflow -->
<div class="overflow-hidden">Hide overflow</div>
<div class="overflow-auto">Scroll if needed</div>
<div class="overflow-x-auto">Horizontal scroll if needed</div>

<!-- User select -->
<div class="select-none">Cannot select text</div>
<div class="select-all">Select all on click</div>
```

---

## Responsive Design

Tailwind uses a mobile-first approach with breakpoint prefixes:

| Prefix | Min Width | CSS |
|--------|-----------|-----|
| (none) | 0px | Default (mobile) |
| `sm:` | 640px | `@media (min-width: 640px)` |
| `md:` | 768px | `@media (min-width: 768px)` |
| `lg:` | 1024px | `@media (min-width: 1024px)` |
| `xl:` | 1280px | `@media (min-width: 1280px)` |
| `2xl:` | 1536px | `@media (min-width: 1536px)` |

### Usage Pattern

Start with mobile styles, then add larger breakpoint overrides:

```html
<!-- Stack on mobile, side-by-side on medium screens -->
<div class="flex flex-col md:flex-row">
  <div class="w-full md:w-1/2">Left</div>
  <div class="w-full md:w-1/2">Right</div>
</div>

<!-- Different padding at different breakpoints -->
<div class="p-4 md:p-8 lg:p-12">
  Padding increases with screen size
</div>

<!-- Hide on mobile, show on desktop -->
<div class="hidden lg:block">
  Only visible on large screens
</div>

<!-- Show on mobile, hide on desktop -->
<div class="block lg:hidden">
  Only visible on small screens
</div>

<!-- Different grid columns -->
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

### Real-World Example: Responsive Card Grid

```html
<div class="container mx-auto px-4">
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <img class="w-full h-48 object-cover" src="..." alt="...">
      <div class="p-4 md:p-6">
        <h3 class="text-lg md:text-xl font-semibold mb-2">Card Title</h3>
        <p class="text-gray-600 text-sm md:text-base">Card description...</p>
        <button class="mt-4 w-full md:w-auto px-4 py-2 bg-blue-500 text-white rounded">
          Learn More
        </button>
      </div>
    </div>
    
    <!-- More cards... -->
  </div>
</div>
```

---

## State Variants

Tailwind provides prefixes for different states:

### Hover and Focus

```html
<!-- Hover -->
<button class="bg-blue-500 hover:bg-blue-600">
  Darkens on hover
</button>

<!-- Focus -->
<input class="border focus:border-blue-500 focus:ring-2 focus:ring-blue-200">

<!-- Focus visible (keyboard focus only) -->
<button class="focus-visible:ring-2 focus-visible:ring-blue-500">
  Ring only on keyboard focus
</button>

<!-- Active (while clicking) -->
<button class="bg-blue-500 active:bg-blue-700">
  Even darker while clicking
</button>
```

### Form States

```html
<!-- Disabled -->
<button class="bg-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed" disabled>
  Disabled Button
</button>

<!-- Checked (for checkboxes/radios) -->
<input type="checkbox" class="checked:bg-blue-500">

<!-- Invalid -->
<input class="border invalid:border-red-500" required>

<!-- Placeholder -->
<input class="placeholder:text-gray-400 placeholder:italic" placeholder="Enter text...">
```

### Group and Peer States

Style elements based on parent or sibling state:

```html
<!-- Group: style children based on parent hover -->
<div class="group p-4 hover:bg-gray-100 cursor-pointer">
  <h3 class="text-gray-700 group-hover:text-blue-600">Title changes on parent hover</h3>
  <p class="text-gray-500 group-hover:text-gray-700">Description also changes</p>
</div>

<!-- Peer: style based on sibling state -->
<div>
  <input type="email" class="peer" placeholder="Email">
  <p class="hidden peer-invalid:block text-red-500 text-sm">
    Please enter a valid email
  </p>
</div>
```

### Dark Mode

```html
<!-- Automatic (based on system preference) -->
<div class="bg-white dark:bg-gray-900">
  <p class="text-gray-900 dark:text-white">
    Adapts to system dark mode
  </p>
</div>

<!-- Manual toggle (requires class strategy in config) -->
<html class="dark">
  <body class="bg-white dark:bg-gray-900">
    <!-- Dark mode active -->
  </body>
</html>
```

---

## Common Component Patterns

### Buttons

```html
<!-- Primary button -->
<button class="px-4 py-2 bg-blue-500 text-white font-medium rounded-lg 
               hover:bg-blue-600 focus:outline-none focus:ring-2 
               focus:ring-blue-500 focus:ring-offset-2 
               disabled:bg-gray-400 disabled:cursor-not-allowed
               transition-colors">
  Primary Button
</button>

<!-- Secondary button -->
<button class="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg 
               border border-gray-300 hover:bg-gray-50 
               focus:outline-none focus:ring-2 focus:ring-blue-500">
  Secondary Button
</button>

<!-- Danger button -->
<button class="px-4 py-2 bg-red-500 text-white font-medium rounded-lg 
               hover:bg-red-600">
  Delete
</button>

<!-- Icon button -->
<button class="p-2 rounded-full hover:bg-gray-100">
  <svg class="w-5 h-5 text-gray-600">...</svg>
</button>
```

### Cards

```html
<!-- Basic card -->
<div class="bg-white rounded-lg shadow-md p-6">
  <h3 class="text-xl font-semibold mb-2">Card Title</h3>
  <p class="text-gray-600">Card content goes here.</p>
</div>

<!-- Card with image -->
<div class="bg-white rounded-lg shadow-md overflow-hidden">
  <img class="w-full h-48 object-cover" src="..." alt="...">
  <div class="p-6">
    <h3 class="text-xl font-semibold mb-2">Card Title</h3>
    <p class="text-gray-600 mb-4">Card description.</p>
    <button class="text-blue-500 font-medium hover:text-blue-600">
      Read More →
    </button>
  </div>
</div>

<!-- Horizontal card -->
<div class="flex bg-white rounded-lg shadow-md overflow-hidden">
  <img class="w-48 object-cover" src="..." alt="...">
  <div class="p-6">
    <h3 class="text-xl font-semibold mb-2">Card Title</h3>
    <p class="text-gray-600">Card description.</p>
  </div>
</div>
```

### Forms

```html
<!-- Input field -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-1">
    Email
  </label>
  <input type="email" 
         class="w-full px-3 py-2 border border-gray-300 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-blue-500 
                focus:border-transparent"
         placeholder="you@example.com">
</div>

<!-- Input with error -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-1">
    Email
  </label>
  <input type="email" 
         class="w-full px-3 py-2 border border-red-500 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-red-500"
         placeholder="you@example.com">
  <p class="mt-1 text-sm text-red-500">Please enter a valid email address.</p>
</div>

<!-- Select dropdown -->
<select class="w-full px-3 py-2 border border-gray-300 rounded-lg 
               focus:outline-none focus:ring-2 focus:ring-blue-500 
               bg-white">
  <option>Option 1</option>
  <option>Option 2</option>
  <option>Option 3</option>
</select>

<!-- Checkbox -->
<label class="flex items-center gap-2 cursor-pointer">
  <input type="checkbox" 
         class="w-4 h-4 text-blue-500 border-gray-300 rounded 
                focus:ring-blue-500">
  <span class="text-gray-700">Remember me</span>
</label>
```

### Navigation

```html
<!-- Navbar -->
<nav class="bg-white shadow">
  <div class="max-w-7xl mx-auto px-4">
    <div class="flex justify-between h-16">
      
      <!-- Logo -->
      <div class="flex items-center">
        <span class="text-xl font-bold text-blue-600">Logo</span>
      </div>
      
      <!-- Desktop nav -->
      <div class="hidden md:flex items-center gap-8">
        <a href="#" class="text-gray-600 hover:text-gray-900">Home</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">Features</a>
        <a href="#" class="text-gray-600 hover:text-gray-900">Pricing</a>
        <button class="px-4 py-2 bg-blue-500 text-white rounded-lg 
                       hover:bg-blue-600">
          Sign Up
        </button>
      </div>
      
      <!-- Mobile menu button -->
      <div class="md:hidden flex items-center">
        <button class="p-2 rounded-lg hover:bg-gray-100">
          <svg class="w-6 h-6">...</svg>
        </button>
      </div>
    </div>
  </div>
</nav>
```

### Modal

```html
<!-- Backdrop -->
<div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
  
  <!-- Modal -->
  <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
    
    <!-- Header -->
    <div class="flex justify-between items-center p-4 border-b">
      <h3 class="text-lg font-semibold">Modal Title</h3>
      <button class="p-1 hover:bg-gray-100 rounded">
        <svg class="w-5 h-5">...</svg>
      </button>
    </div>
    
    <!-- Body -->
    <div class="p-4">
      <p class="text-gray-600">Modal content goes here.</p>
    </div>
    
    <!-- Footer -->
    <div class="flex justify-end gap-2 p-4 border-t">
      <button class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
        Cancel
      </button>
      <button class="px-4 py-2 bg-blue-500 text-white rounded-lg 
                     hover:bg-blue-600">
        Confirm
      </button>
    </div>
  </div>
</div>
```

---

## Customization

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Add custom colors
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0ea5e9',
          600: '#0284c7',
          900: '#0c4a6e',
        },
      },
      // Add custom fonts
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      // Add custom spacing
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      // Add custom breakpoints
      screens: {
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
}
```

### Using Custom Values

```html
<!-- Custom color -->
<div class="bg-brand-500 text-brand-50">
  Using custom brand colors
</div>

<!-- Custom font -->
<h1 class="font-display text-4xl">
  Using display font
</h1>

<!-- Custom spacing -->
<div class="w-128">
  Using custom width
</div>
```

### Arbitrary Values

For one-off values not in your design system:

```html
<!-- Arbitrary values with square brackets -->
<div class="w-[137px]">Exact 137px width</div>
<div class="bg-[#1da1f2]">Twitter blue</div>
<div class="grid-cols-[1fr_2fr_1fr]">Custom grid</div>
<div class="top-[117px]">Precise positioning</div>
<div class="text-[22px]">Custom font size</div>
```

Use sparingly—if you use the same arbitrary value multiple times, add it to your config instead.

---

## Working with Components (React)

### Extracting Components, Not Classes

The Tailwind way is to extract reusable **components**, not CSS classes:

```jsx
// ❌ Don't do this (extracting to CSS)
// styles.css: .btn-primary { @apply px-4 py-2 bg-blue-500 ... }

// ✅ Do this (extracting to components)
function Button({ children, variant = 'primary', ...props }) {
  const baseClasses = "px-4 py-2 font-medium rounded-lg focus:outline-none focus:ring-2 transition-colors";
  
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  };
  
  return (
    <button className={`${baseClasses} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}

// Usage
<Button variant="primary">Click me</Button>
<Button variant="danger">Delete</Button>
```

### Conditional Classes with clsx

The `clsx` library helps manage conditional classes:

```jsx
import clsx from 'clsx';

function Button({ children, disabled, loading, size = 'md' }) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        // Base styles always applied
        "font-medium rounded-lg transition-colors",
        
        // Size variants
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        
        // State variants
        {
          'bg-blue-500 text-white hover:bg-blue-600': !disabled,
          'bg-gray-400 text-gray-200 cursor-not-allowed': disabled,
          'opacity-75': loading,
        }
      )}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

### Class Variance Authority (CVA)

For more complex component variants, CVA provides type-safe variant management:

```jsx
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  // Base classes
  "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2",
  {
    variants: {
      intent: {
        primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
        secondary: "bg-white text-gray-700 border hover:bg-gray-50",
        danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
      },
      size: {
        sm: "px-3 py-1.5 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  }
);

function Button({ intent, size, className, children, ...props }) {
  return (
    <button className={buttonVariants({ intent, size, className })} {...props}>
      {children}
    </button>
  );
}
```

---

## Performance

### How Tailwind Stays Small

Tailwind scans your files for class names and only includes the CSS for classes you actually use. This is called "purging" or "tree-shaking."

Configure which files to scan in `tailwind.config.js`:

```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    // Add any other file types that contain Tailwind classes
  ],
  // ...
}
```

### Important Rules

**Don't construct class names dynamically:**

```jsx
// ❌ Bad - Tailwind can't detect these
const color = 'blue';
<div className={`bg-${color}-500`}>

// ✅ Good - Full class names are detectable
const bgColor = isActive ? 'bg-blue-500' : 'bg-gray-500';
<div className={bgColor}>
```

**Don't use string interpolation for classes:**

```jsx
// ❌ Bad
<div className={`p-${size}`}>

// ✅ Good
const padding = { sm: 'p-2', md: 'p-4', lg: 'p-6' };
<div className={padding[size]}>
```

### Production Build Size

A typical production Tailwind CSS file is 10-30KB gzipped, containing only the utilities you use. This is often smaller than Bootstrap or other frameworks because unused styles are eliminated.

---

## Interview Questions

**Q: What is Tailwind CSS and how is it different from Bootstrap?**

A: Tailwind is a utility-first CSS framework that provides low-level utility classes (like `p-4`, `flex`, `text-blue-500`) that you compose to build designs. Bootstrap is a component-first framework with pre-built components (like `.btn`, `.card`, `.navbar`). Tailwind gives more flexibility and customization but requires building components yourself. Bootstrap is faster to prototype but harder to customize without overriding styles.

**Q: What are the benefits of utility-first CSS?**

A: No naming fatigue (classes are pre-defined), CSS doesn't grow with your project (you reuse the same utilities), no specificity conflicts, no context switching between files, design constraints ensure consistency, and dead code elimination is automatic. It also makes responsive design and state variants (hover, focus) easy with prefixes.

**Q: How does Tailwind handle responsive design?**

A: Tailwind uses a mobile-first approach with breakpoint prefixes. Unprefixed classes apply to all sizes, then `sm:`, `md:`, `lg:`, `xl:`, `2xl:` prefixes apply at progressively larger breakpoints. For example, `text-sm md:text-base lg:text-lg` starts small, becomes base size at medium screens, and large at large screens.

**Q: How do you handle dark mode in Tailwind?**

A: Use the `dark:` prefix on any utility. For example, `bg-white dark:bg-gray-900`. Tailwind supports two strategies: `media` (follows system preference via `prefers-color-scheme`) or `class` (toggle by adding `dark` class to the `html` element). Configure in `tailwind.config.js` with `darkMode: 'class'` or `darkMode: 'media'`.

**Q: How do you reuse styles in Tailwind without copying class lists everywhere?**

A: Extract components, not CSS classes. In React, create a `Button` component that encapsulates the styling. Use libraries like `clsx` or `class-variance-authority` to manage variants. The `@apply` directive exists but is discouraged for most cases—component extraction is preferred.

**Q: How does Tailwind keep CSS bundle size small?**

A: Tailwind scans your source files (configured in `content` array) for class names, then generates CSS only for the classes you actually use. This "tree-shaking" means your production CSS only contains utilities that appear in your code. Dynamic class construction breaks this, so you must use complete class names.

**Q: What's the Tailwind spacing scale?**

A: Tailwind uses a scale based on 4px (0.25rem) increments: `1` = 4px, `2` = 8px, `4` = 16px, `8` = 32px, etc. This applies to padding, margin, width, height, and gap. The constraint ensures consistent spacing throughout your design rather than arbitrary pixel values.

**Q: How do you add custom colors or fonts to Tailwind?**

A: Extend the `theme` in `tailwind.config.js`. Use `theme.extend.colors` to add colors while keeping defaults, or `theme.colors` to replace them entirely. Same pattern for fonts (`fontFamily`), spacing, breakpoints, etc. For one-off values, use arbitrary value syntax like `bg-[#1da1f2]`.

---

## Practice Project

Build a responsive landing page with:

1. **Navbar**: Logo, links (hidden on mobile), hamburger menu button (visible on mobile)
2. **Hero section**: Headline, subheadline, CTA button, hero image
3. **Features grid**: 3 columns on desktop, 1 on mobile, with icons
4. **Testimonial cards**: Horizontal scroll on mobile, grid on desktop
5. **Footer**: Multi-column on desktop, stacked on mobile

**Requirements:**
- Fully responsive (mobile-first)
- Dark mode support
- Proper hover and focus states
- Use only Tailwind utilities (no custom CSS)

---

## Resources

- https://tailwindcss.com/docs (official documentation—excellent)
- https://tailwindui.com (official component examples—some free)
- https://headlessui.com (unstyled accessible components for React/Vue)
- https://heroicons.com (icon set from Tailwind creators)
- https://play.tailwindcss.com (online playground)
