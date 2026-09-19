# TypeScript - Interview Ready Guide

**1. Fundamentals** - What It Is, Why TypeScript Matters

**2. Basic Types** - Primitives, Arrays, Objects, Any, Unknown, Never

**3. Functions** - Parameter Types, Return Types, Overloads

**4. Interfaces & Types** - Interfaces, Type Aliases, Extending, Differences

**5. Advanced Types** - Union, Intersection, Literal Types

**6. Generics** - Generic Functions, Constraints, Utility Types

**7. Type Narrowing** - Type Guards, Discriminated Unions

**8. React Integration** - Props, Hooks, Events, Context

**9. Configuration** - tsconfig.json, Strict Mode

**10. Interview Prep** - Common Questions, Practice Project

---

## What It Is

TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. Every valid JavaScript program is also a valid TypeScript program, but TypeScript adds optional static typing, classes, interfaces, and other features that help you write more maintainable code.

The key insight behind TypeScript is that JavaScript's dynamic typing, while flexible, makes it easy to introduce bugs that only appear at runtime. TypeScript catches these errors at compile time:

```javascript
// JavaScript - No error until runtime
function greet(name) {
  return "Hello, " + name.toUpperCase();
}

greet(42); // Runtime error: toUpperCase is not a function
```

```typescript
// TypeScript - Error at compile time
function greet(name: string): string {
  return "Hello, " + name.toUpperCase();
}

greet(42); // Compile error: Argument of type 'number' is not assignable to parameter of type 'string'
```

TypeScript was developed by Microsoft and has become the standard for large-scale JavaScript applications. React, Vue, Angular, Node.js libraries—most modern JavaScript projects use TypeScript or provide TypeScript definitions.

---

## Why TypeScript Matters

### Catches Bugs Early

Types catch entire categories of bugs before they reach production:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function sendEmail(user: User) {
  // TypeScript ensures user has an email property
  sendMail(user.email);
}

// Compile error: Property 'email' is missing
sendEmail({ id: 1, name: "Steve" });
```

### Better Developer Experience

Modern editors use TypeScript for:
- Autocomplete that actually works
- Inline documentation
- Refactoring tools
- Jump to definition
- Find all references

Even in JavaScript files, editors use TypeScript under the hood.

### Self-Documenting Code

Types serve as documentation that's always up-to-date:

```typescript
// The function signature tells you everything
function createUser(
  name: string,
  email: string,
  options?: { sendWelcomeEmail?: boolean; role?: 'user' | 'admin' }
): Promise<User>
```

### Safer Refactoring

Rename a property, and TypeScript shows every place that needs updating. No more find-and-replace hoping you caught everything.

---

## Basic Types

### Primitives

```typescript
// String
let name: string = "Steve";

// Number (all numbers - no int/float distinction)
let age: number = 30;
let price: number = 19.99;

// Boolean
let isActive: boolean = true;

// Null and Undefined
let nothing: null = null;
let notDefined: undefined = undefined;

// Symbol
let sym: symbol = Symbol("unique");

// BigInt
let big: bigint = 100n;
```

### Type Inference

TypeScript infers types when you initialize variables:

```typescript
// Type is inferred - no annotation needed
let name = "Steve";        // string
let age = 30;              // number
let active = true;         // boolean
let items = [1, 2, 3];     // number[]

// Only annotate when necessary
let name: string;          // Declared without initialization
name = "Steve";
```

**Rule of thumb:** Don't annotate what TypeScript can infer. Add annotations for function parameters, return types, and uninitialized variables.

### Arrays

```typescript
// Two equivalent syntaxes
let numbers: number[] = [1, 2, 3];
let strings: Array<string> = ["a", "b", "c"];

// Array of objects
let users: { id: number; name: string }[] = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];

// Mixed types (usually avoid)
let mixed: (string | number)[] = [1, "two", 3];
```

### Tuples

Fixed-length arrays with specific types at each position:

```typescript
// Tuple: exactly two elements
let point: [number, number] = [10, 20];

// Named tuples (more readable)
let user: [id: number, name: string] = [1, "Steve"];

// Destructuring
const [x, y] = point;
```

### Objects

```typescript
// Inline object type
let user: { id: number; name: string; email?: string } = {
  id: 1,
  name: "Steve"
  // email is optional
};

// Optional properties with ?
user.email = "steve@test.com";

