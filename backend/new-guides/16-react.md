# React - Interview Ready Guide

**1. Fundamentals** - What It Is, Core Concepts (JSX, Components, Props, State, Rendering)

**2. Hooks** - useState, useEffect, useContext, useRef, useMemo, useCallback, Custom Hooks

**3. Forms** - Controlled Components, Validation, Form Libraries

**4. Component Patterns** - Composition, Render Props, Higher-Order Components

**5. Performance** - React.memo, useMemo, useCallback, Code Splitting, Lazy Loading

**6. State Management** - Context API, External Libraries, When to Use What

**7. Interview Prep** - Common Questions, Practice Project

---

## What It Is

React is a JavaScript library for building user interfaces, created by Facebook in 2013. It introduced a component-based architecture and a virtual DOM that revolutionized frontend development.

React's core idea is simple: UI is a function of state. Given the same state, a component always renders the same output. When state changes, React efficiently updates only what needs to change.

```jsx
function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```

This declarative approach—describing what the UI should look like rather than how to manipulate it—makes code more predictable and easier to debug.

---

## Core Concepts

### JSX

JSX is a syntax extension that looks like HTML but compiles to JavaScript function calls:

```jsx
// JSX
const element = <h1 className="title">Hello, World!</h1>;

// Compiles to
const element = React.createElement('h1', { className: 'title' }, 'Hello, World!');
```

**JSX Rules:**
- Return single root element (or use Fragment)
- Close all tags (`<img />`, `<br />`)
- Use `className` instead of `class`
- Use `htmlFor` instead of `for`
- CamelCase for attributes (`onClick`, `onChange`)
- Expressions in curly braces `{expression}`

```jsx
function Profile({ user }) {
  return (
    <>
      <h1>{user.name}</h1>
      <img 
        src={user.avatar} 
        alt={`${user.name}'s avatar`}
        className="avatar"
      />
      {user.bio && <p>{user.bio}</p>}
      <ul>
        {user.skills.map(skill => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </>
  );
}
```

### Components

Components are reusable pieces of UI. Modern React uses function components:

```jsx
// Function component
function Welcome({ name }) {
  return <h1>Hello, {name}!</h1>;
}

// Arrow function component
const Welcome = ({ name }) => <h1>Hello, {name}!</h1>;

// Usage
<Welcome name="Steve" />
```

### Props

Props are read-only inputs to components:

```jsx
// Passing props
<UserCard 
  name="Steve" 
  age={30} 
  isAdmin={true}
  onClick={handleClick}
  style={{ color: 'blue' }}
/>

// Receiving props
function UserCard({ name, age, isAdmin, onClick, style }) {
  return (
    <div style={style} onClick={onClick}>
      <h2>{name}</h2>
      <p>Age: {age}</p>
      {isAdmin && <span>Admin</span>}
    </div>
  );
}

// Default props
function Button({ variant = 'primary', children }) {
  return <button className={variant}>{children}</button>;
}

// Children prop
function Card({ children, title }) {
  return (
    <div className="card">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

<Card title="Welcome">
  <p>This is the card content.</p>
</Card>
```

### Conditional Rendering

```jsx
function Greeting({ isLoggedIn }) {
  // if/else
  if (isLoggedIn) {
    return <UserDashboard />;
  }
  return <LoginForm />;
}

function Content({ status }) {
  // Ternary
  return (
    <div>
      {status === 'loading' ? <Spinner /> : <Data />}
    </div>
  );
}

function Notification({ message }) {
  // Logical AND (short-circuit)
  return (
    <div>
      {message && <Alert>{message}</Alert>}
    </div>
  );
}
```

### Lists and Keys

```jsx
function TodoList({ todos }) {
  return (
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>
          {todo.text}
        </li>
      ))}
    </ul>
  );
}

// Keys must be:
// - Unique among siblings
// - Stable (don't use index for dynamic lists)
// - Not generated during render
```

---

## Hooks

Hooks let you use state and other React features in function components.

### useState

```jsx
import { useState } from 'react';

function Counter() {
  // Basic state
  const [count, setCount] = useState(0);
  
  // Object state
  const [user, setUser] = useState({ name: '', email: '' });
  
  // Array state
  const [items, setItems] = useState([]);
  
  // Update state
  const increment = () => setCount(count + 1);
  
  // Functional update (when new state depends on previous)
  const incrementSafe = () => setCount(prev => prev + 1);
  
  // Update object (spread to preserve other properties)
  const updateName = (name) => setUser(prev => ({ ...prev, name }));
  
  // Update array
  const addItem = (item) => setItems(prev => [...prev, item]);
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
    </div>
  );
}
```

### useEffect

Handle side effects: data fetching, subscriptions, DOM manipulation.

```jsx
import { useEffect, useState } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Runs after every render
  useEffect(() => {
    console.log('Component rendered');
  });
  
  // Runs once on mount (empty dependency array)
  useEffect(() => {
    console.log('Component mounted');
  }, []);
  
  // Runs when userId changes
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      setUser(data);
      setLoading(false);
    }
    
    fetchUser();
  }, [userId]);
  
  // Cleanup function (runs before effect re-runs or unmount)
  useEffect(() => {
    const subscription = subscribeToUser(userId);
    
    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);
  
  if (loading) return <Spinner />;
  return <div>{user?.name}</div>;
}
```

### useRef

Access DOM elements or persist values without triggering re-renders:

```jsx
import { useRef, useEffect } from 'react';

