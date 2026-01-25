# React & TypeScript Deep-Dive Interview Guide

**Purpose:** Technical interview preparation for Circuit, Emporia Research, and Autonomize AI
**Last Updated:** January 20, 2026

---

## Table of Contents

1. [React Core Concepts](#react-core-concepts)
2. [React Hooks Deep-Dive](#react-hooks-deep-dive)
3. [State Management Patterns](#state-management-patterns)
4. [TypeScript Advanced Patterns](#typescript-advanced-patterns)
5. [Performance Optimization](#performance-optimization)
6. [Testing Strategies](#testing-strategies)
7. [Architecture Patterns](#architecture-patterns)
8. [Common Interview Questions](#common-interview-questions)

---

## React Core Concepts

### Component Lifecycle (Functional Components)

```
Mount → Render → Commit → (Update cycle) → Unmount

Mount:
  1. Component function called
  2. useState initializers run (once)
  3. JSX returned
  4. DOM updated
  5. useLayoutEffect runs (sync)
  6. Browser paints
  7. useEffect runs (async)

Update:
  1. State/props change triggers re-render
  2. Component function called again
  3. React diffs virtual DOM
  4. DOM updated (only changes)
  5. useLayoutEffect cleanup → effect
  6. useEffect cleanup → effect

Unmount:
  1. useLayoutEffect cleanup
  2. useEffect cleanup
  3. Component removed from DOM
```

### Reconciliation Algorithm

**Key Points:**
- React uses a heuristic O(n) algorithm (not O(n³))
- Two elements of different types produce different trees
- Keys help React identify which items changed
- React batches state updates for performance

**When React re-renders:**
1. State changes (`useState`, `useReducer`)
2. Props change (parent re-renders)
3. Context value changes
4. `forceUpdate()` called (class components)

### Virtual DOM

```
Component Tree → Virtual DOM → Diffing → Minimal DOM Updates

Benefits:
- Batched updates
- Cross-platform (React Native)
- Declarative programming model
```

---

## React Hooks Deep-Dive

### useState

```tsx
// Basic usage
const [count, setCount] = useState(0);

// Lazy initialization (expensive computation)
const [data, setData] = useState(() => expensiveComputation());

// Functional updates (when new state depends on previous)
setCount(prev => prev + 1);  // ✅ Always use for derived state
setCount(count + 1);          // ❌ May cause stale closure issues

// Object state - always spread
setUser(prev => ({ ...prev, name: 'New Name' }));
```

**Common Pitfalls:**
- State updates are asynchronous and batched
- Passing same reference doesn't trigger re-render
- Initial value only used on first render

### useEffect

```tsx
// Run on every render
useEffect(() => {
  console.log('Every render');
});

// Run once on mount
useEffect(() => {
  console.log('Mount only');
  return () => console.log('Unmount cleanup');
}, []);

// Run when dependencies change
useEffect(() => {
  fetchUser(userId);
}, [userId]);

// Cleanup pattern
useEffect(() => {
  const subscription = subscribe(id);
  return () => subscription.unsubscribe();
}, [id]);
```

**Dependency Array Rules:**
- Include ALL values from component scope used inside effect
- Functions should be wrapped in useCallback or defined inside effect
- Objects/arrays need useMemo or should be primitives

### useCallback & useMemo

```tsx
// useCallback - memoize functions
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// useMemo - memoize values
const expensiveValue = useMemo(() => {
  return computeExpensive(a, b);
}, [a, b]);

// When to use:
// 1. Passing callbacks to optimized child components (React.memo)
// 2. Dependencies in other hooks
// 3. Expensive calculations
```

**Don't overuse:** Memoization has overhead. Only use when:
- Passing to memoized children
- Used in dependency arrays
- Actually expensive computation

### useRef

```tsx
// DOM reference
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus();

// Mutable value (doesn't trigger re-render)
const renderCount = useRef(0);
renderCount.current += 1;

// Previous value pattern
const prevValue = useRef(value);
useEffect(() => {
  prevValue.current = value;
}, [value]);
```

### useReducer

```tsx
type State = { count: number; error: string | null };
type Action =
  | { type: 'increment' }
  | { type: 'decrement' }
  | { type: 'set'; payload: number }
  | { type: 'error'; payload: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'increment':
      return { ...state, count: state.count + 1 };
    case 'decrement':
      return { ...state, count: state.count - 1 };
    case 'set':
      return { ...state, count: action.payload };
    case 'error':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

const [state, dispatch] = useReducer(reducer, { count: 0, error: null });
```

**When to use useReducer over useState:**
- Complex state logic
- Multiple sub-values
- Next state depends on previous
- Want to pass dispatch down (stable reference)

### Custom Hooks

```tsx
// Data fetching hook
function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    fetch(url, { signal: controller.signal })
      .then(res => res.json())
      .then(setData)
      .catch(err => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}

// Local storage hook
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## State Management Patterns

### React Query (TanStack Query) - Server State

**Circuit uses this for server state.**

```tsx
// Basic query
const { data, isLoading, error } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
});

// Query with options
const { data } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  staleTime: 5 * 60 * 1000,      // 5 minutes
  cacheTime: 30 * 60 * 1000,     // 30 minutes
  refetchOnWindowFocus: false,
  retry: 3,
});

// Mutations
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});

// Optimistic updates
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newUser) => {
    await queryClient.cancelQueries({ queryKey: ['users', newUser.id] });
    const previous = queryClient.getQueryData(['users', newUser.id]);
    queryClient.setQueryData(['users', newUser.id], newUser);
    return { previous };
  },
  onError: (err, newUser, context) => {
    queryClient.setQueryData(['users', newUser.id], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

**Key Concepts:**
- `queryKey`: Unique identifier for caching
- `staleTime`: How long data is considered fresh
- `cacheTime`: How long inactive data stays in cache
- Automatic background refetching
- Request deduplication

### Zustand - Client State

**Circuit uses this for client state.**

```tsx
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Basic store
interface BearStore {
  bears: number;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
}

const useBearStore = create<BearStore>((set) => ({
  bears: 0,
  increase: () => set((state) => ({ bears: state.bears + 1 })),
  decrease: () => set((state) => ({ bears: state.bears - 1 })),
  reset: () => set({ bears: 0 }),
}));

// Usage
function Component() {
  const bears = useBearStore((state) => state.bears);
  const increase = useBearStore((state) => state.increase);
  return <button onClick={increase}>{bears}</button>;
}

// With persistence
const useStore = create(
  persist<State>(
    (set) => ({
      // ... state and actions
    }),
    { name: 'app-storage' }
  )
);

// Async actions
const useStore = create<Store>((set, get) => ({
  users: [],
  fetchUsers: async () => {
    const response = await fetch('/api/users');
    const users = await response.json();
    set({ users });
  },
}));
```

**Why Zustand over Redux:**
- Less boilerplate
- No providers needed
- Simple API
- TypeScript-friendly
- Works outside React components

### Context + useReducer Pattern

```tsx
// Context for complex state
interface AppState {
  user: User | null;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_NOTIFICATION'; payload: Notification };

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'light' ? 'dark' : 'light' };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [...state.notifications, action.payload] };
    default:
      return state;
  }
}

function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
```

---

## TypeScript Advanced Patterns

### Generics

```tsx
// Generic function
function identity<T>(arg: T): T {
  return arg;
}

// Generic with constraints
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// Usage
<List<User>
  items={users}
  renderItem={(user) => <span>{user.name}</span>}
  keyExtractor={(user) => user.id}
/>
```

### Utility Types

```tsx
// Partial - all properties optional
type PartialUser = Partial<User>;

// Required - all properties required
type RequiredUser = Required<User>;

// Pick - select specific properties
type UserName = Pick<User, 'firstName' | 'lastName'>;

// Omit - exclude specific properties
type UserWithoutPassword = Omit<User, 'password'>;

// Record - create object type
type UserMap = Record<string, User>;

// ReturnType - extract function return type
type FetchResult = ReturnType<typeof fetchUser>;

// Parameters - extract function parameters
type FetchParams = Parameters<typeof fetchUser>;

// Exclude/Extract - union manipulation
type NonNullString = Exclude<string | null | undefined, null | undefined>;
```

### Discriminated Unions

```tsx
// State machine pattern
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function handleState<T>(state: RequestState<T>) {
  switch (state.status) {
    case 'idle':
      return <div>Ready to fetch</div>;
    case 'loading':
      return <Spinner />;
    case 'success':
      return <Data data={state.data} />;  // TypeScript knows data exists
    case 'error':
      return <Error error={state.error} />;  // TypeScript knows error exists
  }
}
```

### Type Guards

```tsx
// typeof guard
function process(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase();  // TypeScript knows it's string
  }
  return value * 2;  // TypeScript knows it's number
}

// instanceof guard
function handleError(error: Error | string) {
  if (error instanceof Error) {
    return error.message;
  }
  return error;
}

// Custom type guard
interface Cat { meow(): void; }
interface Dog { bark(): void; }

function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal;
}

function makeSound(animal: Cat | Dog) {
  if (isCat(animal)) {
    animal.meow();  // TypeScript knows it's Cat
  } else {
    animal.bark();  // TypeScript knows it's Dog
  }
}
```

### Mapped Types

```tsx
// Make all properties readonly
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

// Make all properties optional
type Partial<T> = {
  [K in keyof T]?: T[K];
};

// Create getters
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number; }
```

---

## Performance Optimization

### React.memo

```tsx
// Memoize component
const ExpensiveComponent = React.memo(function ExpensiveComponent({ data }: Props) {
  return <div>{/* expensive rendering */}</div>;
});

// With custom comparison
const MemoizedComponent = React.memo(
  function Component({ user, onClick }: Props) {
    return <div onClick={onClick}>{user.name}</div>;
  },
  (prevProps, nextProps) => {
    return prevProps.user.id === nextProps.user.id;
  }
);
```

### Code Splitting

```tsx
// Lazy loading components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}

// Route-based splitting (React Router v6)
const Home = React.lazy(() => import('./pages/Home'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

### Virtualization

```tsx
// For long lists, use react-window or react-virtualized
import { FixedSizeList } from 'react-window';

function VirtualList({ items }: { items: Item[] }) {
  return (
    <FixedSizeList
      height={400}
      width={300}
      itemCount={items.length}
      itemSize={35}
    >
      {({ index, style }) => (
        <div style={style}>{items[index].name}</div>
      )}
    </FixedSizeList>
  );
}
```

### React 18 Concurrent Features

```tsx
// useTransition - mark updates as non-urgent
function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);  // Urgent - update input immediately

    startTransition(() => {
      setResults(search(e.target.value));  // Non-urgent - can be interrupted
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results data={results} />}
    </>
  );
}

// useDeferredValue - defer re-rendering
function SearchResults({ query }: { query: string }) {
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => search(deferredQuery), [deferredQuery]);

  return <Results data={results} />;
}
```

---

## Testing Strategies

### React Testing Library

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Basic component test
test('renders greeting', () => {
  render(<Greeting name="World" />);
  expect(screen.getByText('Hello, World!')).toBeInTheDocument();
});

// User interaction
test('increments counter on click', async () => {
  const user = userEvent.setup();
  render(<Counter />);

  await user.click(screen.getByRole('button', { name: /increment/i }));

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});

// Async testing
test('loads and displays user', async () => {
  render(<UserProfile userId="123" />);

  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});

// Form testing
test('submits form with user data', async () => {
  const handleSubmit = jest.fn();
  const user = userEvent.setup();

  render(<UserForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText(/name/i), 'John');
  await user.type(screen.getByLabelText(/email/i), 'john@example.com');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(handleSubmit).toHaveBeenCalledWith({
    name: 'John',
    email: 'john@example.com',
  });
});
```