// Readonly properties
let config: { readonly apiKey: string } = {
  apiKey: "secret"
};
config.apiKey = "new"; // Error: Cannot assign to 'apiKey' because it is a read-only property
```

### Any, Unknown, Never

```typescript
// any - Disables type checking (avoid when possible)
let anything: any = 42;
anything = "string";
anything.nonExistentMethod(); // No error, but crashes at runtime

// unknown - Type-safe alternative to any
let value: unknown = 42;
value = "string";
// Must narrow type before using
if (typeof value === "string") {
  console.log(value.toUpperCase()); // OK after type check
}

// never - Represents values that never occur
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}
```

---

## Functions

### Function Types

```typescript
// Parameter and return types
function add(a: number, b: number): number {
  return a + b;
}

// Arrow function
const multiply = (a: number, b: number): number => a * b;

// Return type is often inferred
const divide = (a: number, b: number) => a / b; // Returns number

// Void - function doesn't return anything
function log(message: string): void {
  console.log(message);
}

// Function with no explicit return returns undefined
function noReturn(): undefined {
  return undefined;
}
```

### Optional and Default Parameters

```typescript
// Optional parameter (must come after required params)
function greet(name: string, greeting?: string): string {
  return `${greeting || "Hello"}, ${name}!`;
}

greet("Steve");           // "Hello, Steve!"
greet("Steve", "Hi");     // "Hi, Steve!"