function TextInput() {
  const inputRef = useRef(null);
  
  // Focus input on mount
  useEffect(() => {
    inputRef.current.focus();
  }, []);
  
  return <input ref={inputRef} />;
}

function Timer() {
  // Persist value without re-render
  const intervalRef = useRef(null);
  const countRef = useRef(0);
  
  const start = () => {
    intervalRef.current = setInterval(() => {
      countRef.current += 1;
      console.log(countRef.current);
    }, 1000);
  };
  
  const stop = () => {
    clearInterval(intervalRef.current);
  };
  
  return (
    <>
      <button onClick={start}>Start</button>
      <button onClick={stop}>Stop</button>
    </>
  );
}
```

### useMemo and useCallback

Optimize performance by memoizing values and functions:

```jsx
import { useMemo, useCallback, useState } from 'react';

function ExpensiveComponent({ items, filter }) {
  // Memoize expensive computation
  const filteredItems = useMemo(() => {
    console.log('Filtering items...');
    return items.filter(item => item.name.includes(filter));
  }, [items, filter]); // Only recompute when items or filter change
  
  return <List items={filteredItems} />;
}

function ParentComponent() {
  const [count, setCount] = useState(0);
  
  // Memoize callback to prevent child re-renders
  const handleClick = useCallback(() => {
    console.log('Clicked!');
  }, []); // Empty deps = same function reference always
  
  const handleItemClick = useCallback((id) => {
    console.log('Item clicked:', id);
  }, []);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(c => c + 1)}>+</button>
      <ChildComponent onClick={handleClick} />
    </div>
  );
}
```

### useContext

Share data without prop drilling:

```jsx
import { createContext, useContext, useState } from 'react';

// Create context
const ThemeContext = createContext(null);

// Provider component
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  const toggle = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for cleaner usage
function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

// Using the context
function ThemedButton() {
  const { theme, toggle } = useTheme();
  
  return (
    <button 
      onClick={toggle}
      style={{ background: theme === 'light' ? '#fff' : '#333' }}
    >
      Toggle Theme
    </button>
  );
}

// App setup
function App() {
  return (
    <ThemeProvider>
      <ThemedButton />
    </ThemeProvider>
  );
}
```

### useReducer

Complex state logic:

```jsx
import { useReducer } from 'react';

const initialState = { count: 0, step: 1 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + state.step };
    case 'decrement':
      return { ...state, count: state.count - state.step };
    case 'setStep':
      return { ...state, step: action.payload };
    case 'reset':
      return initialState;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <p>Step: {state.step}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>Reset</button>
      <input 
        type="number" 
        value={state.step}
        onChange={e => dispatch({ type: 'setStep', payload: Number(e.target.value) })}
      />
    </div>
  );
}
```

### Custom Hooks

Extract reusable logic:

```jsx
// useLocalStorage
function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });
  
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
}

// useFetch
function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let cancelled = false;
    
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch');
        const json = await response.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    
    fetchData();
    
    return () => { cancelled = true; };
  }, [url]);
  
  return { data, loading, error };
}

// useDebounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage
function SearchComponent() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const { data, loading } = useFetch(`/api/search?q=${debouncedQuery}`);
  
  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {loading ? <Spinner /> : <Results data={data} />}
    </div>
  );
}
```

---

## Forms

### Controlled Components

```jsx
function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit form
    console.log('Submitting:', formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email"
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>
      <div>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Password"
        />
        {errors.password && <span className="error">{errors.password}</span>}
      </div>
      <button type="submit">Login</button>
    </form>
  );
}
```

### With React Hook Form

```jsx
import { useForm } from 'react-hook-form';