### Testing Custom Hooks

```tsx
import { renderHook, act } from '@testing-library/react';

test('useCounter increments', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

### Mocking

```tsx
// Mock module
jest.mock('../api', () => ({
  fetchUser: jest.fn(),
}));

// Mock implementation
import { fetchUser } from '../api';
(fetchUser as jest.Mock).mockResolvedValue({ id: '1', name: 'John' });

// Mock component
jest.mock('./HeavyComponent', () => ({
  __esModule: true,
  default: () => <div data-testid="mocked-component">Mocked</div>,
}));
```

---

## Architecture Patterns

### Feature-Based Structure (Recommended)

```
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SignupForm.tsx
│   │   ├── hooks/
│   │   │   └── useAuth.ts
│   │   ├── api/
│   │   │   └── authApi.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── dashboard/
│   └── users/
├── shared/
│   ├── components/
│   │   ├── Button/
│   │   ├── Input/
│   │   └── Modal/
│   ├── hooks/
│   ├── utils/
│   └── types/
├── app/
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx
└── index.tsx
```

### Compound Components Pattern

```tsx
// Flexible, composable API
interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

function Tabs({ children, defaultTab }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="tabs-list">{children}</div>;
};

Tabs.Tab = function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs.Tab must be used within a Tabs provider');
  }
  const { activeTab, setActiveTab } = context;
  return (
    <button
      className={activeTab === id ? 'active' : ''}
      onClick={() => setActiveTab(id)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function TabsPanel({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs.Panel must be used within a Tabs provider');
  }
  const { activeTab } = context;
  return activeTab === id ? <div>{children}</div> : null;
};

// Usage
<Tabs defaultTab="overview">
  <Tabs.List>
    <Tabs.Tab id="overview">Overview</Tabs.Tab>
    <Tabs.Tab id="settings">Settings</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="overview">Overview content</Tabs.Panel>
  <Tabs.Panel id="settings">Settings content</Tabs.Panel>
</Tabs>
```

---

## Common Interview Questions

### Conceptual Questions

1. **What is the Virtual DOM and how does it work?**
   - In-memory representation of real DOM
   - React diffs virtual DOM trees to find minimal changes
   - Batches updates for performance

2. **Explain React's reconciliation algorithm**
   - Compares trees level by level
   - Different element types = different trees
   - Keys help identify moved elements

3. **What are the rules of hooks?**
   - Only call at top level (not in loops/conditions)
   - Only call from React functions
   - Start with "use"

4. **useState vs useReducer - when to use which?**
   - useState: Simple state, few values
   - useReducer: Complex state, multiple sub-values, next state depends on previous

5. **How do you prevent unnecessary re-renders?**
   - React.memo for components
   - useMemo for values
   - useCallback for functions
   - Proper key usage in lists

### Coding Questions

1. **Implement a debounced search input**
2. **Create an infinite scroll component**
3. **Build a form with validation**
4. **Implement a modal with portal**
5. **Create a data table with sorting and filtering**

---

## Your Experience Talking Points

### Walmart Team Productivity Dashboard

> "At Walmart, I built the Team Productivity Dashboard using React and TypeScript. We used a feature-based folder structure with custom hooks for Elasticsearch data fetching. For state management, we used Context with useReducer for global app state. I focused heavily on performance optimization - we were rendering real-time DORA metrics with charts that updated frequently, so I implemented React.memo and useMemo extensively. The dashboard was used by engineering teams across the organization."

### Testing Philosophy

> "I believe in testing user behavior, not implementation details. I use React Testing Library extensively - testing what users see and interact with rather than internal component state. For the Walmart dashboard, we had comprehensive test coverage using RTL and Jest, with integration tests for the data fetching hooks."

### State Management Choice

> "I'm pragmatic about state management. For server state, I prefer React Query or SWR because they handle caching, background refetching, and request deduplication automatically. For client state, I evaluate based on complexity - useState for simple cases, Context + useReducer for moderate complexity, and Zustand for when I need state accessed across many components or outside React."