// Default parameter
function greet2(name: string, greeting: string = "Hello"): string {
  return `${greeting}, ${name}!`;
}
```

### Rest Parameters

```typescript
function sum(...numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

sum(1, 2, 3, 4); // 10
```

### Function Overloads

Multiple signatures for the same function:

```typescript
// Overload signatures
function parse(input: string): string[];
function parse(input: number): number[];
function parse(input: string | number): string[] | number[] {
  // Implementation
  if (typeof input === "string") {
    return input.split(",");
  }
  return [input];
}

const strings = parse("a,b,c"); // string[]
const numbers = parse(42);       // number[]
```

---

## Interfaces and Type Aliases

### Interfaces

Define the shape of objects:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Using the interface
const user: User = {
  id: 1,
  name: "Steve",
  email: "steve@test.com",
  createdAt: new Date()
};

// Function with interface parameter
function createUser(data: User): User {
  return { ...data, id: generateId() };
}
```

### Optional and Readonly Properties

```typescript
interface User {
  readonly id: number;        // Can't be changed after creation
  name: string;
  email?: string;             // Optional
  readonly createdAt: Date;
}

const user: User = { id: 1, name: "Steve", createdAt: new Date() };
user.name = "Steve D";        // OK
user.id = 2;                  // Error: Cannot assign to 'id'
```

### Extending Interfaces

```typescript
interface Person {
  name: string;
  age: number;
}

interface Employee extends Person {
  employeeId: number;
  department: string;
}

const employee: Employee = {
  name: "Steve",
  age: 30,
  employeeId: 12345,
  department: "Engineering"
};

// Extend multiple interfaces
interface Manager extends Employee, HasReports {
  budget: number;
}
```

### Type Aliases

Alternative to interfaces, with some differences:

```typescript
// Object type
type User = {
  id: number;
  name: string;
};

// Union type (can't do this with interfaces)
type ID = number | string;

// Literal type
type Status = "pending" | "approved" | "rejected";

// Function type
type Callback = (data: string) => void;

// Tuple type
type Point = [number, number];
```

### Interface vs Type

```typescript
// Interfaces can be extended with declaration merging
interface User {
  name: string;
}
interface User {
  email: string;
}
// User now has both name and email

// Types can't be merged, but can use intersections
type Person = { name: string };
type Employee = Person & { employeeId: number };

// Interfaces are better for:
// - Object shapes that might be extended
// - Public APIs (declaration merging)

// Types are better for:
// - Unions, tuples, primitives
// - Complex type manipulations
// - When you don't want merging
```

---

## Union and Intersection Types

### Union Types

A value can be one of several types:

```typescript
// Simple union
type ID = number | string;

let userId: ID = 123;
userId = "abc123";

// Literal unions (like enums but simpler)
type Status = "pending" | "approved" | "rejected";

function setStatus(status: Status) {
  // Only these three values are allowed
}

setStatus("pending");    // OK
setStatus("other");      // Error

// Union with type narrowing
function format(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value.toFixed(2);
}
```

### Discriminated Unions

Powerful pattern for handling different cases:

```typescript
// Each type has a "discriminant" property
type Success = { status: "success"; data: string };
type Error = { status: "error"; error: string };
type Loading = { status: "loading" };

type State = Success | Error | Loading;

function handleState(state: State) {
  switch (state.status) {
    case "success":
      console.log(state.data);    // TypeScript knows data exists
      break;
    case "error":
      console.log(state.error);   // TypeScript knows error exists
      break;
    case "loading":
      console.log("Loading...");
      break;
  }
}
```

### Intersection Types

Combine multiple types:

```typescript
type HasName = { name: string };
type HasAge = { age: number };

type Person = HasName & HasAge;

const person: Person = {
  name: "Steve",
  age: 30
};

// Useful for mixins
type Timestamped = { createdAt: Date; updatedAt: Date };
type SoftDeletable = { deletedAt?: Date };

type User = HasName & HasAge & Timestamped & SoftDeletable;
```

---

## Generics

Generics let you write reusable code that works with multiple types:

### Basic Generics

```typescript
// Without generics - loses type information
function first(arr: any[]): any {
  return arr[0];
}

// With generics - preserves type
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const num = first([1, 2, 3]);        // number
const str = first(["a", "b", "c"]);  // string
```

### Generic Interfaces

```typescript
interface Response<T> {
  data: T;
  status: number;
  message: string;
}

interface User {
  id: number;
  name: string;
}

const response: Response<User> = {
  data: { id: 1, name: "Steve" },
  status: 200,
  message: "OK"
};

// Generic with default
interface Response<T = unknown> {
  data: T;
}
```

### Generic Constraints

Limit what types can be used:

```typescript
// T must have a length property
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length > b.length ? a : b;
}

longest("hello", "hi");     // OK - strings have length
longest([1, 2], [1, 2, 3]); // OK - arrays have length
longest(1, 2);               // Error - numbers don't have length

// T must be a key of the object
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Steve", age: 30 };
getProperty(user, "name");  // string
getProperty(user, "age");   // number
getProperty(user, "email"); // Error: "email" is not a key of user
```

### Common Generic Patterns

```typescript
// Array methods are generic
const numbers: number[] = [1, 2, 3];
const doubled = numbers.map((n) => n * 2); // number[]

// Promise is generic
async function fetchUser(): Promise<User> {
  const response = await fetch("/api/user");
  return response.json();
}

// Record - object with specific key and value types
type UserRoles = Record<string, "admin" | "user">;
const roles: UserRoles = {
  steve: "admin",
  bob: "user"
};

// Partial - all properties optional
type PartialUser = Partial<User>;

// Required - all properties required
type RequiredUser = Required<User>;

// Pick - select specific properties
type UserPreview = Pick<User, "id" | "name">;

// Omit - exclude specific properties
type UserWithoutEmail = Omit<User, "email">;
```

---

## Type Narrowing

TypeScript tracks how types change through control flow:

### typeof Guards

```typescript
function process(value: string | number) {
  if (typeof value === "string") {
    // value is string here
    return value.toUpperCase();
  }
  // value is number here
  return value.toFixed(2);
}
```

### instanceof Guards

```typescript
class Dog {
  bark() { console.log("Woof!"); }
}

class Cat {
  meow() { console.log("Meow!"); }
}

function speak(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    animal.bark();
  } else {
    animal.meow();
  }
}
```

### in Operator

```typescript
interface Fish {
  swim(): void;
}

interface Bird {
  fly(): void;
}

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim();
  } else {
    animal.fly();
  }
}
```

### Type Predicates

Custom type guards:

```typescript
interface User {
  type: "user";
  name: string;
}

interface Admin {
  type: "admin";
  name: string;
  permissions: string[];
}

// Type predicate: "user is Admin"
function isAdmin(user: User | Admin): user is Admin {
  return user.type === "admin";
}

function showPermissions(user: User | Admin) {
  if (isAdmin(user)) {
    // TypeScript knows user is Admin
    console.log(user.permissions);
  }
}
```

### Assertion Functions

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error("Not a string!");
  }
}

function process(value: unknown) {
  assertIsString(value);
  // value is string after assertion
  console.log(value.toUpperCase());
}
```

---

## React with TypeScript

### Component Props

```typescript
// Props interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

// Function component
function Button({ label, onClick, variant = "primary", disabled }: ButtonProps) {
  return (
    <button 
      className={variant} 
      onClick={onClick} 
      disabled={disabled}
    >
      {label}
    </button>
  );
}