function LoginForm() {
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting } 
  } = useForm();
  
  const onSubmit = async (data) => {
    await submitToAPI(data);
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('email', { 
          required: 'Email is required',
          pattern: {
            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
            message: 'Invalid email'
          }
        })}
        placeholder="Email"
      />
      {errors.email && <span>{errors.email.message}</span>}
      
      <input
        type="password"
        {...register('password', { 
          required: 'Password is required',
          minLength: { value: 8, message: 'Min 8 characters' }
        })}
        placeholder="Password"
      />
      {errors.password && <span>{errors.password.message}</span>}
      
      <button disabled={isSubmitting}>
        {isSubmitting ? 'Loading...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Component Patterns

### Composition over Inheritance

```jsx
// Composition with children
function Card({ children }) {
  return <div className="card">{children}</div>;
}

function CardHeader({ children }) {
  return <div className="card-header">{children}</div>;
}

function CardBody({ children }) {
  return <div className="card-body">{children}</div>;
}

// Usage
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>
```

### Render Props

```jsx
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);
  
  return render(position);
}

// Usage
<MouseTracker
  render={({ x, y }) => (
    <div>Mouse: {x}, {y}</div>
  )}
/>
```

### Higher-Order Components (HOC)

```jsx
function withAuth(WrappedComponent) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();
    
    if (loading) return <Spinner />;
    if (!user) return <Redirect to="/login" />;
    
    return <WrappedComponent {...props} user={user} />;
  };
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);
```

---

## Performance Optimization

### React.memo

Prevent unnecessary re-renders:

```jsx
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }) {
  // Only re-renders if data changes
  return <div>{/* expensive render */}</div>;
});

// Custom comparison
const Component = React.memo(
  function Component({ user }) {
    return <div>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### Code Splitting

```jsx
import { lazy, Suspense } from 'react';

// Lazy load components
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```

### Virtual Lists

For long lists, only render visible items:

```jsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## State Management

### When to Use What

- **useState**: Component-local state
- **useReducer**: Complex local state with multiple actions
- **useContext**: Share state across component tree (theme, auth)
- **Zustand/Jotai**: Simple global state
- **Redux Toolkit**: Complex global state with middleware needs
- **TanStack Query**: Server state (caching, sync)

### Zustand (Simple Global State)

```jsx
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  reset: () => set({ count: 0 }),
}));

function Counter() {
  const { count, increment, reset } = useStore();
  
  return (
    <div>
      <p>{count}</p>
      <button onClick={increment}>+</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### TanStack Query (Server State)

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function Users() {
  const queryClient = useQueryClient();
  
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  });
  
  const mutation = useMutation({
    mutationFn: (newUser) => fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(newUser),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
  
  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  
  return (
    <div>
      {users.map(user => <UserCard key={user.id} user={user} />)}
      <button onClick={() => mutation.mutate({ name: 'New User' })}>
        Add User
      </button>
    </div>
  );
}
```

---

## Interview Questions

**Q: What is the Virtual DOM and how does React use it?**

A: The Virtual DOM is a lightweight JavaScript representation of the real DOM. When state changes, React creates a new virtual DOM tree, diffs it with the previous one (reconciliation), and updates only the changed parts of the real DOM. This batching and selective updating is more efficient than direct DOM manipulation.

**Q: Explain the useEffect hook and its cleanup function.**

A: useEffect handles side effects (data fetching, subscriptions, DOM manipulation) after render. It takes a function and optional dependency array. Empty deps runs once on mount; deps array runs when deps change. The cleanup function returned from effect runs before the next effect and on unmount—use it to cancel subscriptions, timers, or pending requests.

**Q: What's the difference between useMemo and useCallback?**

A: Both memoize to prevent unnecessary recalculations. `useMemo` memoizes a computed value: `useMemo(() => expensiveCalc(a, b), [a, b])`. `useCallback` memoizes a function reference: `useCallback(() => doSomething(a), [a])`. Use useMemo for expensive computations, useCallback when passing callbacks to optimized child components that rely on reference equality.

**Q: How do keys work in React lists and why are they important?**

A: Keys help React identify which items changed, were added, or removed. They must be stable, unique among siblings, and not generated during render (like indexes for dynamic lists). Without proper keys, React may re-render more than necessary or produce bugs when list order changes.

**Q: Explain useState vs useReducer.**

A: useState is for simple state (single values, simple updates). useReducer is for complex state logic with multiple sub-values or when next state depends on previous. useReducer takes a reducer function and initial state, returns state and dispatch. Better for complex state machines and when multiple components need to trigger the same state transitions.

**Q: How does Context work and when should you use it?**

A: Context provides a way to pass data through the component tree without prop drilling. Create context with createContext, provide value with Provider, consume with useContext. Use for truly global data (theme, auth, locale). Avoid for frequently changing data or deep updates—can cause unnecessary re-renders. Consider state management libraries for complex cases.

**Q: What are React's rendering optimizations?**

A: (1) React.memo: prevents re-render if props unchanged. (2) useMemo: memoize expensive computations. (3) useCallback: stable function references. (4) Code splitting with lazy/Suspense: load components on demand. (5) Virtualization: render only visible list items. (6) Key prop: efficient list reconciliation.

---

## Practice Project

Build a task management app:

**Requirements:**
1. Task CRUD with TanStack Query
2. Global state for UI (Zustand)
3. Form handling with React Hook Form
4. Optimistic updates
5. Drag-and-drop task reordering
6. Virtualized list for many tasks
7. Keyboard shortcuts
8. Dark mode with Context

---

## Resources

- https://react.dev/ (Official documentation)
- https://tanstack.com/query (TanStack Query)
- https://zustand-demo.pmnd.rs/ (Zustand)
- https://react-hook-form.com/ (React Hook Form)
