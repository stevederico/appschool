# JavaScript to TypeScript

**1. Why TypeScript** - Benefits, Setup, tsconfig

**2. Basic Types** - Primitives, Arrays, Tuples, Enums

**3. Interfaces & Types** - Defining shapes, extending, merging

**4. Functions** - Parameter types, return types, overloads

**5. Generics** - Type parameters, constraints, utility types

**6. Narrowing** - typeof, instanceof, type guards, discriminated unions

**7. React + TypeScript** - Props, state, events, refs

**8. Migration Strategy** - JS→TS step by step, allowJs, strict mode

**9. Utility Types** - Partial, Pick, Omit, Record, ReturnType

**10. Interview Prep** - Common questions, practical patterns

---

## Why TypeScript

TypeScript is JavaScript with static types. The compiler strips all type annotations at build time — the output is plain JavaScript. Zero runtime cost.

**What you gain:**
- Catch bugs at compile time (not in production)
- Autocomplete and refactoring in editors
- Self-documenting function signatures
- Safe refactoring at scale

**Setup:**
```bash
npm install -D typescript
npx tsc --init   # creates tsconfig.json
```

**tsconfig.json (recommended):**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "jsx": "react-jsx",
    "outDir": "./dist"
  },
  "include": ["src"]
}
```

`"strict": true` enables: `strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, and more. Always start with it on.

---

## Basic Types

```typescript
// Primitives — inference usually handles these
let name = "Alice";         // inferred: string
let age: number = 30;       // explicit
let active: boolean = true;

// null and undefined are distinct types under strict mode
let maybe: string | null = null;
let undef: string | undefined;

// Special types
let anything: unknown;   // type-safe: must narrow before use
let noReturn: never;     // for exhaustive checks and functions that throw
const dynamic: any;      // escape hatch — avoid

// Arrays
let ids: number[] = [1, 2, 3];
let tags: Array<string> = ["js", "ts"];

// Tuple — fixed length, specific types at each position
let point: [number, number] = [10, 20];
let entry: [string, number] = ["age", 30];

// Enum
enum Direction { Up, Down, Left, Right }
const move = Direction.Up;  // 0

// Const enum (inlined at compile time — no runtime object)
const enum Status { Active = "ACTIVE", Banned = "BANNED" }
```

---

## Interfaces & Types

```typescript
// Interface — extendable, mergeable
interface User {
  id: number;
  name: string;
  email?: string;         // optional
  readonly createdAt: Date; // can't reassign after creation
}

// Type alias — more flexible, can't be merged
type ID = string | number;
type Point = { x: number; y: number };
type Callback = (err: Error | null, result?: string) => void;

// Extending
interface Admin extends User {
  role: "admin";
  permissions: string[];
}

// Intersection (combine types)
type AdminUser = User & { role: "admin" };

// Interface vs type — practical rule:
// Use interface for objects/classes (supports declaration merging)
// Use type for unions, primitives, computed types
```

---

## Functions

```typescript
// Parameter and return type annotations
function greet(name: string): string {
  return `Hello, ${name}`;
}

// Arrow function
const add = (a: number, b: number): number => a + b;

// Optional and default parameters
function connect(host: string, port = 3000, timeout?: number): void {
  // timeout is number | undefined
}

// Rest parameters
function sum(...nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

// Function overloads
function parse(input: string): number;
function parse(input: number): string;
function parse(input: string | number): string | number {
  return typeof input === "string" ? parseInt(input) : String(input);
}

// void vs never
function log(msg: string): void { console.log(msg); }  // returns undefined
function fail(msg: string): never { throw new Error(msg); }  // never returns
```

---

## Generics

```typescript
// Generic function
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

const n = first([1, 2, 3]);    // T inferred as number
const s = first(["a", "b"]);   // T inferred as string

// Generic constraint
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length;
}

// Generic interface
interface ApiResponse<T> {
  data: T;
  status: number;
  error?: string;
}

// Generic class
class Repository<T extends { id: number }> {
  private items: T[] = [];

  add(item: T): void { this.items.push(item); }
  findById(id: number): T | undefined {
    return this.items.find(i => i.id === id);
  }
}

// keyof — keys of a type as a union
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Alice", age: 30 };
const name = get(user, "name");  // type: string
```

---

## Narrowing

TypeScript narrows types within control flow branches.

```typescript
// typeof guard
function padLeft(value: string | number): string {
  if (typeof value === "string") {
    return value.toUpperCase(); // narrowed: string
  }
  return String(value);         // narrowed: number
}

// instanceof guard
function formatDate(d: Date | string): string {
  if (d instanceof Date) return d.toISOString();
  return d;
}

// Custom type guard (predicate)
interface Cat { meow(): void }
interface Dog { bark(): void }

function isCat(animal: Cat | Dog): animal is Cat {
  return (animal as Cat).meow !== undefined;
}

// Discriminated union — best pattern for complex unions
type Shape =
  | { kind: "circle"; radius: number }
  | { kind: "rect"; width: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case "circle": return Math.PI * s.radius ** 2;
    case "rect":   return s.width * s.height;
    // TypeScript errors here if you miss a case
  }
}

// Exhaustiveness check
function assertNever(x: never): never {
  throw new Error("Unexpected value: " + x);
}
```

---

## React + TypeScript