// With children
interface CardProps {
  title: string;
  children: React.ReactNode;
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### Hooks with TypeScript

```typescript
// useState - type is inferred
const [count, setCount] = useState(0);

// useState - explicit type when initial value is null
const [user, setUser] = useState<User | null>(null);

// useRef
const inputRef = useRef<HTMLInputElement>(null);

// useEffect - no special typing needed
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);

// Custom hook with types
function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const [stored, setStored] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initial;
  });

  const setValue = (value: T) => {
    setStored(value);
    localStorage.setItem(key, JSON.stringify(value));
  };

  return [stored, setValue];
}
```

### Event Handlers

```typescript
// Form events
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
}

// Input change
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  console.log(e.target.value);
}

// Button click
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  console.log("clicked");
}

// Keyboard events
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") {
    submit();
  }
}
```

---

## Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Key Options

| Option | Purpose |
|--------|---------|
| `strict` | Enable all strict type-checking options |
| `noImplicitAny` | Error on expressions with implied `any` |
| `strictNullChecks` | `null` and `undefined` have distinct types |
| `noUnusedLocals` | Error on unused local variables |
| `noUnusedParameters` | Error on unused parameters |

**Start with `strict: true`** and disable specific checks if needed rather than enabling them one by one.

---

## Interview Questions

**Q: What is TypeScript and why use it?**

A: TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing, interfaces, and other features. Benefits include: catching errors at compile time instead of runtime, better IDE support (autocomplete, refactoring), self-documenting code through types, and safer refactoring. It's especially valuable for large codebases and team collaboration.

**Q: What's the difference between `interface` and `type`?**

A: Both define object shapes, but with differences. Interfaces support declaration merging (multiple declarations combine), extending with `extends`, and are generally preferred for object types. Type aliases support unions, tuples, and primitives, use `&` for intersection, and can't be merged. Use interfaces for object shapes that might be extended, types for unions and complex type operations.

**Q: Explain union and intersection types.**

A: Union (`|`) means a value can be one of several types: `string | number` accepts either. Intersection (`&`) combines types: `A & B` has all properties of both A and B. Unions are for "this OR that", intersections are for "this AND that". Discriminated unions use a common property (like `type: "success"`) to help TypeScript narrow the type.

**Q: What are generics and when would you use them?**

A: Generics let you write reusable code that works with multiple types while preserving type information. Use them for functions/classes that should work with different types without losing type safety. Example: `function first<T>(arr: T[]): T` returns the same type it receives. Common uses: data structures, API responses, utility functions. Use constraints (`extends`) to limit allowed types.

**Q: How does type narrowing work?**

A: TypeScript tracks types through control flow. After a type guard (`typeof`, `instanceof`, `in`, truthiness checks, or custom type predicates), TypeScript narrows the type. Example: after `if (typeof x === "string")`, x is known to be string in that branch. Custom type predicates use the `is` keyword: `function isAdmin(u): u is Admin`.

**Q: What's the difference between `any` and `unknown`?**

A: Both can hold any value, but `any` disables type checking entirely while `unknown` requires type narrowing before use. With `any`, you can access any property or call any method (no error, might crash at runtime). With `unknown`, you must check the type first. Always prefer `unknown` for values of uncertain type—it's type-safe.

**Q: How do you type React components?**

A: Define a props interface, then use it in the function signature. For children, use `React.ReactNode`. For events, use specific types like `React.MouseEvent<HTMLButtonElement>` or `React.ChangeEvent<HTMLInputElement>`. For hooks: `useState` infers types but can be explicit with `useState<Type>`, `useRef` needs element type like `useRef<HTMLInputElement>(null)`.

---

## Practice Project

Convert a JavaScript React project to TypeScript:

**Requirements:**
1. Set up tsconfig.json with strict mode
2. Type all component props
3. Create interfaces for data models (User, Post, etc.)
4. Type API response functions
5. Type event handlers
6. Type custom hooks
7. Use discriminated unions for state (loading, success, error)

---

## Resources

- https://www.typescriptlang.org/docs/ (Official documentation)
- https://www.totaltypescript.com/ (Matt Pocock's tutorials)
- https://react-typescript-cheatsheet.netlify.app/ (React TypeScript patterns)
- https://github.com/type-challenges/type-challenges (Practice type challenges)