```typescript
// Component props
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

const Button = ({ label, onClick, variant = "primary", disabled }: ButtonProps) => (
  <button className={variant} onClick={onClick} disabled={disabled}>
    {label}
  </button>
);

// Children
interface CardProps {
  title: string;
  children: React.ReactNode;
}

// useState — type inferred from initial value
const [count, setCount] = useState(0);           // number
const [user, setUser] = useState<User | null>(null); // explicit when null initial

// useRef
const inputRef = useRef<HTMLInputElement>(null);
// inputRef.current is HTMLInputElement | null

// useReducer
type Action =
  | { type: "increment" }
  | { type: "set"; payload: number };

function reducer(state: number, action: Action): number {
  switch (action.type) {
    case "increment": return state + 1;
    case "set":       return action.payload;
  }
}

// Event handlers
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value);
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
};

// forwardRef
const Input = React.forwardRef<HTMLInputElement, { placeholder?: string }>(
  ({ placeholder }, ref) => <input ref={ref} placeholder={placeholder} />
);
```

---

## Utility Types

The most useful built-in utility types:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// Partial — all properties optional
type UserUpdate = Partial<User>;  // { id?: number; name?: string; ... }

// Required — all properties required (opposite of Partial)
type StrictUser = Required<User>;

// Pick — select specific properties
type PublicUser = Pick<User, "id" | "name">;  // { id: number; name: string }

// Omit — exclude specific properties
type SafeUser = Omit<User, "password">;  // { id, name, email }

// Readonly — all properties immutable
type FrozenUser = Readonly<User>;

// Record — map keys to values
type Roles = Record<"admin" | "user" | "guest", string[]>;

// ReturnType — extract return type of function
function fetchUser(): Promise<User> { ... }
type FetchResult = ReturnType<typeof fetchUser>;  // Promise<User>

// Parameters — extract parameter types as tuple
type FetchParams = Parameters<typeof fetch>;  // [input: RequestInfo, init?: RequestInit]

// NonNullable — remove null and undefined
type DefinedString = NonNullable<string | null | undefined>;  // string

// Awaited — unwrap Promise
type User = Awaited<Promise<User>>;
```

---

## Migration Strategy

**Incremental migration (recommended):**

1. **Enable `allowJs: true`** in tsconfig — TypeScript will type-check JS files too
2. **Rename one file at a time** from `.js` → `.ts`
3. **Fix errors in that file** before moving on
4. **Enable `strict: true` last** or per-file with `// @ts-strict`

**File rename order:**
```
utils/ → types/ → hooks/ → components/ → pages/ → index
```
Start with leaf modules (no imports from your own code), work toward the root.

**Common JS→TS friction:**
```typescript
// JS: implicit any from JSON.parse
const data = JSON.parse(text);      // any in JS
const data = JSON.parse(text) as ApiResponse<User>;  // assert type in TS

// JS: dynamic object creation
const obj = {};
obj.foo = "bar";  // TS error: Property 'foo' does not exist
// Fix:
const obj: Record<string, string> = {};

// JS: optional chaining not needed but helps
const city = user?.address?.city ?? "Unknown";

// JS: loose function arguments
function log(data) { ... }   // implicit any
function log(data: unknown) { console.log(data); }  // fix
```

---

## Interview Questions

**Q: What is the difference between `any` and `unknown`?**

A: Both accept any value. `any` disables type checking on that value — you can call methods, access properties, pass it anywhere. `unknown` is type-safe: you must narrow it (typeof, instanceof, type guard) before using it. Always prefer `unknown` for values of uncertain type.

**Q: What is a discriminated union?**

A: A union type where each member has a common literal property (the discriminant) that uniquely identifies it. TypeScript narrows based on that property in switch/if statements. The discriminant is usually `type`, `kind`, or `status`. It enables exhaustive checking — if you add a new variant without handling it, you get a compile error.

**Q: What is the difference between `interface` and `type`?**

A: Both define object shapes. Key differences: interfaces support declaration merging (two `interface Foo {}` blocks merge); types support computed/conditional types, unions, and primitives. Use interface for public API shapes and class contracts; use type for unions, mapped types, and computed aliases. In practice the difference is minor — pick one and be consistent.

**Q: What does `keyof` do?**

A: Produces a union type of all keys of an object type. `keyof { name: string; age: number }` is `"name" | "age"`. Used with generics to build type-safe property accessors.

**Q: What is `as const`?**

A: Tells TypeScript to infer the narrowest literal types for a value. `const x = { a: 1, b: 2 } as const` gives `{ readonly a: 1; readonly b: 2 }` instead of `{ a: number; b: number }`. Essential for defining enums as plain objects and for preserving tuple types.

---

## Practice Project

Convert a JavaScript REST client to TypeScript:

1. Create `types.ts` with interfaces for your API responses
2. Add strict tsconfig
3. Type all `fetch` calls with generics: `async function get<T>(url: string): Promise<T>`
4. Replace all `any` with proper types or `unknown`
5. Add a discriminated union for API error vs success responses
6. Use `Omit` / `Pick` to create safe views of sensitive types

---

## Resources

- https://www.typescriptlang.org/docs/ (Official docs)
- https://www.typescriptlang.org/play (TypeScript Playground)
- https://www.totaltypescript.com (Total TypeScript — free tutorials)
- https://typescript-exercises.github.io (Interactive exercises)
