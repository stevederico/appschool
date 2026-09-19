import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { mkdirSync } from 'fs';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GUIDES_DIR = join(__dirname, '../new-guides');
const REPS_DIR = join(__dirname, '../new-reps');

// Load .env from backend directory
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  }
  console.log('Loaded .env file');
}

const COURSES = [
  {
    slug: 'frontend-engineer',
    title: 'Frontend Engineer',
    description: 'Master modern frontend development with React, TypeScript, and web platform APIs. Interview-ready skills covering component architecture, state management, and browser APIs.',
    difficulty: 'intermediate',
    estimatedHours: 8,
    tags: ['react', 'typescript', 'tailwind', 'websockets', 'pwa', 'frontend', 'javascript'],
    order: 1,
    guides: [
      { file: '16-react.md', slug: 'react', category: 'frameworks', timeToProductive: '1 week', timeToProficient: '1 month', interviewReady: 'yes' },
      { file: '09-typescript.md', slug: 'typescript', category: 'languages', timeToProductive: '3-5 days', timeToProficient: '2 weeks', interviewReady: 'yes' },
      { file: '04-tailwind.md', slug: 'tailwind', category: 'styling', timeToProductive: '1-2 days', timeToProficient: '1-2 weeks', interviewReady: 'yes' },
      { file: '05-websockets.md', slug: 'websockets', category: 'apis', timeToProductive: '1-2 days', timeToProficient: '1-2 weeks', interviewReady: 'yes' },
      { file: '06-web-workers.md', slug: 'web-workers', category: 'apis', timeToProductive: '1-2 days', timeToProficient: '1-2 weeks', interviewReady: 'yes' },
      { file: '07-pwas.md', slug: 'pwas', category: 'patterns', timeToProductive: '2-3 days', timeToProficient: '2-3 weeks', interviewReady: 'yes' },
      { file: '23-electron.md', slug: 'electron', category: 'frameworks', timeToProductive: '1 week', timeToProficient: '1 month', interviewReady: 'yes-niche' },
      { file: '27-webgl.md', slug: 'webgl', category: 'apis', timeToProductive: '2-3 weeks', timeToProficient: '3-4 months', interviewReady: 'junior-mid' }
    ]
  },
  {
    slug: 'backend-engineer',
    title: 'Backend Engineer',
    description: 'Build robust APIs and master database technologies from SQL to NoSQL to caching. Interview-ready skills covering REST, GraphQL, and data persistence.',
    difficulty: 'intermediate',
    estimatedHours: 10,
    tags: ['express', 'graphql', 'grpc', 'sql', 'nosql', 'redis', 'backend', 'api'],
    order: 2,
    guides: [
      { file: '08-express.md', slug: 'express', category: 'frameworks', timeToProductive: '2-3 days', timeToProficient: '2-3 weeks', interviewReady: 'yes' },
      { file: '12-graphql.md', slug: 'graphql', category: 'apis', timeToProductive: '3-5 days', timeToProficient: '1 month', interviewReady: 'yes' },
      { file: '14-grpc.md', slug: 'grpc', category: 'apis', timeToProductive: '1 week', timeToProficient: '1 month', interviewReady: 'yes' },
      { file: '01-sqlite.md', slug: 'sqlite', category: 'databases', timeToProductive: '1-2 days', timeToProficient: '1 week', interviewReady: 'easy-pass' },
      { file: '15-postgresql.md', slug: 'postgresql', category: 'databases', timeToProductive: '1 week', timeToProficient: '1-2 months', interviewReady: 'yes' },
      { file: '11-mongodb.md', slug: 'mongodb', category: 'databases', timeToProductive: '3-5 days', timeToProficient: '3-4 weeks', interviewReady: 'yes' },
      { file: '02-redis.md', slug: 'redis', category: 'caching', timeToProductive: '1-2 days', timeToProficient: '2-3 weeks', interviewReady: 'yes' },
      { file: '03-memcached.md', slug: 'memcached', category: 'caching', timeToProductive: '1-2 days', timeToProficient: '1-2 weeks', interviewReady: 'yes' }
    ]
  },
  {
    slug: 'devops-engineer',
    title: 'DevOps Engineer',
    description: 'Deploy and scale applications with containers, orchestration, and cloud infrastructure. Interview-ready skills covering CI/CD, monitoring, and infrastructure as code.',
    difficulty: 'intermediate',
    estimatedHours: 6,
    tags: ['docker', 'kubernetes', 'aws', 'kafka', 'devops', 'cloud', 'infrastructure'],
    order: 3,
    guides: [
      { file: '13-docker.md', slug: 'docker', category: 'containers', timeToProductive: '3-5 days', timeToProficient: '1 month', interviewReady: 'yes' },
      { file: '19-kubernetes.md', slug: 'kubernetes', category: 'orchestration', timeToProductive: '2-3 weeks', timeToProficient: '3-4 months', interviewReady: 'junior-mid' },
      { file: '18-aws.md', slug: 'aws', category: 'cloud', timeToProductive: '2-3 weeks', timeToProficient: '3-4 months', interviewReady: 'yes-broad' },
      { file: '20-kafka.md', slug: 'kafka', category: 'messaging', timeToProductive: '2-3 weeks', timeToProficient: '2-3 months', interviewReady: 'junior-mid' }
    ]
  },
  {
    slug: 'systems-engineer',
    title: 'Systems Engineer',
    description: 'Write high-performance code with systems programming languages. Interview-ready skills covering memory management, concurrency, and low-level optimization.',
    difficulty: 'advanced',
    estimatedHours: 8,
    tags: ['go', 'rust', 'cpp', 'webassembly', 'systems', 'performance', 'concurrency'],
    order: 4,
    guides: [
      { file: '17-go.md', slug: 'go', category: 'languages', timeToProductive: '1-2 weeks', timeToProficient: '1 month', interviewReady: 'yes' },
      { file: '21-rust.md', slug: 'rust', category: 'languages', timeToProductive: '1-2 months', timeToProficient: '4-6 months', interviewReady: 'junior-mid' },
      { file: '24-cpp.md', slug: 'cpp', category: 'languages', timeToProductive: '2-3 months', timeToProficient: '6-12 months', interviewReady: 'junior-mid' },
      { file: '22-webassembly.md', slug: 'webassembly', category: 'runtime', timeToProductive: '2-3 weeks', timeToProficient: '2-3 months', interviewReady: 'junior-mid' }
    ]
  },
  {
    slug: 'apple-developer',
    title: 'Apple Developer',
    description: 'Build native iOS and macOS applications with Swift. Interview-ready skills covering SwiftUI, AppKit, and Apple platform patterns.',
    difficulty: 'intermediate',
    estimatedHours: 4,
    tags: ['swift', 'swiftui', 'appkit', 'ios', 'macos', 'apple', 'mobile'],
    order: 5,
    guides: [
      { file: '25-swiftui.md', slug: 'swiftui', category: 'frameworks', timeToProductive: '1-2 weeks', timeToProficient: '1 month', interviewReady: 'yes' },
      { file: '26-appkit.md', slug: 'appkit', category: 'frameworks', timeToProductive: '2-3 weeks', timeToProficient: '2 months', interviewReady: 'yes-rare' }
    ]
  },
  {
    slug: 'data-engineer',
    title: 'Data Engineer',
    description: 'Process and analyze data at scale with Python and Scala. Interview-ready skills covering data pipelines, functional programming, and distributed systems.',
    difficulty: 'intermediate',
    estimatedHours: 4,
    tags: ['python', 'scala', 'data', 'functional', 'spark', 'analytics'],
    order: 6,
    guides: [
      { file: '10-python.md', slug: 'python', category: 'languages', timeToProductive: '3-5 days', timeToProficient: '2 weeks', interviewReady: 'yes' },
      { file: '28-scala.md', slug: 'scala', category: 'languages', timeToProductive: '1-2 months', timeToProficient: '3-4 months', interviewReady: 'junior-mid' }
    ]
  },
  {
    slug: 'js-to-typescript',
    title: 'JavaScript to TypeScript',
    description: 'Migrate confidently from JavaScript to TypeScript. Learn type annotations, generics, utility types, and React+TS patterns with a practical incremental migration strategy.',
    difficulty: 'beginner',
    estimatedHours: 3,
    tags: ['typescript', 'javascript', 'migration', 'types', 'react', 'frontend'],
    order: 7,
    guides: [
      { file: '29-js-to-ts.md', slug: 'js-to-ts', category: 'languages', timeToProductive: '2-3 days', timeToProficient: '2 weeks', interviewReady: 'yes' }
    ]
  },
  {
    slug: 'rust-programming',
    title: 'Rust Programming',
    description: 'Master systems programming with Rust. Deep dive into ownership, borrowing, lifetimes, traits, and safe concurrency — the concepts that make Rust unique.',
    difficulty: 'advanced',
    estimatedHours: 6,
    tags: ['rust', 'systems', 'memory', 'concurrency', 'ownership', 'performance'],
    order: 8,
    guides: [
      { file: '21-rust.md', slug: 'rust', category: 'languages', timeToProductive: '1-2 months', timeToProficient: '4-6 months', interviewReady: 'junior-mid' }
    ]
  },
  {
    slug: 'ios-interview-prep',
    title: 'iOS Interview Prep',
    description: 'Deep, hand-written iOS interview preparation: Swift, SwiftUI, UIKit, concurrency, networking, plus timed speedrun review guides for Apple platform engineering interviews.',
    difficulty: 'advanced',
    estimatedHours: 12,
    tags: ['ios', 'swift', 'swiftui', 'uikit', 'combine', 'concurrency', 'apple', 'interview'],
    order: 9,
    guides: [
      { file: '30-ios-swift.md', slug: 'ios-swift', title: 'Swift Interview Guide', category: 'languages', timeToProductive: '1-2 weeks', timeToProficient: '1-2 months', interviewReady: 'yes' },
      { file: '31-ios-swiftui.md', slug: 'ios-swiftui', title: 'SwiftUI Comprehensive Interview Guide', category: 'frameworks', timeToProductive: '1-2 weeks', timeToProficient: '1-2 months', interviewReady: 'yes' },
      { file: '32-ios-uikit.md', slug: 'ios-uikit', title: 'UIKit Interview Guide', category: 'frameworks', timeToProductive: '2-3 weeks', timeToProficient: '2-3 months', interviewReady: 'yes' },
      { file: '33-ios-combine.md', slug: 'ios-combine', title: 'Swift Concurrency & Combine', category: 'patterns', timeToProductive: '1-2 weeks', timeToProficient: '1-2 months', interviewReady: 'yes' },
      { file: '34-ios-apis.md', slug: 'ios-apis', title: 'High-Throughput API & AI Integration in Swift', category: 'apis', timeToProductive: '1-2 weeks', timeToProficient: '1-2 months', interviewReady: 'yes' },
      { file: '35-ios-awareness.md', slug: 'ios-awareness', title: 'iOS Awareness Guide', category: 'concepts', timeToProductive: '1 day', timeToProficient: '1 week', interviewReady: 'yes' },
      { file: '36-ios-speedrun-final.md', slug: 'ios-speedrun-final', title: 'iOS Final 20% — Deep Cuts', category: 'review', timeToProductive: '1-2 days', timeToProficient: '1-2 weeks', interviewReady: 'yes' },
      { file: '37-ios-speedrun-v1.md', slug: 'ios-speedrun-v1', title: 'iOS Speedrun — Swift Core', category: 'review', timeToProductive: '1-2 days', timeToProficient: '1-2 weeks', interviewReady: 'yes' },
      { file: '38-ios-speedrun-v2.md', slug: 'ios-speedrun-v2', title: 'iOS Deep Dive — 1 Hour Edition', category: 'review', timeToProductive: '1-2 days', timeToProficient: '1-2 weeks', interviewReady: 'yes' },
      { file: '39-ios-speedrun-v3.md', slug: 'ios-speedrun-v3', title: 'iOS Advanced — 1 Hour Edition', category: 'review', timeToProductive: '1-2 days', timeToProficient: '1-2 weeks', interviewReady: 'yes' },
      { file: '40-ios-next.md', slug: 'ios-next', title: 'What Could Still Trip You Up', category: 'concepts', timeToProductive: '1 day', timeToProficient: '1 week', interviewReady: 'yes' },
      { file: '41-ios-reading-notes.md', slug: 'ios-reading-notes', title: 'iOS Reading Notes', category: 'concepts', timeToProductive: '1 day', timeToProficient: '1 week', interviewReady: 'yes' },
      { file: '42-ios-cheatsheet.md', slug: 'ios-cheatsheet', title: 'iOS Cheatsheet', category: 'reference', timeToProductive: '1 day', timeToProficient: '1 week', interviewReady: 'yes' },
      { file: '43-ios-swiftui-cheatsheet.md', slug: 'ios-swiftui-cheatsheet', title: 'SwiftUI Cheatsheet', category: 'reference', timeToProductive: '1 day', timeToProficient: '1 week', interviewReady: 'yes' },
      { file: '44-ios-cheatsheet-extra.md', slug: 'ios-cheatsheet-extra', title: 'iOS Cheatsheet (Extra)', category: 'reference', timeToProductive: '1 day', timeToProficient: '1 week', interviewReady: 'yes' },
      { file: '45-ios-mock-uikit-30min.md', slug: 'ios-mock-uikit-30min', title: 'Mock: UIKit Hard Mode (30 min)', category: 'mocks', timeToProductive: '1 day', timeToProficient: '1 week', interviewReady: 'yes' },
    ],
  }
];

// Quiz data for each guide - keyed by guide slug
const QUIZZES = {
  react: {
    title: 'React',
    description: 'Questions on virtual DOM, components, hooks, state management, and React patterns.',
    questions: [
      { id: 'q1', question: 'What is the virtual DOM in React?', correctAnswer: 'b', options: [{ id: 'a', text: 'A direct copy of the browser DOM stored in memory' }, { id: 'b', text: 'A lightweight JavaScript representation used for efficient diffing' }, { id: 'c', text: 'A browser API for faster DOM manipulation' }, { id: 'd', text: 'A CSS-in-JS solution for styling components' }] },
      { id: 'q2', question: 'What hook is used for side effects in React?', correctAnswer: 'b', options: [{ id: 'a', text: 'useState' }, { id: 'b', text: 'useEffect' }, { id: 'c', text: 'useContext' }, { id: 'd', text: 'useReducer' }] },
      { id: 'q3', question: 'What is the purpose of the key prop in lists?', correctAnswer: 'c', options: [{ id: 'a', text: 'To style list items uniquely' }, { id: 'b', text: 'To access items via refs' }, { id: 'c', text: 'To help React identify which items changed' }, { id: 'd', text: 'To sort the list automatically' }] },
      { id: 'q4', question: 'What is useState used for?', correctAnswer: 'a', options: [{ id: 'a', text: 'Managing local component state' }, { id: 'b', text: 'Fetching data from APIs' }, { id: 'c', text: 'Routing between pages' }, { id: 'd', text: 'Styling components' }] },
      { id: 'q5', question: 'How do you pass data from parent to child component?', correctAnswer: 'b', options: [{ id: 'a', text: 'Using context' }, { id: 'b', text: 'Using props' }, { id: 'c', text: 'Using refs' }, { id: 'd', text: 'Using state' }] },
      { id: 'q6', question: 'What is JSX?', correctAnswer: 'c', options: [{ id: 'a', text: 'A separate templating language' }, { id: 'b', text: 'Pure JavaScript' }, { id: 'c', text: 'A syntax extension that compiles to JavaScript' }, { id: 'd', text: 'HTML with special attributes' }] },
      { id: 'q7', question: 'When does useEffect run by default?', correctAnswer: 'b', options: [{ id: 'a', text: 'Only on mount' }, { id: 'b', text: 'After every render' }, { id: 'c', text: 'Only on unmount' }, { id: 'd', text: 'Before render' }] },
      { id: 'q8', question: 'What is the purpose of useMemo?', correctAnswer: 'a', options: [{ id: 'a', text: 'Memoize expensive calculations' }, { id: 'b', text: 'Store form data' }, { id: 'c', text: 'Handle side effects' }, { id: 'd', text: 'Create refs' }] },
      { id: 'q9', question: 'How do you prevent unnecessary re-renders?', correctAnswer: 'd', options: [{ id: 'a', text: 'Using more state' }, { id: 'b', text: 'Avoiding props' }, { id: 'c', text: 'Using class components' }, { id: 'd', text: 'Using React.memo and useCallback' }] },
      { id: 'q10', question: 'What is a controlled component?', correctAnswer: 'b', options: [{ id: 'a', text: 'A component with no state' }, { id: 'b', text: 'A form element whose value is controlled by React state' }, { id: 'c', text: 'A component wrapped in a HOC' }, { id: 'd', text: 'A component that controls its children' }] }
    ]
  },
  typescript: {
    title: 'TypeScript',
    description: 'Questions on types, interfaces, generics, type inference, and TypeScript patterns.',
    questions: [
      { id: 'q1', question: 'What is the difference between interface and type?', correctAnswer: 'c', options: [{ id: 'a', text: 'They are exactly the same' }, { id: 'b', text: 'interface is for objects, type is for primitives' }, { id: 'c', text: 'interface can be extended/merged, type is more flexible' }, { id: 'd', text: 'type is deprecated' }] },
      { id: 'q2', question: 'What does the "unknown" type represent?', correctAnswer: 'b', options: [{ id: 'a', text: 'A type that accepts nothing' }, { id: 'b', text: 'A type-safe alternative to any' }, { id: 'c', text: 'An undefined value' }, { id: 'd', text: 'A null value' }] },
      { id: 'q3', question: 'What is a generic in TypeScript?', correctAnswer: 'a', options: [{ id: 'a', text: 'A type parameter that allows reusable type-safe code' }, { id: 'b', text: 'A default export' }, { id: 'c', text: 'A type that accepts any value' }, { id: 'd', text: 'A built-in utility type' }] },
      { id: 'q4', question: 'What is the "never" type used for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Optional parameters' }, { id: 'b', text: 'Null values' }, { id: 'c', text: 'Functions that never return' }, { id: 'd', text: 'Empty arrays' }] },
      { id: 'q5', question: 'How do you make a property optional?', correctAnswer: 'b', options: [{ id: 'a', text: 'Using the optional keyword' }, { id: 'b', text: 'Using ? after the property name' }, { id: 'c', text: 'Using undefined type' }, { id: 'd', text: 'Using null type' }] },
      { id: 'q6', question: 'What is type narrowing?', correctAnswer: 'a', options: [{ id: 'a', text: 'Refining a type to a more specific type using guards' }, { id: 'b', text: 'Converting types to strings' }, { id: 'c', text: 'Removing properties from types' }, { id: 'd', text: 'Making types smaller in file size' }] },
      { id: 'q7', question: 'What does Partial<T> do?', correctAnswer: 'b', options: [{ id: 'a', text: 'Removes all properties' }, { id: 'b', text: 'Makes all properties optional' }, { id: 'c', text: 'Makes all properties required' }, { id: 'd', text: 'Picks some properties' }] },
      { id: 'q8', question: 'What is a union type?', correctAnswer: 'c', options: [{ id: 'a', text: 'A type that combines all properties' }, { id: 'b', text: 'A type for arrays' }, { id: 'c', text: 'A type that can be one of several types' }, { id: 'd', text: 'A type for functions' }] },
      { id: 'q9', question: 'What is the "as const" assertion used for?', correctAnswer: 'a', options: [{ id: 'a', text: 'Creating literal types from values' }, { id: 'b', text: 'Type casting' }, { id: 'c', text: 'Declaring constants' }, { id: 'd', text: 'Freezing objects' }] },
      { id: 'q10', question: 'What is a type predicate?', correctAnswer: 'd', options: [{ id: 'a', text: 'A conditional type' }, { id: 'b', text: 'A generic constraint' }, { id: 'c', text: 'A type assertion' }, { id: 'd', text: 'A function return type that narrows types' }] }
    ]
  },
  tailwind: {
    title: 'Tailwind CSS',
    description: 'Questions on utility classes, responsive design, configuration, and Tailwind patterns.',
    questions: [
      { id: 'q1', question: 'What is the utility-first approach in Tailwind?', correctAnswer: 'b', options: [{ id: 'a', text: 'Writing CSS in separate files' }, { id: 'b', text: 'Applying small, single-purpose classes directly in HTML' }, { id: 'c', text: 'Using JavaScript for styling' }, { id: 'd', text: 'Using CSS variables' }] },
      { id: 'q2', question: 'How do you apply styles on hover in Tailwind?', correctAnswer: 'a', options: [{ id: 'a', text: 'hover:bg-blue-500' }, { id: 'b', text: 'bg-blue-500:hover' }, { id: 'c', text: '@hover bg-blue-500' }, { id: 'd', text: 'onHover="bg-blue-500"' }] },
      { id: 'q3', question: 'What prefix is used for medium screen breakpoint?', correctAnswer: 'c', options: [{ id: 'a', text: 'sm:' }, { id: 'b', text: 'lg:' }, { id: 'c', text: 'md:' }, { id: 'd', text: 'xl:' }] },
      { id: 'q4', question: 'How do you enable dark mode styles?', correctAnswer: 'b', options: [{ id: 'a', text: 'night:bg-black' }, { id: 'b', text: 'dark:bg-black' }, { id: 'c', text: 'theme:dark bg-black' }, { id: 'd', text: '@dark bg-black' }] },
      { id: 'q5', question: 'What does the "container" class do?', correctAnswer: 'a', options: [{ id: 'a', text: 'Centers content with responsive max-width' }, { id: 'b', text: 'Creates a flexbox container' }, { id: 'c', text: 'Creates a grid container' }, { id: 'd', text: 'Adds padding to all sides' }] },
      { id: 'q6', question: 'How do you add spacing between flex children?', correctAnswer: 'c', options: [{ id: 'a', text: 'margin-between-4' }, { id: 'b', text: 'spacing-4' }, { id: 'c', text: 'gap-4' }, { id: 'd', text: 'space-4' }] },
      { id: 'q7', question: 'What is the JIT mode in Tailwind?', correctAnswer: 'b', options: [{ id: 'a', text: 'Just In Testing mode' }, { id: 'b', text: 'Just In Time compiler generating styles on demand' }, { id: 'c', text: 'JavaScript Integration Tool' }, { id: 'd', text: 'JSON Import Template' }] },
      { id: 'q8', question: 'How do you apply arbitrary values in Tailwind?', correctAnswer: 'a', options: [{ id: 'a', text: 'w-[300px]' }, { id: 'b', text: 'w-300px' }, { id: 'c', text: 'w={300px}' }, { id: 'd', text: 'w-custom-300' }] },
      { id: 'q9', question: 'What does "truncate" class do?', correctAnswer: 'c', options: [{ id: 'a', text: 'Removes all text' }, { id: 'b', text: 'Shortens the element' }, { id: 'c', text: 'Adds ellipsis for overflowing text' }, { id: 'd', text: 'Cuts the element in half' }] },
      { id: 'q10', question: 'How do you customize the default theme?', correctAnswer: 'd', options: [{ id: 'a', text: 'Using CSS variables only' }, { id: 'b', text: 'Editing node_modules' }, { id: 'c', text: 'Using inline styles' }, { id: 'd', text: 'Using tailwind.config.js extend' }] }
    ]
  },
  websockets: {
    title: 'WebSockets',
    description: 'Questions on WebSocket protocol, real-time communication, and connection management.',
    questions: [
      { id: 'q1', question: 'What makes WebSockets different from HTTP?', correctAnswer: 'b', options: [{ id: 'a', text: 'WebSockets are faster' }, { id: 'b', text: 'WebSockets maintain persistent bidirectional connections' }, { id: 'c', text: 'WebSockets use less bandwidth' }, { id: 'd', text: 'WebSockets are more secure' }] },
      { id: 'q2', question: 'What is the WebSocket handshake?', correctAnswer: 'a', options: [{ id: 'a', text: 'HTTP upgrade request to establish WebSocket connection' }, { id: 'b', text: 'SSL certificate exchange' }, { id: 'c', text: 'Authentication token validation' }, { id: 'd', text: 'IP address verification' }] },
      { id: 'q3', question: 'Which event fires when a WebSocket connection opens?', correctAnswer: 'c', options: [{ id: 'a', text: 'onconnect' }, { id: 'b', text: 'onstart' }, { id: 'c', text: 'onopen' }, { id: 'd', text: 'onready' }] },
      { id: 'q4', question: 'How do you send data through a WebSocket?', correctAnswer: 'b', options: [{ id: 'a', text: 'ws.post(data)' }, { id: 'b', text: 'ws.send(data)' }, { id: 'c', text: 'ws.emit(data)' }, { id: 'd', text: 'ws.write(data)' }] },
      { id: 'q5', question: 'What is a WebSocket frame?', correctAnswer: 'a', options: [{ id: 'a', text: 'The basic unit of data transmission in WebSocket' }, { id: 'b', text: 'A visual component' }, { id: 'c', text: 'A connection timeout' }, { id: 'd', text: 'An error message' }] },
      { id: 'q6', question: 'What port do secure WebSockets (wss://) use by default?', correctAnswer: 'd', options: [{ id: 'a', text: '80' }, { id: 'b', text: '8080' }, { id: 'c', text: '3000' }, { id: 'd', text: '443' }] },
      { id: 'q7', question: 'How do you handle reconnection in WebSockets?', correctAnswer: 'c', options: [{ id: 'a', text: 'WebSockets auto-reconnect' }, { id: 'b', text: 'Using the reconnect() method' }, { id: 'c', text: 'Implementing custom retry logic in onclose' }, { id: 'd', text: 'Setting reconnect: true option' }] },
      { id: 'q8', question: 'What is the purpose of ping/pong frames?', correctAnswer: 'b', options: [{ id: 'a', text: 'To send small messages' }, { id: 'b', text: 'To keep the connection alive and detect failures' }, { id: 'c', text: 'To measure latency' }, { id: 'd', text: 'To authenticate users' }] },
      { id: 'q9', question: 'What readyState value indicates an open connection?', correctAnswer: 'a', options: [{ id: 'a', text: '1 (OPEN)' }, { id: 'b', text: '0 (CONNECTING)' }, { id: 'c', text: '2 (CLOSING)' }, { id: 'd', text: '3 (CLOSED)' }] },
      { id: 'q10', question: 'What is Socket.IO?', correctAnswer: 'c', options: [{ id: 'a', text: 'The WebSocket specification' }, { id: 'b', text: 'A browser API' }, { id: 'c', text: 'A library that adds features on top of WebSockets' }, { id: 'd', text: 'A WebSocket server' }] }
    ]
  },
  'web-workers': {
    title: 'Web Workers',
    description: 'Questions on background threading, worker communication, and parallel processing in browsers.',
    questions: [
      { id: 'q1', question: 'What is the main purpose of Web Workers?', correctAnswer: 'b', options: [{ id: 'a', text: 'To style web pages' }, { id: 'b', text: 'To run scripts in background threads' }, { id: 'c', text: 'To manage cookies' }, { id: 'd', text: 'To handle routing' }] },
      { id: 'q2', question: 'Can Web Workers access the DOM?', correctAnswer: 'a', options: [{ id: 'a', text: 'No, they cannot access DOM' }, { id: 'b', text: 'Yes, full access' }, { id: 'c', text: 'Only read access' }, { id: 'd', text: 'Only with permission' }] },
      { id: 'q3', question: 'How do you communicate with a Web Worker?', correctAnswer: 'c', options: [{ id: 'a', text: 'Using shared variables' }, { id: 'b', text: 'Using callbacks' }, { id: 'c', text: 'Using postMessage and onmessage' }, { id: 'd', text: 'Using promises' }] },
      { id: 'q4', question: 'What is a Shared Worker?', correctAnswer: 'b', options: [{ id: 'a', text: 'A worker that shares memory' }, { id: 'b', text: 'A worker accessible from multiple browsing contexts' }, { id: 'c', text: 'A worker that shares CPU' }, { id: 'd', text: 'A worker that shares files' }] },
      { id: 'q5', question: 'What is a transferable object?', correctAnswer: 'a', options: [{ id: 'a', text: 'An object whose ownership can be transferred to a worker' }, { id: 'b', text: 'An object that can be copied' }, { id: 'c', text: 'An object that can be serialized' }, { id: 'd', text: 'An object that can be shared' }] },
      { id: 'q6', question: 'How do you create a Web Worker?', correctAnswer: 'c', options: [{ id: 'a', text: 'Worker.create("worker.js")' }, { id: 'b', text: 'createWorker("worker.js")' }, { id: 'c', text: 'new Worker("worker.js")' }, { id: 'd', text: 'Worker("worker.js")' }] },
      { id: 'q7', question: 'What APIs are available in Web Workers?', correctAnswer: 'd', options: [{ id: 'a', text: 'DOM, window, document' }, { id: 'b', text: 'Only console' }, { id: 'c', text: 'Nothing' }, { id: 'd', text: 'fetch, IndexedDB, WebSockets' }] },
      { id: 'q8', question: 'How do you terminate a Web Worker?', correctAnswer: 'b', options: [{ id: 'a', text: 'worker.stop()' }, { id: 'b', text: 'worker.terminate()' }, { id: 'c', text: 'worker.kill()' }, { id: 'd', text: 'worker.close()' }] },
      { id: 'q9', question: 'What is structured cloning?', correctAnswer: 'a', options: [{ id: 'a', text: 'Algorithm for deep copying objects between contexts' }, { id: 'b', text: 'A way to create DOM elements' }, { id: 'c', text: 'A CSS technique' }, { id: 'd', text: 'A JavaScript design pattern' }] },
      { id: 'q10', question: 'What is a Service Worker?', correctAnswer: 'c', options: [{ id: 'a', text: 'A worker for background tasks' }, { id: 'b', text: 'A worker for DOM manipulation' }, { id: 'c', text: 'A worker that acts as a network proxy for PWAs' }, { id: 'd', text: 'A worker for database operations' }] }
    ]
  },
  pwas: {
    title: 'Progressive Web Apps',
    description: 'Questions on service workers, manifest files, offline functionality, and PWA patterns.',
    questions: [
      { id: 'q1', question: 'What makes a web app a PWA?', correctAnswer: 'b', options: [{ id: 'a', text: 'Using React' }, { id: 'b', text: 'Service worker, manifest, and HTTPS' }, { id: 'c', text: 'Having a mobile layout' }, { id: 'd', text: 'Using a framework' }] },
      { id: 'q2', question: 'What is the web app manifest?', correctAnswer: 'a', options: [{ id: 'a', text: 'JSON file describing app metadata for installation' }, { id: 'b', text: 'A list of JavaScript files' }, { id: 'c', text: 'A configuration for webpack' }, { id: 'd', text: 'A CSS file' }] },
      { id: 'q3', question: 'What caching strategy serves from cache first?', correctAnswer: 'c', options: [{ id: 'a', text: 'Network First' }, { id: 'b', text: 'Network Only' }, { id: 'c', text: 'Cache First' }, { id: 'd', text: 'Stale While Revalidate' }] },
      { id: 'q4', question: 'How do you register a service worker?', correctAnswer: 'b', options: [{ id: 'a', text: 'ServiceWorker.install()' }, { id: 'b', text: 'navigator.serviceWorker.register()' }, { id: 'c', text: 'new ServiceWorker()' }, { id: 'd', text: 'window.registerSW()' }] },
      { id: 'q5', question: 'What event fires when a service worker installs?', correctAnswer: 'a', options: [{ id: 'a', text: 'install' }, { id: 'b', text: 'ready' }, { id: 'c', text: 'start' }, { id: 'd', text: 'init' }] },
      { id: 'q6', question: 'What is the purpose of the fetch event in service workers?', correctAnswer: 'c', options: [{ id: 'a', text: 'To download the service worker' }, { id: 'b', text: 'To fetch the manifest' }, { id: 'c', text: 'To intercept network requests' }, { id: 'd', text: 'To fetch data from cache' }] },
      { id: 'q7', question: 'What manifest property sets the app name?', correctAnswer: 'b', options: [{ id: 'a', text: 'title' }, { id: 'b', text: 'name' }, { id: 'c', text: 'app_name' }, { id: 'd', text: 'label' }] },
      { id: 'q8', question: 'What is the activate event used for?', correctAnswer: 'a', options: [{ id: 'a', text: 'Cleaning up old caches' }, { id: 'b', text: 'Starting the app' }, { id: 'c', text: 'Installing dependencies' }, { id: 'd', text: 'Fetching data' }] },
      { id: 'q9', question: 'What display mode hides the browser UI?', correctAnswer: 'd', options: [{ id: 'a', text: 'browser' }, { id: 'b', text: 'minimal-ui' }, { id: 'c', text: 'fullscreen' }, { id: 'd', text: 'standalone' }] },
      { id: 'q10', question: 'How do you trigger an install prompt?', correctAnswer: 'c', options: [{ id: 'a', text: 'window.install()' }, { id: 'b', text: 'navigator.install()' }, { id: 'c', text: 'beforeinstallprompt event and prompt() method' }, { id: 'd', text: 'manifest.install()' }] }
    ]
  },
  electron: {
    title: 'Electron',
    description: 'Questions on main/renderer processes, IPC, packaging, and desktop app development.',
    questions: [
      { id: 'q1', question: 'What is Electron built on?', correctAnswer: 'b', options: [{ id: 'a', text: 'Firefox and Node.js' }, { id: 'b', text: 'Chromium and Node.js' }, { id: 'c', text: 'WebKit and Node.js' }, { id: 'd', text: 'Chrome and Deno' }] },
      { id: 'q2', question: 'What is the main process in Electron?', correctAnswer: 'a', options: [{ id: 'a', text: 'Node.js process that manages windows and app lifecycle' }, { id: 'b', text: 'The renderer process' }, { id: 'c', text: 'A web worker' }, { id: 'd', text: 'The GPU process' }] },
      { id: 'q3', question: 'How do processes communicate in Electron?', correctAnswer: 'c', options: [{ id: 'a', text: 'Shared memory' }, { id: 'b', text: 'Global variables' }, { id: 'c', text: 'IPC (Inter-Process Communication)' }, { id: 'd', text: 'WebSockets' }] },
      { id: 'q4', question: 'What creates a new window in Electron?', correctAnswer: 'b', options: [{ id: 'a', text: 'new Window()' }, { id: 'b', text: 'new BrowserWindow()' }, { id: 'c', text: 'createWindow()' }, { id: 'd', text: 'electron.window()' }] },
      { id: 'q5', question: 'What is the renderer process?', correctAnswer: 'a', options: [{ id: 'a', text: 'Web page running in each window' }, { id: 'b', text: 'The main Node.js process' }, { id: 'c', text: 'A background worker' }, { id: 'd', text: 'The packaging process' }] },
      { id: 'q6', question: 'What is contextBridge used for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Creating windows' }, { id: 'b', text: 'Managing menus' }, { id: 'c', text: 'Safely exposing APIs to renderer' }, { id: 'd', text: 'Handling crashes' }] },
      { id: 'q7', question: 'How do you send from renderer to main?', correctAnswer: 'b', options: [{ id: 'a', text: 'ipcMain.send()' }, { id: 'b', text: 'ipcRenderer.send()' }, { id: 'c', text: 'electron.send()' }, { id: 'd', text: 'window.send()' }] },
      { id: 'q8', question: 'What is preload script?', correctAnswer: 'a', options: [{ id: 'a', text: 'Script that runs before renderer loads with Node access' }, { id: 'b', text: 'The main process script' }, { id: 'c', text: 'A CSS preprocessor' }, { id: 'd', text: 'A build configuration' }] },
      { id: 'q9', question: 'How do you package an Electron app?', correctAnswer: 'd', options: [{ id: 'a', text: 'npm pack' }, { id: 'b', text: 'electron pack' }, { id: 'c', text: 'webpack' }, { id: 'd', text: 'electron-builder or electron-packager' }] },
      { id: 'q10', question: 'What is nodeIntegration?', correctAnswer: 'c', options: [{ id: 'a', text: 'A testing framework' }, { id: 'b', text: 'A build tool' }, { id: 'c', text: 'Option to enable Node.js in renderer (security risk)' }, { id: 'd', text: 'A package manager' }] }
    ]
  },
  webgl: {
    title: 'WebGL',
    description: 'Questions on shaders, buffers, textures, and 3D graphics in the browser.',
    questions: [
      { id: 'q1', question: 'What is WebGL?', correctAnswer: 'b', options: [{ id: 'a', text: 'A CSS framework' }, { id: 'b', text: 'JavaScript API for rendering 2D/3D graphics using GPU' }, { id: 'c', text: 'A JavaScript library' }, { id: 'd', text: 'A browser extension' }] },
      { id: 'q2', question: 'What are the two types of shaders in WebGL?', correctAnswer: 'a', options: [{ id: 'a', text: 'Vertex and Fragment' }, { id: 'b', text: 'Pixel and Geometry' }, { id: 'c', text: 'Color and Light' }, { id: 'd', text: 'Input and Output' }] },
      { id: 'q3', question: 'What language are WebGL shaders written in?', correctAnswer: 'c', options: [{ id: 'a', text: 'JavaScript' }, { id: 'b', text: 'C++' }, { id: 'c', text: 'GLSL' }, { id: 'd', text: 'Rust' }] },
      { id: 'q4', question: 'What is a vertex buffer?', correctAnswer: 'b', options: [{ id: 'a', text: 'Buffer for pixel colors' }, { id: 'b', text: 'Buffer storing vertex positions and attributes' }, { id: 'c', text: 'Buffer for textures' }, { id: 'd', text: 'Buffer for sounds' }] },
      { id: 'q5', question: 'What does gl.drawArrays() do?', correctAnswer: 'a', options: [{ id: 'a', text: 'Renders primitives from array data' }, { id: 'b', text: 'Creates arrays' }, { id: 'c', text: 'Draws UI elements' }, { id: 'd', text: 'Loads textures' }] },
      { id: 'q6', question: 'What is a texture in WebGL?', correctAnswer: 'c', options: [{ id: 'a', text: 'A 3D model' }, { id: 'b', text: 'A shader' }, { id: 'c', text: 'An image mapped onto geometry' }, { id: 'd', text: 'A buffer' }] },
      { id: 'q7', question: 'What is the rendering pipeline?', correctAnswer: 'b', options: [{ id: 'a', text: 'A data structure' }, { id: 'b', text: 'Stages data goes through to become pixels' }, { id: 'c', text: 'A type of shader' }, { id: 'd', text: 'A buffer type' }] },
      { id: 'q8', question: 'What is a uniform in WebGL?', correctAnswer: 'a', options: [{ id: 'a', text: 'Global variable passed to shaders' }, { id: 'b', text: 'A type of buffer' }, { id: 'c', text: 'A drawing mode' }, { id: 'd', text: 'A texture type' }] },
      { id: 'q9', question: 'What is Three.js?', correctAnswer: 'd', options: [{ id: 'a', text: 'A WebGL specification' }, { id: 'b', text: 'A browser API' }, { id: 'c', text: 'A shader language' }, { id: 'd', text: 'A library that simplifies WebGL development' }] },
      { id: 'q10', question: 'What is the fragment shader responsible for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Positioning vertices' }, { id: 'b', text: 'Creating geometry' }, { id: 'c', text: 'Determining pixel colors' }, { id: 'd', text: 'Loading textures' }] }
    ]
  },
  express: {
    title: 'Express.js',
    description: 'Questions on middleware, routing, request handling, and Express patterns.',
    questions: [
      { id: 'q1', question: 'What is Express.js?', correctAnswer: 'b', options: [{ id: 'a', text: 'A database' }, { id: 'b', text: 'A minimal Node.js web framework' }, { id: 'c', text: 'A templating engine' }, { id: 'd', text: 'A CSS framework' }] },
      { id: 'q2', question: 'What is middleware in Express?', correctAnswer: 'a', options: [{ id: 'a', text: 'Functions with access to req, res, and next' }, { id: 'b', text: 'Database connectors' }, { id: 'c', text: 'HTML templates' }, { id: 'd', text: 'CSS processors' }] },
      { id: 'q3', question: 'How do you define a route parameter?', correctAnswer: 'c', options: [{ id: 'a', text: '/users?id' }, { id: 'b', text: '/users[id]' }, { id: 'c', text: '/users/:id' }, { id: 'd', text: '/users{id}' }] },
      { id: 'q4', question: 'What does app.use() do?', correctAnswer: 'b', options: [{ id: 'a', text: 'Defines a GET route' }, { id: 'b', text: 'Mounts middleware' }, { id: 'c', text: 'Starts the server' }, { id: 'd', text: 'Closes connections' }] },
      { id: 'q5', question: 'How do you parse JSON request bodies?', correctAnswer: 'a', options: [{ id: 'a', text: 'express.json() middleware' }, { id: 'b', text: 'JSON.parse() manually' }, { id: 'c', text: 'body-parser only' }, { id: 'd', text: 'req.parseBody()' }] },
      { id: 'q6', question: 'What is res.json() used for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Parsing JSON' }, { id: 'b', text: 'Reading JSON files' }, { id: 'c', text: 'Sending JSON response' }, { id: 'd', text: 'Validating JSON' }] },
      { id: 'q7', question: 'How do you handle errors in Express?', correctAnswer: 'b', options: [{ id: 'a', text: 'try/catch only' }, { id: 'b', text: 'Error-handling middleware with 4 parameters' }, { id: 'c', text: 'process.on("error")' }, { id: 'd', text: 'app.error()' }] },
      { id: 'q8', question: 'What does next() do?', correctAnswer: 'a', options: [{ id: 'a', text: 'Passes control to next middleware' }, { id: 'b', text: 'Ends the response' }, { id: 'c', text: 'Redirects the request' }, { id: 'd', text: 'Logs the request' }] },
      { id: 'q9', question: 'How do you serve static files?', correctAnswer: 'd', options: [{ id: 'a', text: 'app.static()' }, { id: 'b', text: 'res.sendStatic()' }, { id: 'c', text: 'express.files()' }, { id: 'd', text: 'express.static() middleware' }] },
      { id: 'q10', question: 'What is Router in Express?', correctAnswer: 'c', options: [{ id: 'a', text: 'A URL parser' }, { id: 'b', text: 'A redirect handler' }, { id: 'c', text: 'A mini-app for modular routing' }, { id: 'd', text: 'A navigation component' }] }
    ]
  },
  graphql: {
    title: 'GraphQL',
    description: 'Questions on schemas, resolvers, queries, mutations, and GraphQL patterns.',
    questions: [
      { id: 'q1', question: 'What problem does GraphQL solve?', correctAnswer: 'b', options: [{ id: 'a', text: 'Database performance' }, { id: 'b', text: 'Over-fetching and under-fetching of data' }, { id: 'c', text: 'Authentication' }, { id: 'd', text: 'Caching' }] },
      { id: 'q2', question: 'What is a GraphQL schema?', correctAnswer: 'a', options: [{ id: 'a', text: 'Type definitions describing the API' }, { id: 'b', text: 'A database schema' }, { id: 'c', text: 'A JSON file' }, { id: 'd', text: 'A REST endpoint' }] },
      { id: 'q3', question: 'What is a resolver?', correctAnswer: 'c', options: [{ id: 'a', text: 'A type definition' }, { id: 'b', text: 'A client library' }, { id: 'c', text: 'A function that returns data for a field' }, { id: 'd', text: 'A query validator' }] },
      { id: 'q4', question: 'What is the difference between Query and Mutation?', correctAnswer: 'b', options: [{ id: 'a', text: 'Query is faster' }, { id: 'b', text: 'Query reads data, Mutation writes data' }, { id: 'c', text: 'Mutation is for subscriptions' }, { id: 'd', text: 'They are the same' }] },
      { id: 'q5', question: 'What is a GraphQL subscription?', correctAnswer: 'a', options: [{ id: 'a', text: 'Real-time data updates via WebSocket' }, { id: 'b', text: 'A payment system' }, { id: 'c', text: 'A query cache' }, { id: 'd', text: 'A type definition' }] },
      { id: 'q6', question: 'What is the "!" symbol in GraphQL types?', correctAnswer: 'c', options: [{ id: 'a', text: 'Optional field' }, { id: 'b', text: 'Deprecated field' }, { id: 'c', text: 'Non-nullable field' }, { id: 'd', text: 'Array field' }] },
      { id: 'q7', question: 'What is introspection in GraphQL?', correctAnswer: 'b', options: [{ id: 'a', text: 'Error handling' }, { id: 'b', text: 'Ability to query the schema itself' }, { id: 'c', text: 'Logging' }, { id: 'd', text: 'Authentication' }] },
      { id: 'q8', question: 'What is a fragment in GraphQL?', correctAnswer: 'a', options: [{ id: 'a', text: 'Reusable set of fields' }, { id: 'b', text: 'A broken query' }, { id: 'c', text: 'A partial response' }, { id: 'd', text: 'An error type' }] },
      { id: 'q9', question: 'What is the N+1 problem in GraphQL?', correctAnswer: 'd', options: [{ id: 'a', text: 'A versioning issue' }, { id: 'b', text: 'A schema conflict' }, { id: 'c', text: 'A type error' }, { id: 'd', text: 'Inefficient database queries from nested resolvers' }] },
      { id: 'q10', question: 'What is DataLoader used for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Loading the schema' }, { id: 'b', text: 'Parsing queries' }, { id: 'c', text: 'Batching and caching to solve N+1' }, { id: 'd', text: 'Validating mutations' }] }
    ]
  },
  grpc: {
    title: 'gRPC',
    description: 'Questions on Protocol Buffers, service definitions, streaming, and gRPC patterns.',
    questions: [
      { id: 'q1', question: 'What is gRPC?', correctAnswer: 'b', options: [{ id: 'a', text: 'A REST alternative using JSON' }, { id: 'b', text: 'High-performance RPC framework using Protocol Buffers' }, { id: 'c', text: 'A database protocol' }, { id: 'd', text: 'A GraphQL implementation' }] },
      { id: 'q2', question: 'What is Protocol Buffers (Protobuf)?', correctAnswer: 'a', options: [{ id: 'a', text: 'Binary serialization format for structured data' }, { id: 'b', text: 'A networking protocol' }, { id: 'c', text: 'A JSON alternative' }, { id: 'd', text: 'A compression algorithm' }] },
      { id: 'q3', question: 'What HTTP version does gRPC use?', correctAnswer: 'c', options: [{ id: 'a', text: 'HTTP/1.0' }, { id: 'b', text: 'HTTP/1.1' }, { id: 'c', text: 'HTTP/2' }, { id: 'd', text: 'HTTP/3' }] },
      { id: 'q4', question: 'What are the four gRPC communication patterns?', correctAnswer: 'b', options: [{ id: 'a', text: 'GET, POST, PUT, DELETE' }, { id: 'b', text: 'Unary, Server streaming, Client streaming, Bidirectional' }, { id: 'c', text: 'Request, Response, Push, Pull' }, { id: 'd', text: 'Sync, Async, Callback, Promise' }] },
      { id: 'q5', question: 'What file extension is used for Protobuf definitions?', correctAnswer: 'a', options: [{ id: 'a', text: '.proto' }, { id: 'b', text: '.grpc' }, { id: 'c', text: '.pb' }, { id: 'd', text: '.buf' }] },
      { id: 'q6', question: 'What is a gRPC stub?', correctAnswer: 'c', options: [{ id: 'a', text: 'A test mock' }, { id: 'b', text: 'A server instance' }, { id: 'c', text: 'Generated client code for calling services' }, { id: 'd', text: 'A configuration file' }] },
      { id: 'q7', question: 'Why is gRPC faster than REST?', correctAnswer: 'b', options: [{ id: 'a', text: 'Better servers' }, { id: 'b', text: 'Binary format, HTTP/2 multiplexing, no re-parsing' }, { id: 'c', text: 'More threads' }, { id: 'd', text: 'Simpler code' }] },
      { id: 'q8', question: 'What is metadata in gRPC?', correctAnswer: 'a', options: [{ id: 'a', text: 'Key-value pairs sent with requests (like HTTP headers)' }, { id: 'b', text: 'Schema information' }, { id: 'c', text: 'Service documentation' }, { id: 'd', text: 'Error details' }] },
      { id: 'q9', question: 'What is a deadline in gRPC?', correctAnswer: 'd', options: [{ id: 'a', text: 'A versioning system' }, { id: 'b', text: 'A rate limit' }, { id: 'c', text: 'A retry policy' }, { id: 'd', text: 'Maximum time for a request to complete' }] },
      { id: 'q10', question: 'When should you use gRPC over REST?', correctAnswer: 'c', options: [{ id: 'a', text: 'For browser clients' }, { id: 'b', text: 'For public APIs' }, { id: 'c', text: 'For microservices and performance-critical internal APIs' }, { id: 'd', text: 'For simple CRUD operations' }] }
    ]
  },
  sqlite: {
    title: 'SQLite',
    description: 'Questions on embedded databases, SQL operations, and SQLite patterns.',
    questions: [
      { id: 'q1', question: 'What makes SQLite unique among databases?', correctAnswer: 'b', options: [{ id: 'a', text: 'It is the fastest' }, { id: 'b', text: 'It is serverless and stores data in a single file' }, { id: 'c', text: 'It only works on mobile' }, { id: 'd', text: 'It requires no SQL' }] },
      { id: 'q2', question: 'What is WAL mode in SQLite?', correctAnswer: 'a', options: [{ id: 'a', text: 'Write-Ahead Logging for better concurrency' }, { id: 'b', text: 'A security feature' }, { id: 'c', text: 'A compression mode' }, { id: 'd', text: 'A backup system' }] },
      { id: 'q3', question: 'When should you use SQLite?', correctAnswer: 'c', options: [{ id: 'a', text: 'High-concurrency web apps' }, { id: 'b', text: 'Distributed systems' }, { id: 'c', text: 'Mobile apps, desktop apps, prototypes' }, { id: 'd', text: 'Large-scale analytics' }] },
      { id: 'q4', question: 'What is the maximum database size for SQLite?', correctAnswer: 'b', options: [{ id: 'a', text: '1 GB' }, { id: 'b', text: '281 TB' }, { id: 'c', text: '10 GB' }, { id: 'd', text: 'Unlimited' }] },
      { id: 'q5', question: 'How do you create an index in SQLite?', correctAnswer: 'a', options: [{ id: 'a', text: 'CREATE INDEX idx ON table(column)' }, { id: 'b', text: 'ADD INDEX idx TO table.column' }, { id: 'c', text: 'INDEX table(column)' }, { id: 'd', text: 'table.createIndex(column)' }] },
      { id: 'q6', question: 'What is a transaction in SQLite?', correctAnswer: 'c', options: [{ id: 'a', text: 'A single query' }, { id: 'b', text: 'A database backup' }, { id: 'c', text: 'A group of operations that succeed or fail together' }, { id: 'd', text: 'A connection' }] },
      { id: 'q7', question: 'What command starts a transaction?', correctAnswer: 'b', options: [{ id: 'a', text: 'START TRANSACTION' }, { id: 'b', text: 'BEGIN' }, { id: 'c', text: 'TRANSACTION START' }, { id: 'd', text: 'OPEN TRANSACTION' }] },
      { id: 'q8', question: 'What is the SQLite data type system?', correctAnswer: 'a', options: [{ id: 'a', text: 'Dynamic typing with type affinity' }, { id: 'b', text: 'Strict static typing' }, { id: 'c', text: 'No types' }, { id: 'd', text: 'Same as PostgreSQL' }] },
      { id: 'q9', question: 'How do you backup a SQLite database?', correctAnswer: 'd', options: [{ id: 'a', text: 'BACKUP command' }, { id: 'b', text: 'mysqldump' }, { id: 'c', text: 'pg_dump' }, { id: 'd', text: 'Copy the file or use .backup command' }] },
      { id: 'q10', question: 'What is VACUUM in SQLite?', correctAnswer: 'c', options: [{ id: 'a', text: 'Delete all data' }, { id: 'b', text: 'Clear cache' }, { id: 'c', text: 'Rebuild database to reclaim space' }, { id: 'd', text: 'Optimize queries' }] }
    ]
  },
  postgresql: {
    title: 'PostgreSQL',
    description: 'Questions on advanced SQL, JSONB, indexes, transactions, and PostgreSQL patterns.',
    questions: [
      { id: 'q1', question: 'What is PostgreSQL known for?', correctAnswer: 'b', options: [{ id: 'a', text: 'Being the simplest database' }, { id: 'b', text: 'Advanced features, extensibility, and standards compliance' }, { id: 'c', text: 'Being the fastest' }, { id: 'd', text: 'NoSQL support only' }] },
      { id: 'q2', question: 'What is JSONB in PostgreSQL?', correctAnswer: 'a', options: [{ id: 'a', text: 'Binary JSON format with indexing support' }, { id: 'b', text: 'Regular JSON string' }, { id: 'c', text: 'JSON backup' }, { id: 'd', text: 'JSON schema' }] },
      { id: 'q3', question: 'What is a CTE (Common Table Expression)?', correctAnswer: 'c', options: [{ id: 'a', text: 'A stored procedure' }, { id: 'b', text: 'A table type' }, { id: 'c', text: 'A named temporary result set using WITH clause' }, { id: 'd', text: 'A constraint' }] },
      { id: 'q4', question: 'What index type is best for full-text search?', correctAnswer: 'b', options: [{ id: 'a', text: 'B-tree' }, { id: 'b', text: 'GIN' }, { id: 'c', text: 'Hash' }, { id: 'd', text: 'BRIN' }] },
      { id: 'q5', question: 'What is MVCC in PostgreSQL?', correctAnswer: 'a', options: [{ id: 'a', text: 'Multi-Version Concurrency Control for isolation' }, { id: 'b', text: 'Multi-Value Column Constraint' }, { id: 'c', text: 'A backup system' }, { id: 'd', text: 'A replication method' }] },
      { id: 'q6', question: 'What is the EXPLAIN command used for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Documenting tables' }, { id: 'b', text: 'Creating indexes' }, { id: 'c', text: 'Showing query execution plan' }, { id: 'd', text: 'Explaining errors' }] },
      { id: 'q7', question: 'What is a materialized view?', correctAnswer: 'b', options: [{ id: 'a', text: 'A regular view' }, { id: 'b', text: 'A view that stores query results physically' }, { id: 'c', text: 'A table backup' }, { id: 'd', text: 'A temporary table' }] },
      { id: 'q8', question: 'What does SERIAL do in column definition?', correctAnswer: 'a', options: [{ id: 'a', text: 'Creates auto-incrementing integer' }, { id: 'b', text: 'Adds unique constraint' }, { id: 'c', text: 'Creates a sequence' }, { id: 'd', text: 'Encrypts the column' }] },
      { id: 'q9', question: 'What is pg_dump used for?', correctAnswer: 'd', options: [{ id: 'a', text: 'Monitoring queries' }, { id: 'b', text: 'Optimizing tables' }, { id: 'c', text: 'Killing connections' }, { id: 'd', text: 'Creating database backups' }] },
      { id: 'q10', question: 'What is a foreign key?', correctAnswer: 'c', options: [{ id: 'a', text: 'A primary key from another database' }, { id: 'b', text: 'An external API connection' }, { id: 'c', text: 'A column that references another table primary key' }, { id: 'd', text: 'A unique index' }] }
    ]
  },
  mongodb: {
    title: 'MongoDB',
    description: 'Questions on documents, aggregation, indexes, and MongoDB patterns.',
    questions: [
      { id: 'q1', question: 'What type of database is MongoDB?', correctAnswer: 'b', options: [{ id: 'a', text: 'Relational' }, { id: 'b', text: 'Document-oriented NoSQL' }, { id: 'c', text: 'Graph' }, { id: 'd', text: 'Key-value' }] },
      { id: 'q2', question: 'What format does MongoDB use to store data?', correctAnswer: 'a', options: [{ id: 'a', text: 'BSON (Binary JSON)' }, { id: 'b', text: 'XML' }, { id: 'c', text: 'CSV' }, { id: 'd', text: 'Plain JSON' }] },
      { id: 'q3', question: 'What is a collection in MongoDB?', correctAnswer: 'c', options: [{ id: 'a', text: 'A database' }, { id: 'b', text: 'An index' }, { id: 'c', text: 'Equivalent to a table in SQL' }, { id: 'd', text: 'A query result' }] },
      { id: 'q4', question: 'What is the aggregation pipeline?', correctAnswer: 'b', options: [{ id: 'a', text: 'A data import tool' }, { id: 'b', text: 'A framework for data transformation using stages' }, { id: 'c', text: 'A backup system' }, { id: 'd', text: 'A replication feature' }] },
      { id: 'q5', question: 'What is the _id field?', correctAnswer: 'a', options: [{ id: 'a', text: 'Auto-generated unique identifier for documents' }, { id: 'b', text: 'Optional user-defined field' }, { id: 'c', text: 'A timestamp' }, { id: 'd', text: 'An index name' }] },
      { id: 'q6', question: 'What does $match do in aggregation?', correctAnswer: 'c', options: [{ id: 'a', text: 'Joins collections' }, { id: 'b', text: 'Groups documents' }, { id: 'c', text: 'Filters documents like find()' }, { id: 'd', text: 'Sorts documents' }] },
      { id: 'q7', question: 'What is sharding in MongoDB?', correctAnswer: 'b', options: [{ id: 'a', text: 'Data compression' }, { id: 'b', text: 'Horizontal scaling by distributing data across machines' }, { id: 'c', text: 'Data encryption' }, { id: 'd', text: 'Index optimization' }] },
      { id: 'q8', question: 'What is a replica set?', correctAnswer: 'a', options: [{ id: 'a', text: 'Group of mongod instances maintaining same data' }, { id: 'b', text: 'A backup file' }, { id: 'c', text: 'A query cache' }, { id: 'd', text: 'A schema definition' }] },
      { id: 'q9', question: 'How do you create an index in MongoDB?', correctAnswer: 'd', options: [{ id: 'a', text: 'ADD INDEX' }, { id: 'b', text: 'INDEX.create()' }, { id: 'c', text: 'db.index()' }, { id: 'd', text: 'db.collection.createIndex()' }] },
      { id: 'q10', question: 'What is an embedded document?', correctAnswer: 'c', options: [{ id: 'a', text: 'A reference to another collection' }, { id: 'b', text: 'A binary attachment' }, { id: 'c', text: 'A document nested inside another document' }, { id: 'd', text: 'An external file' }] }
    ]
  },
  redis: {
    title: 'Redis',
    description: 'Questions on data structures, caching, pub/sub, and Redis patterns.',
    questions: [
      { id: 'q1', question: 'What is Redis primarily used for?', correctAnswer: 'b', options: [{ id: 'a', text: 'Long-term storage' }, { id: 'b', text: 'In-memory caching and real-time data' }, { id: 'c', text: 'File storage' }, { id: 'd', text: 'Document storage' }] },
      { id: 'q2', question: 'What data structures does Redis support?', correctAnswer: 'a', options: [{ id: 'a', text: 'Strings, Lists, Sets, Hashes, Sorted Sets' }, { id: 'b', text: 'Only strings' }, { id: 'c', text: 'Only JSON' }, { id: 'd', text: 'Only key-value' }] },
      { id: 'q3', question: 'What is TTL in Redis?', correctAnswer: 'c', options: [{ id: 'a', text: 'Total Transaction Log' }, { id: 'b', text: 'Type Token List' }, { id: 'c', text: 'Time To Live - expiration time for keys' }, { id: 'd', text: 'Transaction Type Label' }] },
      { id: 'q4', question: 'What is Redis pub/sub?', correctAnswer: 'b', options: [{ id: 'a', text: 'A database backup feature' }, { id: 'b', text: 'Publish/Subscribe messaging pattern' }, { id: 'c', text: 'A security feature' }, { id: 'd', text: 'A replication method' }] },
      { id: 'q5', question: 'What command sets a key with expiration?', correctAnswer: 'a', options: [{ id: 'a', text: 'SETEX key seconds value' }, { id: 'b', text: 'SET key value EXPIRE seconds' }, { id: 'c', text: 'PUT key value TTL seconds' }, { id: 'd', text: 'INSERT key value TIMEOUT seconds' }] },
      { id: 'q6', question: 'What is a Redis hash?', correctAnswer: 'c', options: [{ id: 'a', text: 'A checksum' }, { id: 'b', text: 'An encryption method' }, { id: 'c', text: 'A map of field-value pairs' }, { id: 'd', text: 'A unique identifier' }] },
      { id: 'q7', question: 'What is Redis persistence?', correctAnswer: 'b', options: [{ id: 'a', text: 'Connection pooling' }, { id: 'b', text: 'Saving in-memory data to disk (RDB/AOF)' }, { id: 'c', text: 'Session management' }, { id: 'd', text: 'Cache invalidation' }] },
      { id: 'q8', question: 'What is a sorted set in Redis?', correctAnswer: 'a', options: [{ id: 'a', text: 'Set where each member has a score for ordering' }, { id: 'b', text: 'An alphabetically sorted list' }, { id: 'c', text: 'A sorted array' }, { id: 'd', text: 'A priority queue' }] },
      { id: 'q9', question: 'What is Redis Cluster?', correctAnswer: 'd', options: [{ id: 'a', text: 'A backup system' }, { id: 'b', text: 'A monitoring tool' }, { id: 'c', text: 'A client library' }, { id: 'd', text: 'Distributed Redis with automatic sharding' }] },
      { id: 'q10', question: 'What is cache-aside pattern?', correctAnswer: 'c', options: [{ id: 'a', text: 'Caching on a separate server' }, { id: 'b', text: 'Ignoring the cache' }, { id: 'c', text: 'App checks cache first, then database if miss' }, { id: 'd', text: 'Writing to cache and database simultaneously' }] }
    ]
  },
  memcached: {
    title: 'Memcached',
    description: 'Questions on distributed caching, memory management, and Memcached patterns.',
    questions: [
      { id: 'q1', question: 'What is Memcached?', correctAnswer: 'b', options: [{ id: 'a', text: 'A database' }, { id: 'b', text: 'A distributed memory caching system' }, { id: 'c', text: 'A message queue' }, { id: 'd', text: 'A file cache' }] },
      { id: 'q2', question: 'What data structure does Memcached use?', correctAnswer: 'a', options: [{ id: 'a', text: 'Simple key-value hash table' }, { id: 'b', text: 'Trees and graphs' }, { id: 'c', text: 'Documents' }, { id: 'd', text: 'Tables' }] },
      { id: 'q3', question: 'What is slab allocation?', correctAnswer: 'c', options: [{ id: 'a', text: 'Disk partitioning' }, { id: 'b', text: 'Network allocation' }, { id: 'c', text: 'Memory management dividing memory into chunks' }, { id: 'd', text: 'CPU scheduling' }] },
      { id: 'q4', question: 'What is CAS in Memcached?', correctAnswer: 'b', options: [{ id: 'a', text: 'Cache And Store' }, { id: 'b', text: 'Check And Set - optimistic locking' }, { id: 'c', text: 'Create And Save' }, { id: 'd', text: 'Cache Access Speed' }] },
      { id: 'q5', question: 'How does Memcached handle full memory?', correctAnswer: 'a', options: [{ id: 'a', text: 'LRU eviction - removes least recently used' }, { id: 'b', text: 'Crashes' }, { id: 'c', text: 'Writes to disk' }, { id: 'd', text: 'Rejects new writes' }] },
      { id: 'q6', question: 'What is consistent hashing?', correctAnswer: 'c', options: [{ id: 'a', text: 'A security feature' }, { id: 'b', text: 'Data encryption' }, { id: 'c', text: 'Distribution algorithm minimizing remapping on server changes' }, { id: 'd', text: 'A backup method' }] },
      { id: 'q7', question: 'What is the maximum value size in Memcached?', correctAnswer: 'b', options: [{ id: 'a', text: '256 KB' }, { id: 'b', text: '1 MB (default)' }, { id: 'c', text: '10 MB' }, { id: 'd', text: 'Unlimited' }] },
      { id: 'q8', question: 'What is the difference between Memcached and Redis?', correctAnswer: 'a', options: [{ id: 'a', text: 'Memcached is simpler, Redis has more data structures' }, { id: 'b', text: 'They are identical' }, { id: 'c', text: 'Memcached is newer' }, { id: 'd', text: 'Redis is only for caching' }] },
      { id: 'q9', question: 'What is cache stampede?', correctAnswer: 'd', options: [{ id: 'a', text: 'Cache overflow' }, { id: 'b', text: 'Memory leak' }, { id: 'c', text: 'Network congestion' }, { id: 'd', text: 'Many requests hitting database when cache expires' }] },
      { id: 'q10', question: 'Is Memcached data persistent?', correctAnswer: 'c', options: [{ id: 'a', text: 'Yes, always' }, { id: 'b', text: 'Yes, with configuration' }, { id: 'c', text: 'No, it is purely in-memory' }, { id: 'd', text: 'Only with plugins' }] }
    ]
  },
  docker: {
    title: 'Docker',
    description: 'Questions on containers, images, Dockerfiles, and container orchestration basics.',
    questions: [
      { id: 'q1', question: 'What is Docker?', correctAnswer: 'b', options: [{ id: 'a', text: 'A virtual machine' }, { id: 'b', text: 'A platform for building and running containers' }, { id: 'c', text: 'An operating system' }, { id: 'd', text: 'A programming language' }] },
      { id: 'q2', question: 'What is the difference between a container and a VM?', correctAnswer: 'a', options: [{ id: 'a', text: 'Containers share the host OS kernel, VMs have their own' }, { id: 'b', text: 'They are the same' }, { id: 'c', text: 'VMs are faster' }, { id: 'd', text: 'Containers need more resources' }] },
      { id: 'q3', question: 'What is a Docker image?', correctAnswer: 'c', options: [{ id: 'a', text: 'A running process' }, { id: 'b', text: 'A virtual disk' }, { id: 'c', text: 'A read-only template for creating containers' }, { id: 'd', text: 'A configuration file' }] },
      { id: 'q4', question: 'What is a Dockerfile?', correctAnswer: 'b', options: [{ id: 'a', text: 'A running container' }, { id: 'b', text: 'Instructions for building an image' }, { id: 'c', text: 'A Docker configuration' }, { id: 'd', text: 'A log file' }] },
      { id: 'q5', question: 'What does docker-compose do?', correctAnswer: 'a', options: [{ id: 'a', text: 'Defines and runs multi-container applications' }, { id: 'b', text: 'Compresses images' }, { id: 'c', text: 'Composes Dockerfiles' }, { id: 'd', text: 'Monitors containers' }] },
      { id: 'q6', question: 'What is a Docker volume?', correctAnswer: 'c', options: [{ id: 'a', text: 'Container memory' }, { id: 'b', text: 'Network storage' }, { id: 'c', text: 'Persistent storage that survives container restarts' }, { id: 'd', text: 'Temporary files' }] },
      { id: 'q7', question: 'What is the CMD instruction in Dockerfile?', correctAnswer: 'b', options: [{ id: 'a', text: 'Copies files' }, { id: 'b', text: 'Default command when container starts' }, { id: 'c', text: 'Installs packages' }, { id: 'd', text: 'Sets environment variables' }] },
      { id: 'q8', question: 'What is a multi-stage build?', correctAnswer: 'a', options: [{ id: 'a', text: 'Using multiple FROM statements to reduce image size' }, { id: 'b', text: 'Building multiple containers' }, { id: 'c', text: 'Running multiple commands' }, { id: 'd', text: 'A testing strategy' }] },
      { id: 'q9', question: 'What is Docker Hub?', correctAnswer: 'd', options: [{ id: 'a', text: 'A container runtime' }, { id: 'b', text: 'A build tool' }, { id: 'c', text: 'A monitoring service' }, { id: 'd', text: 'A registry for sharing Docker images' }] },
      { id: 'q10', question: 'What does EXPOSE do in Dockerfile?', correctAnswer: 'c', options: [{ id: 'a', text: 'Opens firewall ports' }, { id: 'b', text: 'Publishes ports automatically' }, { id: 'c', text: 'Documents which ports the container listens on' }, { id: 'd', text: 'Exposes environment variables' }] }
    ]
  },
  kubernetes: {
    title: 'Kubernetes',
    description: 'Questions on pods, services, deployments, and container orchestration.',
    questions: [
      { id: 'q1', question: 'What is Kubernetes?', correctAnswer: 'b', options: [{ id: 'a', text: 'A container runtime' }, { id: 'b', text: 'A container orchestration platform' }, { id: 'c', text: 'A CI/CD tool' }, { id: 'd', text: 'A monitoring system' }] },
      { id: 'q2', question: 'What is a Pod in Kubernetes?', correctAnswer: 'a', options: [{ id: 'a', text: 'Smallest deployable unit, one or more containers' }, { id: 'b', text: 'A cluster' }, { id: 'c', text: 'A node' }, { id: 'd', text: 'A network' }] },
      { id: 'q3', question: 'What is a Deployment?', correctAnswer: 'c', options: [{ id: 'a', text: 'A single container' }, { id: 'b', text: 'A network policy' }, { id: 'c', text: 'Manages ReplicaSets and provides declarative updates' }, { id: 'd', text: 'A storage class' }] },
      { id: 'q4', question: 'What is a Service in Kubernetes?', correctAnswer: 'b', options: [{ id: 'a', text: 'A background process' }, { id: 'b', text: 'Stable network endpoint for accessing pods' }, { id: 'c', text: 'A daemon' }, { id: 'd', text: 'A container image' }] },
      { id: 'q5', question: 'What is kubectl?', correctAnswer: 'a', options: [{ id: 'a', text: 'CLI tool for interacting with Kubernetes' }, { id: 'b', text: 'A container runtime' }, { id: 'c', text: 'A package manager' }, { id: 'd', text: 'A monitoring tool' }] },
      { id: 'q6', question: 'What is a ConfigMap?', correctAnswer: 'c', options: [{ id: 'a', text: 'A network configuration' }, { id: 'b', text: 'A storage configuration' }, { id: 'c', text: 'Stores non-sensitive configuration data' }, { id: 'd', text: 'A mapping of containers' }] },
      { id: 'q7', question: 'What is a Secret in Kubernetes?', correctAnswer: 'b', options: [{ id: 'a', text: 'Encrypted storage' }, { id: 'b', text: 'Stores sensitive data like passwords and tokens' }, { id: 'c', text: 'A private network' }, { id: 'd', text: 'An access control list' }] },
      { id: 'q8', question: 'What is an Ingress?', correctAnswer: 'a', options: [{ id: 'a', text: 'Manages external access to services, typically HTTP' }, { id: 'b', text: 'Internal pod communication' }, { id: 'c', text: 'A logging system' }, { id: 'd', text: 'A database connection' }] },
      { id: 'q9', question: 'What is a namespace?', correctAnswer: 'd', options: [{ id: 'a', text: 'A DNS record' }, { id: 'b', text: 'A container name' }, { id: 'c', text: 'A cluster name' }, { id: 'd', text: 'Virtual cluster for resource isolation' }] },
      { id: 'q10', question: 'What does kubectl apply do?', correctAnswer: 'c', options: [{ id: 'a', text: 'Deletes resources' }, { id: 'b', text: 'Lists resources' }, { id: 'c', text: 'Creates or updates resources from a file' }, { id: 'd', text: 'Restarts pods' }] }
    ]
  },
  aws: {
    title: 'AWS',
    description: 'Questions on core AWS services, IAM, networking, and cloud architecture.',
    questions: [
      { id: 'q1', question: 'What is EC2?', correctAnswer: 'b', options: [{ id: 'a', text: 'A database service' }, { id: 'b', text: 'Virtual servers in the cloud' }, { id: 'c', text: 'A storage service' }, { id: 'd', text: 'A messaging service' }] },
      { id: 'q2', question: 'What is S3?', correctAnswer: 'a', options: [{ id: 'a', text: 'Object storage service' }, { id: 'b', text: 'Compute service' }, { id: 'c', text: 'Database service' }, { id: 'd', text: 'Networking service' }] },
      { id: 'q3', question: 'What is IAM?', correctAnswer: 'c', options: [{ id: 'a', text: 'Instance Access Manager' }, { id: 'b', text: 'Internet Access Module' }, { id: 'c', text: 'Identity and Access Management' }, { id: 'd', text: 'Integrated Application Manager' }] },
      { id: 'q4', question: 'What is a VPC?', correctAnswer: 'b', options: [{ id: 'a', text: 'Virtual Private Cluster' }, { id: 'b', text: 'Virtual Private Cloud - isolated network' }, { id: 'c', text: 'Virtual Processing Center' }, { id: 'd', text: 'Virtual Platform Container' }] },
      { id: 'q5', question: 'What is Lambda?', correctAnswer: 'a', options: [{ id: 'a', text: 'Serverless compute service' }, { id: 'b', text: 'Database service' }, { id: 'c', text: 'Storage service' }, { id: 'd', text: 'Networking service' }] },
      { id: 'q6', question: 'What is an availability zone?', correctAnswer: 'c', options: [{ id: 'a', text: 'A geographic region' }, { id: 'b', text: 'A data center' }, { id: 'c', text: 'Isolated location within a region' }, { id: 'd', text: 'A network segment' }] },
      { id: 'q7', question: 'What is RDS?', correctAnswer: 'b', options: [{ id: 'a', text: 'Relational Data Storage' }, { id: 'b', text: 'Managed relational database service' }, { id: 'c', text: 'Remote Data Service' }, { id: 'd', text: 'Resource Distribution System' }] },
      { id: 'q8', question: 'What is CloudFormation?', correctAnswer: 'a', options: [{ id: 'a', text: 'Infrastructure as Code service' }, { id: 'b', text: 'CDN service' }, { id: 'c', text: 'Monitoring service' }, { id: 'd', text: 'Security service' }] },
      { id: 'q9', question: 'What is the shared responsibility model?', correctAnswer: 'd', options: [{ id: 'a', text: 'Cost sharing between accounts' }, { id: 'b', text: 'Multi-tenant architecture' }, { id: 'c', text: 'Team access model' }, { id: 'd', text: 'AWS manages infrastructure, customer manages their data/apps' }] },
      { id: 'q10', question: 'What is Route 53?', correctAnswer: 'c', options: [{ id: 'a', text: 'A routing service' }, { id: 'b', text: 'A VPN service' }, { id: 'c', text: 'DNS and domain registration service' }, { id: 'd', text: 'A load balancer' }] }
    ]
  },
  kafka: {
    title: 'Apache Kafka',
    description: 'Questions on event streaming, topics, partitions, and distributed messaging.',
    questions: [
      { id: 'q1', question: 'What is Apache Kafka?', correctAnswer: 'b', options: [{ id: 'a', text: 'A database' }, { id: 'b', text: 'A distributed event streaming platform' }, { id: 'c', text: 'A web server' }, { id: 'd', text: 'A container runtime' }] },
      { id: 'q2', question: 'What is a Kafka topic?', correctAnswer: 'a', options: [{ id: 'a', text: 'A category for organizing messages' }, { id: 'b', text: 'A database table' }, { id: 'c', text: 'A consumer group' }, { id: 'd', text: 'A broker' }] },
      { id: 'q3', question: 'What is a partition?', correctAnswer: 'c', options: [{ id: 'a', text: 'A database shard' }, { id: 'b', text: 'A consumer' }, { id: 'c', text: 'Ordered, immutable sequence of messages within a topic' }, { id: 'd', text: 'A broker group' }] },
      { id: 'q4', question: 'What is a Kafka broker?', correctAnswer: 'b', options: [{ id: 'a', text: 'A message producer' }, { id: 'b', text: 'A server that stores and serves messages' }, { id: 'c', text: 'A consumer group' }, { id: 'd', text: 'A topic' }] },
      { id: 'q5', question: 'What is a consumer group?', correctAnswer: 'a', options: [{ id: 'a', text: 'Multiple consumers sharing partition reads' }, { id: 'b', text: 'A group of topics' }, { id: 'c', text: 'A cluster of brokers' }, { id: 'd', text: 'A producer pool' }] },
      { id: 'q6', question: 'What is the commit log in Kafka?', correctAnswer: 'c', options: [{ id: 'a', text: 'Git commit history' }, { id: 'b', text: 'Transaction log' }, { id: 'c', text: 'Append-only data structure for messages' }, { id: 'd', text: 'Error log' }] },
      { id: 'q7', question: 'What is message retention in Kafka?', correctAnswer: 'b', options: [{ id: 'a', text: 'Message acknowledgment' }, { id: 'b', text: 'How long messages are kept before deletion' }, { id: 'c', text: 'Message compression' }, { id: 'd', text: 'Message encryption' }] },
      { id: 'q8', question: 'What is a Kafka producer?', correctAnswer: 'a', options: [{ id: 'a', text: 'Application that publishes messages to topics' }, { id: 'b', text: 'A broker' }, { id: 'c', text: 'A partition' }, { id: 'd', text: 'A consumer' }] },
      { id: 'q9', question: 'What guarantees does Kafka provide?', correctAnswer: 'd', options: [{ id: 'a', text: 'Only at-most-once' }, { id: 'b', text: 'Only at-least-once' }, { id: 'c', text: 'No guarantees' }, { id: 'd', text: 'Configurable: at-most-once, at-least-once, exactly-once' }] },
      { id: 'q10', question: 'What is ZooKeeper used for in Kafka?', correctAnswer: 'c', options: [{ id: 'a', text: 'Message storage' }, { id: 'b', text: 'Consumer management' }, { id: 'c', text: 'Cluster coordination and metadata (being replaced by KRaft)' }, { id: 'd', text: 'Message serialization' }] }
    ]
  },
  go: {
    title: 'Go',
    description: 'Questions on goroutines, channels, interfaces, and Go patterns.',
    questions: [
      { id: 'q1', question: 'What is Go known for?', correctAnswer: 'b', options: [{ id: 'a', text: 'Object-oriented programming' }, { id: 'b', text: 'Simplicity, fast compilation, and built-in concurrency' }, { id: 'c', text: 'Functional programming' }, { id: 'd', text: 'Dynamic typing' }] },
      { id: 'q2', question: 'What is a goroutine?', correctAnswer: 'a', options: [{ id: 'a', text: 'A lightweight thread managed by Go runtime' }, { id: 'b', text: 'A function type' }, { id: 'c', text: 'An interface' }, { id: 'd', text: 'A package' }] },
      { id: 'q3', question: 'What is a channel in Go?', correctAnswer: 'c', options: [{ id: 'a', text: 'A file descriptor' }, { id: 'b', text: 'A network connection' }, { id: 'c', text: 'A typed conduit for communication between goroutines' }, { id: 'd', text: 'A buffer' }] },
      { id: 'q4', question: 'How do you start a goroutine?', correctAnswer: 'b', options: [{ id: 'a', text: 'goroutine func()' }, { id: 'b', text: 'go func()' }, { id: 'c', text: 'async func()' }, { id: 'd', text: 'thread func()' }] },
      { id: 'q5', question: 'What is an interface in Go?', correctAnswer: 'a', options: [{ id: 'a', text: 'A set of method signatures that a type can implement' }, { id: 'b', text: 'A class definition' }, { id: 'c', text: 'A struct' }, { id: 'd', text: 'A package' }] },
      { id: 'q6', question: 'What is defer used for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Delaying variable initialization' }, { id: 'b', text: 'Error handling' }, { id: 'c', text: 'Scheduling function call to run when function returns' }, { id: 'd', text: 'Creating goroutines' }] },
      { id: 'q7', question: 'How does Go handle errors?', correctAnswer: 'b', options: [{ id: 'a', text: 'Exceptions' }, { id: 'b', text: 'Returning error values explicitly' }, { id: 'c', text: 'Try/catch blocks' }, { id: 'd', text: 'Error callbacks' }] },
      { id: 'q8', question: 'What is a slice in Go?', correctAnswer: 'a', options: [{ id: 'a', text: 'A dynamic, flexible view into an array' }, { id: 'b', text: 'A string operation' }, { id: 'c', text: 'A fixed-size array' }, { id: 'd', text: 'A map type' }] },
      { id: 'q9', question: 'What does select do?', correctAnswer: 'd', options: [{ id: 'a', text: 'Database query' }, { id: 'b', text: 'File selection' }, { id: 'c', text: 'Type selection' }, { id: 'd', text: 'Waits on multiple channel operations' }] },
      { id: 'q10', question: 'What is the zero value in Go?', correctAnswer: 'c', options: [{ id: 'a', text: 'null' }, { id: 'b', text: 'undefined' }, { id: 'c', text: 'Default value for a type (0, "", nil, false)' }, { id: 'd', text: 'An error state' }] }
    ]
  },
  rust: {
    title: 'Rust',
    description: 'Questions on ownership, borrowing, lifetimes, and memory safety.',
    questions: [
      { id: 'q1', question: 'What is Rust known for?', correctAnswer: 'b', options: [{ id: 'a', text: 'Garbage collection' }, { id: 'b', text: 'Memory safety without garbage collection' }, { id: 'c', text: 'Dynamic typing' }, { id: 'd', text: 'Interpreted execution' }] },
      { id: 'q2', question: 'What is ownership in Rust?', correctAnswer: 'a', options: [{ id: 'a', text: 'Each value has one owner, dropped when owner goes out of scope' }, { id: 'b', text: 'Reference counting' }, { id: 'c', text: 'Garbage collection' }, { id: 'd', text: 'Manual memory management' }] },
      { id: 'q3', question: 'What is borrowing in Rust?', correctAnswer: 'c', options: [{ id: 'a', text: 'Copying values' }, { id: 'b', text: 'Moving values' }, { id: 'c', text: 'Referencing data without taking ownership' }, { id: 'd', text: 'Allocating memory' }] },
      { id: 'q4', question: 'What is a lifetime in Rust?', correctAnswer: 'b', options: [{ id: 'a', text: 'How long a program runs' }, { id: 'b', text: 'Scope during which a reference is valid' }, { id: 'c', text: 'Memory allocation duration' }, { id: 'd', text: 'Thread duration' }] },
      { id: 'q5', question: 'What is the borrow checker?', correctAnswer: 'a', options: [{ id: 'a', text: 'Compiler component that enforces borrowing rules' }, { id: 'b', text: 'A runtime check' }, { id: 'c', text: 'A testing tool' }, { id: 'd', text: 'A linter' }] },
      { id: 'q6', question: 'What is Result<T, E> in Rust?', correctAnswer: 'c', options: [{ id: 'a', text: 'A boolean type' }, { id: 'b', text: 'A null type' }, { id: 'c', text: 'An enum for recoverable errors (Ok or Err)' }, { id: 'd', text: 'A collection type' }] },
      { id: 'q7', question: 'What is Option<T> in Rust?', correctAnswer: 'b', options: [{ id: 'a', text: 'Configuration settings' }, { id: 'b', text: 'An enum representing presence (Some) or absence (None) of value' }, { id: 'c', text: 'A boolean wrapper' }, { id: 'd', text: 'A command line parser' }] },
      { id: 'q8', question: 'What is a trait in Rust?', correctAnswer: 'a', options: [{ id: 'a', text: 'Shared behavior definition (like interfaces)' }, { id: 'b', text: 'A data type' }, { id: 'c', text: 'A module' }, { id: 'd', text: 'A macro' }] },
      { id: 'q9', question: 'What does mut mean?', correctAnswer: 'd', options: [{ id: 'a', text: 'Multiple' }, { id: 'b', text: 'Mutex' }, { id: 'c', text: 'Thread-safe' }, { id: 'd', text: 'Mutable - allows modification' }] },
      { id: 'q10', question: 'What is cargo?', correctAnswer: 'c', options: [{ id: 'a', text: 'A container runtime' }, { id: 'b', text: 'A version control system' }, { id: 'c', text: 'Rust build system and package manager' }, { id: 'd', text: 'A testing framework' }] }
    ]
  },
  cpp: {
    title: 'C++',
    description: 'Questions on memory management, OOP, templates, and modern C++ features.',
    questions: [
      { id: 'q1', question: 'What is C++ known for?', correctAnswer: 'b', options: [{ id: 'a', text: 'Garbage collection' }, { id: 'b', text: 'Performance and low-level memory control' }, { id: 'c', text: 'Simplicity' }, { id: 'd', text: 'Web development' }] },
      { id: 'q2', question: 'What is RAII in C++?', correctAnswer: 'a', options: [{ id: 'a', text: 'Resource Acquisition Is Initialization - tie resource lifetime to object lifetime' }, { id: 'b', text: 'A design pattern' }, { id: 'c', text: 'A memory allocator' }, { id: 'd', text: 'A compiler optimization' }] },
      { id: 'q3', question: 'What is a smart pointer?', correctAnswer: 'c', options: [{ id: 'a', text: 'A faster pointer' }, { id: 'b', text: 'A pointer to smart objects' }, { id: 'c', text: 'A class that manages pointer lifetime (unique_ptr, shared_ptr)' }, { id: 'd', text: 'A debugger feature' }] },
      { id: 'q4', question: 'What is the difference between new and malloc?', correctAnswer: 'b', options: [{ id: 'a', text: 'They are the same' }, { id: 'b', text: 'new calls constructor, malloc just allocates memory' }, { id: 'c', text: 'malloc is faster' }, { id: 'd', text: 'new is for arrays only' }] },
      { id: 'q5', question: 'What is a template in C++?', correctAnswer: 'a', options: [{ id: 'a', text: 'Generic programming feature for type-parameterized code' }, { id: 'b', text: 'A design pattern' }, { id: 'c', text: 'A macro' }, { id: 'd', text: 'A class type' }] },
      { id: 'q6', question: 'What is move semantics?', correctAnswer: 'c', options: [{ id: 'a', text: 'Moving files' }, { id: 'b', text: 'Object relocation' }, { id: 'c', text: 'Transferring resources without copying (using &&)' }, { id: 'd', text: 'Memory defragmentation' }] },
      { id: 'q7', question: 'What is the STL?', correctAnswer: 'b', options: [{ id: 'a', text: 'Simple Template Library' }, { id: 'b', text: 'Standard Template Library - containers, algorithms, iterators' }, { id: 'c', text: 'System Template Layer' }, { id: 'd', text: 'Static Type Library' }] },
      { id: 'q8', question: 'What is virtual in C++?', correctAnswer: 'a', options: [{ id: 'a', text: 'Enables polymorphism - function can be overridden' }, { id: 'b', text: 'Creates virtual memory' }, { id: 'c', text: 'Makes variable global' }, { id: 'd', text: 'Defines abstract class' }] },
      { id: 'q9', question: 'What is a reference in C++?', correctAnswer: 'd', options: [{ id: 'a', text: 'Same as a pointer' }, { id: 'b', text: 'A copy of a value' }, { id: 'c', text: 'A null-safe pointer' }, { id: 'd', text: 'An alias for an existing variable' }] },
      { id: 'q10', question: 'What is const correctness?', correctAnswer: 'c', options: [{ id: 'a', text: 'Using only constant values' }, { id: 'b', text: 'A naming convention' }, { id: 'c', text: 'Properly marking what should not be modified as const' }, { id: 'd', text: 'A compilation mode' }] }
    ]
  },
  webassembly: {
    title: 'WebAssembly',
    description: 'Questions on Wasm modules, performance, and browser integration.',
    questions: [
      { id: 'q1', question: 'What is WebAssembly?', correctAnswer: 'b', options: [{ id: 'a', text: 'A JavaScript framework' }, { id: 'b', text: 'Binary instruction format for near-native performance in browsers' }, { id: 'c', text: 'A web server' }, { id: 'd', text: 'An assembly language' }] },
      { id: 'q2', question: 'What languages can compile to WebAssembly?', correctAnswer: 'a', options: [{ id: 'a', text: 'C, C++, Rust, Go, and many others' }, { id: 'b', text: 'Only JavaScript' }, { id: 'c', text: 'Only C++' }, { id: 'd', text: 'Only Rust' }] },
      { id: 'q3', question: 'What is the file extension for WebAssembly?', correctAnswer: 'c', options: [{ id: 'a', text: '.web' }, { id: 'b', text: '.asm' }, { id: 'c', text: '.wasm' }, { id: 'd', text: '.wa' }] },
      { id: 'q4', question: 'Can WebAssembly access the DOM directly?', correctAnswer: 'b', options: [{ id: 'a', text: 'Yes, full access' }, { id: 'b', text: 'No, it must go through JavaScript' }, { id: 'c', text: 'Only read access' }, { id: 'd', text: 'Only in Chrome' }] },
      { id: 'q5', question: 'What is WASI?', correctAnswer: 'a', options: [{ id: 'a', text: 'WebAssembly System Interface for running Wasm outside browsers' }, { id: 'b', text: 'Web Assembly Standard Implementation' }, { id: 'c', text: 'A debugging tool' }, { id: 'd', text: 'A compiler' }] },
      { id: 'q6', question: 'How do you load a WebAssembly module?', correctAnswer: 'c', options: [{ id: 'a', text: 'import wasm from "file.wasm"' }, { id: 'b', text: 'require("file.wasm")' }, { id: 'c', text: 'WebAssembly.instantiate() or instantiateStreaming()' }, { id: 'd', text: '<script type="wasm">' }] },
      { id: 'q7', question: 'What is linear memory in WebAssembly?', correctAnswer: 'b', options: [{ id: 'a', text: 'Stack memory' }, { id: 'b', text: 'Contiguous, resizable array of bytes' }, { id: 'c', text: 'Heap memory' }, { id: 'd', text: 'Read-only memory' }] },
      { id: 'q8', question: 'What are WebAssembly imports?', correctAnswer: 'a', options: [{ id: 'a', text: 'Functions/values provided by host environment to Wasm' }, { id: 'b', text: 'ES6 imports' }, { id: 'c', text: 'File imports' }, { id: 'd', text: 'CSS imports' }] },
      { id: 'q9', question: 'What are good use cases for WebAssembly?', correctAnswer: 'd', options: [{ id: 'a', text: 'Simple web pages' }, { id: 'b', text: 'Basic DOM manipulation' }, { id: 'c', text: 'Form validation' }, { id: 'd', text: 'Games, video editing, CAD, crypto, compression' }] },
      { id: 'q10', question: 'Is WebAssembly a replacement for JavaScript?', correctAnswer: 'c', options: [{ id: 'a', text: 'Yes, completely' }, { id: 'b', text: 'Yes, for all use cases' }, { id: 'c', text: 'No, they complement each other' }, { id: 'd', text: 'No, Wasm is deprecated' }] }
    ]
  },
  swiftui: {
    title: 'SwiftUI',
    description: 'Questions on declarative UI, state management, and SwiftUI patterns.',
    questions: [
      { id: 'q1', question: 'What is SwiftUI?', correctAnswer: 'b', options: [{ id: 'a', text: 'An imperative UI framework' }, { id: 'b', text: 'A declarative UI framework for Apple platforms' }, { id: 'c', text: 'A JavaScript framework' }, { id: 'd', text: 'A backend framework' }] },
      { id: 'q2', question: 'What is @State used for?', correctAnswer: 'a', options: [{ id: 'a', text: 'Local mutable state owned by a view' }, { id: 'b', text: 'Global state' }, { id: 'c', text: 'Network state' }, { id: 'd', text: 'Database state' }] },
      { id: 'q3', question: 'What is @Binding?', correctAnswer: 'c', options: [{ id: 'a', text: 'Connects to a database' }, { id: 'b', text: 'Creates a new state' }, { id: 'c', text: 'Two-way connection to state owned by parent' }, { id: 'd', text: 'Binds to a network request' }] },
      { id: 'q4', question: 'What is @ObservedObject?', correctAnswer: 'b', options: [{ id: 'a', text: 'Observes system events' }, { id: 'b', text: 'Watches external ObservableObject for changes' }, { id: 'c', text: 'Creates observable state' }, { id: 'd', text: 'Observes user input' }] },
      { id: 'q5', question: 'What is the body property in a View?', correctAnswer: 'a', options: [{ id: 'a', text: 'Computed property returning the view content' }, { id: 'b', text: 'The view frame' }, { id: 'c', text: 'The view controller' }, { id: 'd', text: 'The view model' }] },
      { id: 'q6', question: 'What is a modifier in SwiftUI?', correctAnswer: 'c', options: [{ id: 'a', text: 'A keyboard shortcut' }, { id: 'b', text: 'An access control keyword' }, { id: 'c', text: 'A method that returns a modified view' }, { id: 'd', text: 'A gesture handler' }] },
      { id: 'q7', question: 'What is @EnvironmentObject?', correctAnswer: 'b', options: [{ id: 'a', text: 'System environment variables' }, { id: 'b', text: 'Shared data passed through view hierarchy' }, { id: 'c', text: 'Network environment' }, { id: 'd', text: 'Build environment' }] },
      { id: 'q8', question: 'What does VStack do?', correctAnswer: 'a', options: [{ id: 'a', text: 'Arranges views vertically' }, { id: 'b', text: 'Creates a vector' }, { id: 'c', text: 'Validates views' }, { id: 'd', text: 'Creates a view model' }] },
      { id: 'q9', question: 'What is @StateObject?', correctAnswer: 'd', options: [{ id: 'a', text: 'Same as @State' }, { id: 'b', text: 'Same as @ObservedObject' }, { id: 'c', text: 'A singleton' }, { id: 'd', text: 'Creates and owns an ObservableObject' }] },
      { id: 'q10', question: 'What is the $ prefix used for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Currency formatting' }, { id: 'b', text: 'String interpolation' }, { id: 'c', text: 'Creates a Binding from a State' }, { id: 'd', text: 'Debugging' }] }
    ]
  },
  appkit: {
    title: 'AppKit',
    description: 'Questions on macOS UI development, NSView, and AppKit patterns.',
    questions: [
      { id: 'q1', question: 'What is AppKit?', correctAnswer: 'b', options: [{ id: 'a', text: 'iOS UI framework' }, { id: 'b', text: 'macOS UI framework' }, { id: 'c', text: 'A testing framework' }, { id: 'd', text: 'A database library' }] },
      { id: 'q2', question: 'What is NSView?', correctAnswer: 'a', options: [{ id: 'a', text: 'Base class for all views in AppKit' }, { id: 'b', text: 'A network view' }, { id: 'c', text: 'A SwiftUI view' }, { id: 'd', text: 'A data model' }] },
      { id: 'q3', question: 'What is NSViewController?', correctAnswer: 'c', options: [{ id: 'a', text: 'A table view' }, { id: 'b', text: 'A navigation controller' }, { id: 'c', text: 'Manages a view and handles events' }, { id: 'd', text: 'A window' }] },
      { id: 'q4', question: 'What is NSWindow?', correctAnswer: 'b', options: [{ id: 'a', text: 'A view type' }, { id: 'b', text: 'Represents a window on screen' }, { id: 'c', text: 'A window manager' }, { id: 'd', text: 'A panel' }] },
      { id: 'q5', question: 'What is the difference between AppKit and UIKit?', correctAnswer: 'a', options: [{ id: 'a', text: 'AppKit is for macOS, UIKit is for iOS' }, { id: 'b', text: 'They are the same' }, { id: 'c', text: 'AppKit is newer' }, { id: 'd', text: 'UIKit is for macOS' }] },
      { id: 'q6', question: 'What is NSApplication?', correctAnswer: 'c', options: [{ id: 'a', text: 'A view' }, { id: 'b', text: 'A window' }, { id: 'c', text: 'The application object managing app lifecycle' }, { id: 'd', text: 'A controller' }] },
      { id: 'q7', question: 'What is a responder chain in AppKit?', correctAnswer: 'b', options: [{ id: 'a', text: 'Network request chain' }, { id: 'b', text: 'Path events travel through to find handler' }, { id: 'c', text: 'View hierarchy' }, { id: 'd', text: 'Database query chain' }] },
      { id: 'q8', question: 'What is NSMenu?', correctAnswer: 'a', options: [{ id: 'a', text: 'Represents a menu (menu bar, context menu)' }, { id: 'b', text: 'A list view' }, { id: 'c', text: 'A toolbar' }, { id: 'd', text: 'A sidebar' }] },
      { id: 'q9', question: 'How do you create bindings in AppKit?', correctAnswer: 'd', options: [{ id: 'a', text: 'Using @Binding' }, { id: 'b', text: 'Using IBAction' }, { id: 'c', text: 'Using delegates' }, { id: 'd', text: 'Using Cocoa Bindings with Key-Value Observing' }] },
      { id: 'q10', question: 'What is NSTableView?', correctAnswer: 'c', options: [{ id: 'a', text: 'A database table' }, { id: 'b', text: 'A grid layout' }, { id: 'c', text: 'A view displaying data in rows and columns' }, { id: 'd', text: 'A collection view' }] }
    ]
  },
  python: {
    title: 'Python',
    description: 'Questions on Python syntax, data structures, and Python patterns.',
    questions: [
      { id: 'q1', question: 'What is Python known for?', correctAnswer: 'b', options: [{ id: 'a', text: 'Low-level programming' }, { id: 'b', text: 'Readability and simplicity' }, { id: 'c', text: 'Fastest execution' }, { id: 'd', text: 'Static typing' }] },
      { id: 'q2', question: 'What is a list comprehension?', correctAnswer: 'a', options: [{ id: 'a', text: 'Concise way to create lists: [x for x in range(10)]' }, { id: 'b', text: 'A list method' }, { id: 'c', text: 'A loop type' }, { id: 'd', text: 'A data structure' }] },
      { id: 'q3', question: 'What is a decorator in Python?', correctAnswer: 'c', options: [{ id: 'a', text: 'A design pattern' }, { id: 'b', text: 'A CSS feature' }, { id: 'c', text: 'A function that modifies another function' }, { id: 'd', text: 'A class attribute' }] },
      { id: 'q4', question: 'What is a generator?', correctAnswer: 'b', options: [{ id: 'a', text: 'A class factory' }, { id: 'b', text: 'A function that yields values one at a time' }, { id: 'c', text: 'A random number creator' }, { id: 'd', text: 'A code generator' }] },
      { id: 'q5', question: 'What is the GIL?', correctAnswer: 'a', options: [{ id: 'a', text: 'Global Interpreter Lock - limits true parallelism' }, { id: 'b', text: 'A graphics library' }, { id: 'c', text: 'A database' }, { id: 'd', text: 'A web framework' }] },
      { id: 'q6', question: 'What is a dictionary in Python?', correctAnswer: 'c', options: [{ id: 'a', text: 'An ordered list' }, { id: 'b', text: 'A tuple' }, { id: 'c', text: 'A key-value mapping' }, { id: 'd', text: 'A set' }] },
      { id: 'q7', question: 'What does async/await do in Python?', correctAnswer: 'b', options: [{ id: 'a', text: 'Parallel processing' }, { id: 'b', text: 'Asynchronous I/O without blocking' }, { id: 'c', text: 'Multithreading' }, { id: 'd', text: 'Error handling' }] },
      { id: 'q8', question: 'What is *args used for?', correctAnswer: 'a', options: [{ id: 'a', text: 'Variable number of positional arguments' }, { id: 'b', text: 'Pointer dereferencing' }, { id: 'c', text: 'Multiplication' }, { id: 'd', text: 'Keyword arguments' }] },
      { id: 'q9', question: 'What is **kwargs used for?', correctAnswer: 'd', options: [{ id: 'a', text: 'Exponentiation' }, { id: 'b', text: 'Positional arguments' }, { id: 'c', text: 'Default arguments' }, { id: 'd', text: 'Variable number of keyword arguments' }] },
      { id: 'q10', question: 'What is PEP 8?', correctAnswer: 'c', options: [{ id: 'a', text: 'Python Enhancement Package' }, { id: 'b', text: 'A Python version' }, { id: 'c', text: 'Python style guide' }, { id: 'd', text: 'A testing framework' }] }
    ]
  },
  'js-to-ts': {
    title: 'JavaScript to TypeScript',
    description: 'Questions on type annotations, generics, utility types, narrowing, and React+TypeScript patterns.',
    questions: [
      { id: 'q1', question: 'What does "strict: true" enable in tsconfig?', correctAnswer: 'b', options: [{ id: 'a', text: 'Only strictNullChecks' }, { id: 'b', text: 'A set of strict type checks including strictNullChecks and noImplicitAny' }, { id: 'c', text: 'Disallows all any types' }, { id: 'd', text: 'Forces all types to be explicit' }] },
      { id: 'q2', question: 'What is the difference between unknown and any?', correctAnswer: 'c', options: [{ id: 'a', text: 'They are identical' }, { id: 'b', text: 'any is safer than unknown' }, { id: 'c', text: 'unknown requires narrowing before use; any disables type checking entirely' }, { id: 'd', text: 'unknown is deprecated' }] },
      { id: 'q3', question: 'What does Partial<T> do?', correctAnswer: 'a', options: [{ id: 'a', text: 'Makes all properties of T optional' }, { id: 'b', text: 'Removes all properties of T' }, { id: 'c', text: 'Makes all properties of T required' }, { id: 'd', text: 'Picks a subset of T' }] },
      { id: 'q4', question: 'What is a discriminated union?', correctAnswer: 'b', options: [{ id: 'a', text: 'A union of number and string' }, { id: 'b', text: 'A union where each member has a shared literal property that uniquely identifies it' }, { id: 'c', text: 'A union that excludes null' }, { id: 'd', text: 'An enum-based union' }] },
      { id: 'q5', question: 'What does keyof T produce?', correctAnswer: 'c', options: [{ id: 'a', text: 'An array of keys' }, { id: 'b', text: 'The values of T' }, { id: 'c', text: 'A union type of all keys of T' }, { id: 'd', text: 'A mapped type' }] },
      { id: 'q6', question: 'What is "as const" used for?', correctAnswer: 'a', options: [{ id: 'a', text: 'Infers narrowest literal types and makes properties readonly' }, { id: 'b', text: 'Declares a constant variable' }, { id: 'c', text: 'Casts to any type' }, { id: 'd', text: 'Freezes the runtime object' }] },
      { id: 'q7', question: 'What is the correct type for a React onChange handler on an input?', correctAnswer: 'd', options: [{ id: 'a', text: 'React.EventHandler' }, { id: 'b', text: '(e: Event) => void' }, { id: 'c', text: 'React.SyntheticEvent' }, { id: 'd', text: 'React.ChangeEvent<HTMLInputElement>' }] },
      { id: 'q8', question: 'What does Omit<User, "password"> produce?', correctAnswer: 'b', options: [{ id: 'a', text: 'Only the password property' }, { id: 'b', text: 'User type without the password property' }, { id: 'c', text: 'Makes password optional' }, { id: 'd', text: 'A union of User and password' }] },
      { id: 'q9', question: 'What is the best incremental migration approach from JS to TS?', correctAnswer: 'c', options: [{ id: 'a', text: 'Rename all files at once' }, { id: 'b', text: 'Rewrite everything from scratch' }, { id: 'c', text: 'Enable allowJs, rename one file at a time starting with leaf modules' }, { id: 'd', text: 'Add @ts-ignore to all files' }] },
      { id: 'q10', question: 'What is a type predicate?', correctAnswer: 'a', options: [{ id: 'a', text: 'A function return type "x is T" that narrows the type in the calling scope' }, { id: 'b', text: 'A conditional type' }, { id: 'c', text: 'A generic constraint' }, { id: 'd', text: 'A typeof check' }] }
    ]
  },
  scala: {
    title: 'Scala',
    description: 'Questions on functional programming, case classes, and Scala patterns.',
    questions: [
      { id: 'q1', question: 'What is Scala?', correctAnswer: 'b', options: [{ id: 'a', text: 'A purely functional language' }, { id: 'b', text: 'A language combining OOP and functional programming on JVM' }, { id: 'c', text: 'A JavaScript dialect' }, { id: 'd', text: 'A database query language' }] },
      { id: 'q2', question: 'What is a case class?', correctAnswer: 'a', options: [{ id: 'a', text: 'Immutable class with auto-generated equals, hashCode, etc.' }, { id: 'b', text: 'A switch statement' }, { id: 'c', text: 'An error handler' }, { id: 'd', text: 'A test case' }] },
      { id: 'q3', question: 'What is pattern matching in Scala?', correctAnswer: 'c', options: [{ id: 'a', text: 'Regex matching' }, { id: 'b', text: 'String comparison' }, { id: 'c', text: 'Powerful switch with destructuring capabilities' }, { id: 'd', text: 'File pattern search' }] },
      { id: 'q4', question: 'What is Option in Scala?', correctAnswer: 'b', options: [{ id: 'a', text: 'Configuration options' }, { id: 'b', text: 'Container for optional values (Some or None)' }, { id: 'c', text: 'Command line parser' }, { id: 'd', text: 'Boolean wrapper' }] },
      { id: 'q5', question: 'What is a trait in Scala?', correctAnswer: 'a', options: [{ id: 'a', text: 'Similar to interface but can have implementations' }, { id: 'b', text: 'A class type' }, { id: 'c', text: 'A variable type' }, { id: 'd', text: 'A test trait' }] },
      { id: 'q6', question: 'What is val vs var?', correctAnswer: 'c', options: [{ id: 'a', text: 'val is mutable, var is immutable' }, { id: 'b', text: 'They are the same' }, { id: 'c', text: 'val is immutable, var is mutable' }, { id: 'd', text: 'val is for values, var is for variables' }] },
      { id: 'q7', question: 'What is a Future in Scala?', correctAnswer: 'b', options: [{ id: 'a', text: 'A time object' }, { id: 'b', text: 'A placeholder for async computation result' }, { id: 'c', text: 'A promise library' }, { id: 'd', text: 'A scheduling tool' }] },
      { id: 'q8', question: 'What is map in functional programming?', correctAnswer: 'a', options: [{ id: 'a', text: 'Transforms each element in a collection' }, { id: 'b', text: 'A data structure' }, { id: 'c', text: 'A navigation tool' }, { id: 'd', text: 'An aggregation' }] },
      { id: 'q9', question: 'What is flatMap?', correctAnswer: 'd', options: [{ id: 'a', text: 'Flattens nested maps' }, { id: 'b', text: 'Maps and filters' }, { id: 'c', text: 'Reduces a collection' }, { id: 'd', text: 'Maps and flattens the result' }] },
      { id: 'q10', question: 'What is implicit in Scala?', correctAnswer: 'c', options: [{ id: 'a', text: 'Hidden variables' }, { id: 'b', text: 'Private methods' }, { id: 'c', text: 'Auto-provided values/conversions by compiler' }, { id: 'd', text: 'Default parameters' }] }
    ]
  },

  // iOS Interview Prep
  'ios-swift': {
    title: 'Swift',
    description: 'Questions on value vs reference types, optionals, closures, generics, protocols, and ARC.',
    questions: [
      { id: 'q1', question: 'What is the difference between a struct and a class in Swift?', correctAnswer: 'b', options: [{ id: 'a', text: 'Structs support inheritance, classes do not' }, { id: 'b', text: 'Struct is a value type and is copied; class is a reference type and is shared' }, { id: 'c', text: 'Structs live on the heap, classes live on the stack' }, { id: 'd', text: 'They are identical apart from the keyword' }] },
      { id: 'q2', question: 'What does @escaping mean on a closure parameter?', correctAnswer: 'c', options: [{ id: 'a', text: 'The closure runs on a background queue' }, { id: 'b', text: 'The closure cannot capture self' }, { id: 'c', text: 'The closure outlives the function call, so it is stored or called later' }, { id: 'd', text: 'The closure is inlined by the compiler' }] },
      { id: 'q3', question: 'Which of these is NOT a way to unwrap an optional?', correctAnswer: 'd', options: [{ id: 'a', text: 'if let binding' }, { id: 'b', text: 'guard let binding' }, { id: 'c', text: 'Nil-coalescing with ??' }, { id: 'd', text: 'Wrapping it in Optional() again' }] },
      { id: 'q4', question: 'Explain ARC (Automatic Reference Counting).', correctAnswer: 'a', options: [{ id: 'a', text: 'It counts strong references; the object deallocates when the count hits zero' }, { id: 'b', text: 'It is a tracing garbage collector that runs periodically' }, { id: 'c', text: 'It compacts the heap to reduce fragmentation' }, { id: 'd', text: 'It frees memory only when the app is backgrounded' }] },
      { id: 'q5', question: 'When should you use unowned instead of weak?', correctAnswer: 'b', options: [{ id: 'a', text: 'When the reference may become nil at any time' }, { id: 'b', text: 'When the reference is guaranteed to outlive self, so it never becomes nil' }, { id: 'c', text: 'Only inside structs' }, { id: 'd', text: 'unowned and weak are interchangeable' }] },
      { id: 'q6', question: 'What is a retain cycle and how do you break it?', correctAnswer: 'c', options: [{ id: 'a', text: 'A loop that runs forever; break it with a return statement' }, { id: 'b', text: 'Too many objects on the stack; break it with recursion limits' }, { id: 'c', text: 'Two objects holding strong references to each other; break it with weak or unowned (e.g. [weak self])' }, { id: 'd', text: 'A thread deadlock; break it with a semaphore' }] },
      { id: 'q7', question: 'What is a computed property?', correctAnswer: 'b', options: [{ id: 'a', text: 'A property whose value is cached after first access' }, { id: 'b', text: 'A property with no storage that calculates its value on each access' }, { id: 'c', text: 'A property declared with let' }, { id: 'd', text: 'A property that can only be read from a background thread' }] },
      { id: 'q8', question: 'What do generics give you in Swift?', correctAnswer: 'a', options: [{ id: 'a', text: 'Reusable, type-safe code that works with any type meeting the constraints' }, { id: 'b', text: 'Automatic conversion between unrelated types' }, { id: 'c', text: 'Runtime reflection over any value' }, { id: 'd', text: 'Smaller compiled binaries' }] },
      { id: 'q9', question: 'What does the inout keyword do?', correctAnswer: 'd', options: [{ id: 'a', text: 'Marks a parameter as optional' }, { id: 'b', text: 'Makes the parameter thread-safe' }, { id: 'c', text: 'Copies the argument so the caller never sees changes' }, { id: 'd', text: 'Passes the parameter so changes are written back to the caller' }] },
      { id: 'q10', question: 'What is copy-on-write in Swift collections?', correctAnswer: 'b', options: [{ id: 'a', text: 'Every assignment eagerly copies the underlying buffer' }, { id: 'b', text: 'The buffer is shared until one holder mutates it, at which point it is copied' }, { id: 'c', text: 'Writes are journaled to disk before being applied' }, { id: 'd', text: 'Collections are always deep-copied on read' }] }
    ]
  },
  'ios-swiftui': {
    title: 'SwiftUI',
    description: 'Questions on state management, view identity, navigation, and SwiftUI lifecycle.',
    questions: [
      { id: 'q1', question: 'What is the difference between @State and @StateObject?', correctAnswer: 'c', options: [{ id: 'a', text: 'They are the same; @StateObject is just the newer spelling' }, { id: 'b', text: '@State is for reference types, @StateObject is for value types' }, { id: 'c', text: '@State owns a value type; @StateObject creates and owns a reference-type object once for the view lifetime' }, { id: 'd', text: '@StateObject can only be used in the App struct' }] },
      { id: 'q2', question: 'Why is using @ObservedObject to create a view model a bug?', correctAnswer: 'b', options: [{ id: 'a', text: 'It cannot publish changes' }, { id: 'b', text: 'The view struct is recreated on every render, so the object is recreated and its state is lost' }, { id: 'c', text: 'It leaks memory on every update' }, { id: 'd', text: 'It forces the view onto a background thread' }] },
      { id: 'q3', question: 'What does @Binding provide?', correctAnswer: 'a', options: [{ id: 'a', text: 'A two-way reference to state owned by a parent view' }, { id: 'b', text: 'A read-only snapshot of parent state' }, { id: 'c', text: 'A way to inject dependencies from the environment' }, { id: 'd', text: 'Automatic persistence to UserDefaults' }] },
      { id: 'q4', question: 'What does the @Observable macro (iOS 17+) replace?', correctAnswer: 'd', options: [{ id: 'a', text: 'NavigationView' }, { id: 'b', text: '@Environment' }, { id: 'c', text: '@State' }, { id: 'd', text: 'ObservableObject plus @Published plus @StateObject boilerplate' }] },
      { id: 'q5', question: 'What is the difference between .task and .onAppear?', correctAnswer: 'b', options: [{ id: 'a', text: 'There is none' }, { id: 'b', text: '.task runs an async block and cancels it automatically when the view disappears' }, { id: 'c', text: '.onAppear is async, .task is synchronous' }, { id: 'd', text: '.task only fires once per app launch' }] },
      { id: 'q6', question: 'What replaced NavigationView in modern SwiftUI?', correctAnswer: 'a', options: [{ id: 'a', text: 'NavigationStack with navigationDestination' }, { id: 'b', text: 'NavigationController' }, { id: 'c', text: 'TabView' }, { id: 'd', text: 'NavigationLink(destination:) only' }] },
      { id: 'q7', question: 'What is structural identity in SwiftUI?', correctAnswer: 'c', options: [{ id: 'a', text: 'The memory address of the view struct' }, { id: 'b', text: 'The accessibility identifier' }, { id: 'c', text: 'Identity derived from a view position in the view hierarchy, which determines state preservation' }, { id: 'd', text: 'The type name of the view' }] },
      { id: 'q8', question: 'Why does Identifiable matter for List and ForEach?', correctAnswer: 'b', options: [{ id: 'a', text: 'It sorts the collection automatically' }, { id: 'b', text: 'It gives each row a stable identity so SwiftUI can diff, animate, and preserve state correctly' }, { id: 'c', text: 'It enables lazy loading' }, { id: 'd', text: 'It is only needed for Core Data models' }] },
      { id: 'q9', question: 'How does data flow with @Environment versus PreferenceKey?', correctAnswer: 'a', options: [{ id: 'a', text: 'Environment flows down the hierarchy; preferences flow up' }, { id: 'b', text: 'Both flow down' }, { id: 'c', text: 'Both flow up' }, { id: 'd', text: 'Environment flows up; preferences flow down' }] },
      { id: 'q10', question: 'What does a custom ViewModifier let you do?', correctAnswer: 'd', options: [{ id: 'a', text: 'Subclass an existing View' }, { id: 'b', text: 'Bypass the SwiftUI render loop' }, { id: 'c', text: 'Change a view type at runtime' }, { id: 'd', text: 'Package a reusable set of modifiers and expose them via a View extension' }] }
    ]
  },
  'ios-uikit': {
    title: 'UIKit',
    description: 'Questions on cell reuse, Auto Layout, view controller lifecycle, delegation, and diffable data sources.',
    questions: [
      { id: 'q1', question: 'How does cell reuse work and why does it matter?', correctAnswer: 'b', options: [{ id: 'a', text: 'Every row keeps a permanent cell in memory for fast scrolling' }, { id: 'b', text: 'Cells scrolled off screen go into a reuse queue and are dequeued and reconfigured instead of allocated fresh' }, { id: 'c', text: 'Cells are rendered once into an image and cached' }, { id: 'd', text: 'The table view creates cells on a background thread' }] },
      { id: 'q2', question: 'What is the difference between frame and bounds?', correctAnswer: 'c', options: [{ id: 'a', text: 'frame includes the safe area, bounds does not' }, { id: 'b', text: 'They are always equal' }, { id: 'c', text: 'frame is in the superview coordinate system; bounds is in the view own coordinate system' }, { id: 'd', text: 'bounds is read-only' }] },
      { id: 'q3', question: 'What is the difference between dequeueReusableCell(withIdentifier:) and dequeueReusableCell(withIdentifier:for:)?', correctAnswer: 'a', options: [{ id: 'a', text: 'The indexPath version always returns a cell (crashing if unregistered); the other returns an optional' }, { id: 'b', text: 'The indexPath version skips cell reuse' }, { id: 'c', text: 'Only the optional version works with storyboards' }, { id: 'd', text: 'They are aliases for the same method' }] },
      { id: 'q4', question: 'What is intrinsic content size?', correctAnswer: 'b', options: [{ id: 'a', text: 'The size set by the last explicit frame assignment' }, { id: 'b', text: 'The natural size a view wants based on its content, used by Auto Layout' }, { id: 'c', text: 'The size of the view backing layer in pixels' }, { id: 'd', text: 'The maximum size a view may grow to' }] },
      { id: 'q5', question: 'What is the difference between content hugging and compression resistance?', correctAnswer: 'd', options: [{ id: 'a', text: 'Hugging resists shrinking; compression resistance resists growing' }, { id: 'b', text: 'Both resist growing' }, { id: 'c', text: 'Both resist shrinking' }, { id: 'd', text: 'Hugging resists growing beyond the content; compression resistance resists shrinking below it' }] },
      { id: 'q6', question: 'Why is a delegate property usually declared weak?', correctAnswer: 'a', options: [{ id: 'a', text: 'To avoid a retain cycle between the delegate and the delegating object' }, { id: 'b', text: 'To let the delegate be called from a background thread' }, { id: 'c', text: 'Because protocols cannot be held strongly' }, { id: 'd', text: 'To make the delegate optional at compile time' }] },
      { id: 'q7', question: 'What does a UITableViewDiffableDataSource give you over the classic data source?', correctAnswer: 'c', options: [{ id: 'a', text: 'Automatic networking' }, { id: 'b', text: 'It removes the need for cell reuse' }, { id: 'c', text: 'Snapshot-based updates where the framework diffs and animates changes for you' }, { id: 'd', text: 'Support for storyboards only' }] },
      { id: 'q8', question: 'In what order do these run on first display?', correctAnswer: 'b', options: [{ id: 'a', text: 'viewWillAppear, viewDidLoad, viewDidAppear' }, { id: 'b', text: 'viewDidLoad, viewWillAppear, viewDidAppear' }, { id: 'c', text: 'viewDidAppear, viewDidLoad, viewWillAppear' }, { id: 'd', text: 'viewDidLoad, viewDidAppear, viewWillAppear' }] },
      { id: 'q9', question: 'What is UIListContentConfiguration used for?', correctAnswer: 'd', options: [{ id: 'a', text: 'Configuring the table view data source' }, { id: 'b', text: 'Declaring compositional layout sections' }, { id: 'c', text: 'Registering cell classes' }, { id: 'd', text: 'The modern way to configure cell content, replacing the deprecated textLabel API' }] },
      { id: 'q10', question: 'What is the relationship between UIView and CALayer?', correctAnswer: 'a', options: [{ id: 'a', text: 'Every UIView is backed by a CALayer that does the actual drawing; the view adds touch handling and layout' }, { id: 'b', text: 'CALayer subclasses UIView' }, { id: 'c', text: 'They are unrelated rendering systems' }, { id: 'd', text: 'CALayer handles touch events, UIView handles drawing' }] }
    ]
  },
  'ios-combine': {
    title: 'Concurrency & Combine',
    description: 'Questions on async/await, actors, MainActor, Task, publishers, subscribers, and Combine operators.',
    questions: [
      { id: 'q1', question: 'How does async/await differ from completion handlers?', correctAnswer: 'b', options: [{ id: 'a', text: 'It runs everything on the main thread' }, { id: 'b', text: 'It reads like synchronous code and propagates errors with throws instead of nesting callbacks' }, { id: 'c', text: 'It removes the need for error handling' }, { id: 'd', text: 'It is only available inside SwiftUI views' }] },
      { id: 'q2', question: 'What does @MainActor guarantee?', correctAnswer: 'c', options: [{ id: 'a', text: 'The code runs on a background queue' }, { id: 'b', text: 'The code runs exactly once' }, { id: 'c', text: 'The annotated code runs on the main thread, which is what UI updates require' }, { id: 'd', text: 'The code cannot throw' }] },
      { id: 'q3', question: 'What is the difference between Task and Task.detached?', correctAnswer: 'a', options: [{ id: 'a', text: 'Task inherits the current actor context and priority; Task.detached inherits nothing' }, { id: 'b', text: 'Task.detached always runs on the main actor' }, { id: 'c', text: 'Task cannot be cancelled' }, { id: 'd', text: 'They are identical' }] },
      { id: 'q4', question: 'When do you reach for a TaskGroup instead of async let?', correctAnswer: 'd', options: [{ id: 'a', text: 'When you only have one child task' }, { id: 'b', text: 'When the work must be serial' }, { id: 'c', text: 'When you need the main thread' }, { id: 'd', text: 'When the number of parallel child tasks is dynamic rather than fixed' }] },
      { id: 'q5', question: 'What problem does an actor solve?', correctAnswer: 'b', options: [{ id: 'a', text: 'It speeds up single-threaded code' }, { id: 'b', text: 'It serializes access to its mutable state, preventing data races' }, { id: 'c', text: 'It replaces the need for async/await' }, { id: 'd', text: 'It guarantees code runs on the main thread' }] },
      { id: 'q6', question: 'What is a Publisher and a Subscriber in Combine?', correctAnswer: 'a', options: [{ id: 'a', text: 'A Publisher emits values over time; a Subscriber receives them' }, { id: 'b', text: 'A Publisher stores values; a Subscriber deletes them' }, { id: 'c', text: 'A Publisher is a queue; a Subscriber is a thread' }, { id: 'd', text: 'Both are protocols for encoding JSON' }] },
      { id: 'q7', question: 'Why must you store the AnyCancellable a sink returns?', correctAnswer: 'c', options: [{ id: 'a', text: 'To read the emitted values later' }, { id: 'b', text: 'To allow the publisher to replay values' }, { id: 'c', text: 'Because when the cancellable is deallocated the subscription is cancelled and the pipeline dies' }, { id: 'd', text: 'Combine requires it for thread safety' }] },
      { id: 'q8', question: 'What does debounce do, and when do you use it?', correctAnswer: 'b', options: [{ id: 'a', text: 'It emits at most one value per interval, dropping the rest' }, { id: 'b', text: 'It waits for a pause in emissions before emitting the latest value, ideal for search-as-you-type' }, { id: 'c', text: 'It removes duplicate values' }, { id: 'd', text: 'It buffers values and emits them all at once' }] },
      { id: 'q9', question: 'What is the difference between debounce and throttle?', correctAnswer: 'd', options: [{ id: 'a', text: 'They are the same operator with different names' }, { id: 'b', text: 'debounce is for errors, throttle is for values' }, { id: 'c', text: 'throttle waits for silence; debounce emits on a timer' }, { id: 'd', text: 'debounce waits for a quiet gap; throttle emits at most one value per interval regardless of gaps' }] },
      { id: 'q10', question: 'When would you use switchToLatest instead of flatMap?', correctAnswer: 'a', options: [{ id: 'a', text: 'When a new inner publisher should cancel the previous one, such as a fresh search request superseding the last' }, { id: 'b', text: 'When you want to merge all inner publishers and keep every result' }, { id: 'c', text: 'When the upstream can fail' }, { id: 'd', text: 'When you need to switch schedulers' }] }
    ]
  },
  'ios-apis': {
    title: 'API & Networking',
    description: 'Questions on URLSession, Codable, streaming, gRPC, caching, and resilience patterns.',
    questions: [
      { id: 'q1', question: 'What is the modern way to make a network request in Swift?', correctAnswer: 'b', options: [{ id: 'a', text: 'NSURLConnection with a delegate' }, { id: 'b', text: 'try await URLSession.shared.data(from:) inside an async function' }, { id: 'c', text: 'A synchronous call on the main thread' }, { id: 'd', text: 'Only third-party libraries can do this' }] },
      { id: 'q2', question: 'How do you map snake_case JSON keys to Swift property names?', correctAnswer: 'c', options: [{ id: 'a', text: 'Rename your Swift properties to snake_case' }, { id: 'b', text: 'Decode into a dictionary and copy manually' }, { id: 'c', text: 'Declare a CodingKeys enum, or set keyDecodingStrategy to .convertFromSnakeCase' }, { id: 'd', text: 'Codable handles it with no configuration' }] },
      { id: 'q3', question: 'How do you consume a streaming response in Swift?', correctAnswer: 'a', options: [{ id: 'a', text: 'Use URLSession.bytes(from:) and iterate its lines with for try await' }, { id: 'b', text: 'Poll the endpoint every second' }, { id: 'c', text: 'Download the whole body then split it' }, { id: 'd', text: 'Streaming is not supported by URLSession' }] },
      { id: 'q4', question: 'Why does try? on a network call hurt you in an interview?', correctAnswer: 'd', options: [{ id: 'a', text: 'It is slower than do/catch' }, { id: 'b', text: 'It does not compile in async functions' }, { id: 'c', text: 'It forces the call onto the main thread' }, { id: 'd', text: 'It swallows the error, so you cannot report or diagnose the failure' }] },
      { id: 'q5', question: 'What is exponential backoff?', correctAnswer: 'b', options: [{ id: 'a', text: 'Reducing the payload size on each retry' }, { id: 'b', text: 'Waiting progressively longer between retries to avoid hammering a struggling server' }, { id: 'c', text: 'Cancelling all requests after the first failure' }, { id: 'd', text: 'Compressing requests before sending' }] },
      { id: 'q6', question: 'What does the circuit breaker pattern do?', correctAnswer: 'c', options: [{ id: 'a', text: 'Encrypts requests end to end' }, { id: 'b', text: 'Retries forever until the call succeeds' }, { id: 'c', text: 'Stops sending requests to a failing service for a cooldown period, then probes before fully reopening' }, { id: 'd', text: 'Splits one request across several connections' }] },
      { id: 'q7', question: 'When is gRPC a better fit than REST?', correctAnswer: 'a', options: [{ id: 'a', text: 'High-throughput internal services needing a strict schema and bidirectional streaming' }, { id: 'b', text: 'Any browser-facing public API' }, { id: 'c', text: 'Anywhere human-readable payloads are required' }, { id: 'd', text: 'Only for file uploads' }] },
      { id: 'q8', question: 'What is request coalescing?', correctAnswer: 'd', options: [{ id: 'a', text: 'Merging response bodies into one payload' }, { id: 'b', text: 'Sending requests in a fixed batch size' }, { id: 'c', text: 'Compressing headers' }, { id: 'd', text: 'Sharing a single in-flight request among callers asking for the same resource' }] },
      { id: 'q9', question: 'What do ETag and Last-Modified headers enable?', correctAnswer: 'b', options: [{ id: 'a', text: 'Request authentication' }, { id: 'b', text: 'Conditional requests, so the server can answer 304 Not Modified and skip resending the body' }, { id: 'c', text: 'Response compression' }, { id: 'd', text: 'Rate limiting' }] },
      { id: 'q10', question: 'Where must UI updates happen after an async fetch?', correctAnswer: 'c', options: [{ id: 'a', text: 'Any thread; UIKit is thread-safe' }, { id: 'b', text: 'On a global concurrent queue' }, { id: 'c', text: 'On the main thread, via @MainActor or MainActor.run' }, { id: 'd', text: 'Inside the URLSession delegate only' }] }
    ]
  },
  'ios-awareness': {
    title: 'iOS Awareness',
    description: 'Questions on accessibility, localization, push notifications, persistence, CI/CD, App Store review, and security.',
    questions: [
      { id: 'q1', question: 'What does VoiceOver rely on to describe a control?', correctAnswer: 'b', options: [{ id: 'a', text: 'The view background color' }, { id: 'b', text: 'Accessibility labels, traits, hints, and values' }, { id: 'c', text: 'The storyboard file name' }, { id: 'd', text: 'The Auto Layout constraints' }] },
      { id: 'q2', question: 'What is Dynamic Type?', correctAnswer: 'c', options: [{ id: 'a', text: 'Runtime type checking in Swift' }, { id: 'b', text: 'A font downloading API' }, { id: 'c', text: 'System text sizing that scales your UI to the user preferred content size' }, { id: 'd', text: 'A layout engine for collection views' }] },
      { id: 'q3', question: 'How do you localize user-facing strings?', correctAnswer: 'a', options: [{ id: 'a', text: 'Put them in string catalogs or .strings files and look them up with NSLocalizedString or String(localized:)' }, { id: 'b', text: 'Hardcode English and translate at runtime with an API' }, { id: 'c', text: 'Ship a separate app per language' }, { id: 'd', text: 'Use Info.plist keys for every string' }] },
      { id: 'q4', question: 'What does APNs need to deliver a push to a device?', correctAnswer: 'd', options: [{ id: 'a', text: 'The user Apple ID' }, { id: 'b', text: 'The device UDID' }, { id: 'c', text: 'The app bundle version' }, { id: 'd', text: 'A device token the app registers for and sends to your server' }] },
      { id: 'q5', question: 'When would you choose SwiftData over Core Data?', correctAnswer: 'b', options: [{ id: 'a', text: 'When you must support iOS 13' }, { id: 'b', text: 'On iOS 17+ when you want a Swift-native declarative API over the same persistence stack' }, { id: 'c', text: 'When you need CloudKit sync, which Core Data cannot do' }, { id: 'd', text: 'SwiftData is only for macOS' }] },
      { id: 'q6', question: 'Where should an auth token be stored?', correctAnswer: 'c', options: [{ id: 'a', text: 'UserDefaults' }, { id: 'b', text: 'A plist bundled with the app' }, { id: 'c', text: 'The Keychain' }, { id: 'd', text: 'A hardcoded constant in source' }] },
      { id: 'q7', question: 'What is App Transport Security?', correctAnswer: 'a', options: [{ id: 'a', text: 'A default requirement that network connections use HTTPS with modern TLS' }, { id: 'b', text: 'Apple background transfer service' }, { id: 'c', text: 'A VPN framework' }, { id: 'd', text: 'The App Store upload protocol' }] },
      { id: 'q8', question: 'What is TestFlight used for?', correctAnswer: 'd', options: [{ id: 'a', text: 'Running unit tests in CI' }, { id: 'b', text: 'Profiling memory usage' }, { id: 'c', text: 'Submitting crash reports' }, { id: 'd', text: 'Distributing builds to internal and external beta testers before release' }] },
      { id: 'q9', question: 'Which is a common App Store rejection reason?', correctAnswer: 'b', options: [{ id: 'a', text: 'Using SwiftUI instead of UIKit' }, { id: 'b', text: 'Requesting a permission without explaining why, or missing privacy usage descriptions' }, { id: 'c', text: 'Supporting Dark Mode' }, { id: 'd', text: 'Shipping a universal binary' }] },
      { id: 'q10', question: 'What does a typical iOS CI pipeline do on each push?', correctAnswer: 'c', options: [{ id: 'a', text: 'Submit directly to the App Store' }, { id: 'b', text: 'Only run SwiftLint' }, { id: 'c', text: 'Build, run tests, and archive or upload a build to TestFlight' }, { id: 'd', text: 'Regenerate the Xcode project from scratch' }] }
    ]
  },
  'ios-speedrun-v1': {
    title: 'Speedrun — Swift Core',
    description: 'Rapid-fire questions on value semantics, optionals, closures, concurrency basics, and SwiftUI state.',
    questions: [
      { id: 'q1', question: 'Which is a value type?', correctAnswer: 'b', options: [{ id: 'a', text: 'class' }, { id: 'b', text: 'struct' }, { id: 'c', text: 'actor' }, { id: 'd', text: 'A closure' }] },
      { id: 'q2', question: 'What does guard let give you over if let?', correctAnswer: 'c', options: [{ id: 'a', text: 'It is faster at runtime' }, { id: 'b', text: 'It can bind multiple optionals; if let cannot' }, { id: 'c', text: 'The unwrapped value stays in scope after the statement, so you exit early instead of nesting' }, { id: 'd', text: 'It cannot fail' }] },
      { id: 'q3', question: 'What does [weak self] in an escaping closure prevent?', correctAnswer: 'a', options: [{ id: 'a', text: 'A retain cycle where the closure keeps self alive forever' }, { id: 'b', text: 'A crash on the main thread' }, { id: 'c', text: 'The closure from ever running' }, { id: 'd', text: 'A compiler warning about mutability' }] },
      { id: 'q4', question: 'What does Sendable mark?', correctAnswer: 'd', options: [{ id: 'a', text: 'A type that can be encoded to JSON' }, { id: 'b', text: 'A type that can be sent over the network' }, { id: 'c', text: 'A type that must be a class' }, { id: 'd', text: 'A type that is safe to pass across concurrency domains' }] },
      { id: 'q5', question: 'Does an async function inherit the caller thread?', correctAnswer: 'b', options: [{ id: 'a', text: 'Yes, always' }, { id: 'b', text: 'No — it may resume on a different thread unless isolated to an actor such as @MainActor' }, { id: 'c', text: 'Only when it throws' }, { id: 'd', text: 'Only on iOS 17+' }] },
      { id: 'q6', question: 'Which runs two fixed fetches in parallel?', correctAnswer: 'a', options: [{ id: 'a', text: 'async let a = f(); async let b = g(); then await both' }, { id: 'b', text: 'let a = await f(); let b = await g()' }, { id: 'c', text: 'DispatchQueue.main.async twice' }, { id: 'd', text: 'Wrapping both in a single Task' }] },
      { id: 'q7', question: 'What is a protocol with an associated type used for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Marking a protocol as class-only' }, { id: 'b', text: 'Adding stored properties to a protocol' }, { id: 'c', text: 'Letting conforming types supply a placeholder type, as Collection does with Element' }, { id: 'd', text: 'Making a protocol Sendable' }] },
      { id: 'q8', question: 'In SwiftUI, which owns its object for the view lifetime?', correctAnswer: 'b', options: [{ id: 'a', text: '@ObservedObject' }, { id: 'b', text: '@StateObject' }, { id: 'c', text: '@EnvironmentObject' }, { id: 'd', text: '@Binding' }] },
      { id: 'q9', question: 'What does removeDuplicates do in a search pipeline?', correctAnswer: 'a', options: [{ id: 'a', text: 'Drops a value when it equals the previous one, avoiding redundant searches' }, { id: 'b', text: 'Removes duplicate elements inside each emitted array' }, { id: 'c', text: 'Deduplicates subscribers' }, { id: 'd', text: 'Cancels in-flight requests' }] },
      { id: 'q10', question: 'What is the modern UIKit list update mechanism?', correctAnswer: 'd', options: [{ id: 'a', text: 'reloadData on every change' }, { id: 'b', text: 'beginUpdates and endUpdates' }, { id: 'c', text: 'KVO on the model array' }, { id: 'd', text: 'Applying an NSDiffableDataSourceSnapshot' }] }
    ]
  },
  'ios-speedrun-v2': {
    title: 'Speedrun — Deep Dive',
    description: 'Questions on advanced generics, property wrappers, result builders, view identity, and Combine subjects.',
    questions: [
      { id: 'q1', question: 'What is type erasure and why use it?', correctAnswer: 'b', options: [{ id: 'a', text: 'Deleting type metadata to shrink the binary' }, { id: 'b', text: 'Wrapping a generic or associated-type protocol in a concrete box such as AnyPublisher so it can be stored or returned' }, { id: 'c', text: 'Casting everything to Any' }, { id: 'd', text: 'Removing generics at compile time for speed' }] },
      { id: 'q2', question: 'What does a where clause on a generic do?', correctAnswer: 'c', options: [{ id: 'a', text: 'Chooses which thread the code runs on' }, { id: 'b', text: 'Marks the generic as optional' }, { id: 'c', text: 'Adds constraints the type parameters must satisfy' }, { id: 'd', text: 'Declares a default type parameter' }] },
      { id: 'q3', question: 'What is the projected value of a property wrapper?', correctAnswer: 'a', options: [{ id: 'a', text: 'The extra value exposed with the $ prefix, such as $text giving a Binding' }, { id: 'b', text: 'The wrapped storage itself' }, { id: 'c', text: 'A cached copy of the last value' }, { id: 'd', text: 'The type name of the wrapper' }] },
      { id: 'q4', question: 'What is a result builder?', correctAnswer: 'd', options: [{ id: 'a', text: 'A wrapper around Swift Result type' }, { id: 'b', text: 'A code generator run at build time' }, { id: 'c', text: 'A pattern for combining error types' }, { id: 'd', text: 'The mechanism that turns a block of statements into a single value, as @ViewBuilder does for SwiftUI' }] },
      { id: 'q5', question: 'What does a KeyPath give you?', correctAnswer: 'b', options: [{ id: 'a', text: 'A file system path to a resource' }, { id: 'b', text: 'A type-safe reference to a property that can be passed around and applied later' }, { id: 'c', text: 'A Keychain lookup identifier' }, { id: 'd', text: 'A dictionary key wrapper' }] },
      { id: 'q6', question: 'How do you give a view explicit identity in SwiftUI?', correctAnswer: 'c', options: [{ id: 'a', text: 'Set an accessibilityIdentifier' }, { id: 'b', text: 'Wrap it in AnyView' }, { id: 'c', text: 'Use .id(value)' }, { id: 'd', text: 'Give it a unique @State property' }] },
      { id: 'q7', question: 'What is the difference between PassthroughSubject and CurrentValueSubject?', correctAnswer: 'a', options: [{ id: 'a', text: 'CurrentValueSubject holds and replays the latest value to new subscribers; PassthroughSubject holds nothing' }, { id: 'b', text: 'PassthroughSubject buffers all values; CurrentValueSubject drops them' }, { id: 'c', text: 'Only PassthroughSubject can fail' }, { id: 'd', text: 'CurrentValueSubject cannot be sent new values' }] },
      { id: 'q8', question: 'What does tryMap add over map in Combine?', correctAnswer: 'd', options: [{ id: 'a', text: 'It retries the upstream on failure' }, { id: 'b', text: 'It runs the transform on a background scheduler' }, { id: 'c', text: 'It ignores nil results' }, { id: 'd', text: 'Its transform can throw, converting the failure type to Error' }] },
      { id: 'q9', question: 'What is the responder chain in UIKit?', correctAnswer: 'b', options: [{ id: 'a', text: 'The order view controllers are pushed onto a navigation stack' }, { id: 'b', text: 'The ordered path an unhandled event travels up, from first responder through superviews to the app delegate' }, { id: 'c', text: 'The sequence of Auto Layout passes' }, { id: 'd', text: 'The list of registered notification observers' }] },
      { id: 'q10', question: 'What is the modern way to register collection view cells?', correctAnswer: 'c', options: [{ id: 'a', text: 'register(_:forCellWithReuseIdentifier:) only' }, { id: 'b', text: 'Storyboard prototype cells only' }, { id: 'c', text: 'UICollectionView.CellRegistration with a configuration handler' }, { id: 'd', text: 'Subclassing UICollectionViewLayout' }] }
    ]
  },
  'ios-speedrun-v3': {
    title: 'Speedrun — Advanced',
    description: 'Questions on concurrency pitfalls, SwiftUI performance, schedulers, profiling, and pagination.',
    questions: [
      { id: 'q1', question: 'What is actor reentrancy?', correctAnswer: 'b', options: [{ id: 'a', text: 'An actor calling itself recursively and deadlocking' }, { id: 'b', text: 'Other work can run on the actor while it is suspended at an await, so state may change across the suspension point' }, { id: 'c', text: 'Two actors sharing the same executor' }, { id: 'd', text: 'An actor being deallocated mid-call' }] },
      { id: 'q2', question: 'How does task cancellation work in Swift concurrency?', correctAnswer: 'c', options: [{ id: 'a', text: 'The runtime forcibly kills the task immediately' }, { id: 'b', text: 'Cancellation is not supported' }, { id: 'c', text: 'It is cooperative — you check Task.isCancelled or call Task.checkCancellation()' }, { id: 'd', text: 'Only detached tasks can be cancelled' }] },
      { id: 'q3', question: 'What is the difference between receive(on:) and subscribe(on:)?', correctAnswer: 'a', options: [{ id: 'a', text: 'receive(on:) sets the scheduler for downstream delivery; subscribe(on:) sets where the subscription and upstream work start' }, { id: 'b', text: 'They are aliases' }, { id: 'c', text: 'subscribe(on:) controls delivery; receive(on:) controls subscription' }, { id: 'd', text: 'Only receive(on:) works with DispatchQueue' }] },
      { id: 'q4', question: 'How do you avoid unnecessary SwiftUI redraws?', correctAnswer: 'd', options: [{ id: 'a', text: 'Wrap everything in AnyView' }, { id: 'b', text: 'Put all state in one large observable object' }, { id: 'c', text: 'Use .id() on every view' }, { id: 'd', text: 'Keep views small, scope state narrowly, and use Equatable or stable identity so only affected views re-render' }] },
      { id: 'q5', question: 'What does LazyVStack give you over VStack?', correctAnswer: 'b', options: [{ id: 'a', text: 'Automatic animation' }, { id: 'b', text: 'It only creates child views as they scroll into view' }, { id: 'c', text: 'Better accessibility defaults' }, { id: 'd', text: 'Multi-column layout' }] },
      { id: 'q6', question: 'What is NavigationPath used for?', correctAnswer: 'c', options: [{ id: 'a', text: 'Declaring URL routes for deep links' }, { id: 'b', text: 'Storing the file path of the current view' }, { id: 'c', text: 'Holding a type-erased, programmatically mutable navigation stack' }, { id: 'd', text: 'Animating navigation transitions' }] },
      { id: 'q7', question: 'Which Instruments tool finds retain cycles?', correctAnswer: 'a', options: [{ id: 'a', text: 'Leaks, alongside the Memory Graph Debugger' }, { id: 'b', text: 'Time Profiler' }, { id: 'c', text: 'Network' }, { id: 'd', text: 'Energy Log' }] },
      { id: 'q8', question: 'What does the Zombies instrument detect?', correctAnswer: 'd', options: [{ id: 'a', text: 'Retain cycles' }, { id: 'b', text: 'Main-thread stalls' }, { id: 'c', text: 'Excessive allocations' }, { id: 'd', text: 'Messages sent to already-deallocated objects' }] },
      { id: 'q9', question: 'Why is cursor-based pagination usually better than offset-based?', correctAnswer: 'b', options: [{ id: 'a', text: 'It returns more rows per page' }, { id: 'b', text: 'It stays stable when rows are inserted or deleted, so pages do not shift or duplicate' }, { id: 'c', text: 'It requires no server support' }, { id: 'd', text: 'It works only with GraphQL' }] },
      { id: 'q10', question: 'How do you test a Combine pipeline?', correctAnswer: 'c', options: [{ id: 'a', text: 'Sleep for a fixed duration and assert afterwards' }, { id: 'b', text: 'Only via UI tests' }, { id: 'c', text: 'Collect emitted values in a sink and use XCTestExpectation, or drive time with a test scheduler' }, { id: 'd', text: 'Combine pipelines cannot be unit tested' }] }
    ]
  },
  'ios-speedrun-final': {
    title: 'Speedrun — Deep Cuts',
    description: 'Questions on macros, memory layout, custom drawing, backpressure, and advanced caching.',
    questions: [
      { id: 'q1', question: 'What are the two broad kinds of Swift macros?', correctAnswer: 'b', options: [{ id: 'a', text: 'Compile-time and runtime macros' }, { id: 'b', text: 'Freestanding macros and attached macros' }, { id: 'c', text: 'Public and private macros' }, { id: 'd', text: 'Textual and semantic macros' }] },
      { id: 'q2', question: 'What does MemoryLayout tell you?', correctAnswer: 'c', options: [{ id: 'a', text: 'The retain count of an object' }, { id: 'b', text: 'Which memory region a value lives in' }, { id: 'c', text: 'The size, stride, and alignment of a type' }, { id: 'd', text: 'The total heap usage of the app' }] },
      { id: 'q3', question: 'What are task-local values?', correctAnswer: 'a', options: [{ id: 'a', text: 'Values bound for the duration of a task and inherited by its child tasks, useful for things like a request ID' }, { id: 'b', text: 'Local variables inside a Task closure' }, { id: 'c', text: 'Thread-local storage exposed to Swift' }, { id: 'd', text: 'Values captured by an actor' }] },
      { id: 'q4', question: 'What does conforming to AsyncSequence require?', correctAnswer: 'd', options: [{ id: 'a', text: 'A Publisher property' }, { id: 'b', text: 'Conforming to Sendable' }, { id: 'c', text: 'An async body property' }, { id: 'd', text: 'An makeAsyncIterator() returning an iterator with an async next()' }] },
      { id: 'q5', question: 'What is Canvas in SwiftUI for?', correctAnswer: 'b', options: [{ id: 'a', text: 'Embedding a UIKit view' }, { id: 'b', text: 'Immediate-mode custom drawing without creating a view per element' }, { id: 'c', text: 'Laying out a grid' }, { id: 'd', text: 'Rendering remote images' }] },
      { id: 'q6', question: 'What does .drawingGroup() do?', correctAnswer: 'c', options: [{ id: 'a', text: 'Groups views for accessibility' }, { id: 'b', text: 'Batches network requests' }, { id: 'c', text: 'Flattens the subtree into a single offscreen Metal-rendered image' }, { id: 'd', text: 'Applies the same modifier to every child' }] },
      { id: 'q7', question: 'What is matchedGeometryEffect used for?', correctAnswer: 'a', options: [{ id: 'a', text: 'Animating a view smoothly between two positions or hierarchies using a shared namespace' }, { id: 'b', text: 'Matching Auto Layout constraints across views' }, { id: 'c', text: 'Aligning text baselines' }, { id: 'd', text: 'Snapping a drag gesture to a grid' }] },
      { id: 'q8', question: 'What is backpressure in Combine?', correctAnswer: 'd', options: [{ id: 'a', text: 'Retrying failed values' }, { id: 'b', text: 'Publishers competing for the same subscriber' }, { id: 'c', text: 'Latency added by receive(on:)' }, { id: 'd', text: 'The subscriber signalling demand so a fast publisher cannot overwhelm it' }] },
      { id: 'q9', question: 'What does share() do to a publisher?', correctAnswer: 'b', options: [{ id: 'a', text: 'Replays all past values to new subscribers' }, { id: 'b', text: 'Turns it into a class-backed multicast so subscribers share one upstream subscription instead of each triggering the work' }, { id: 'c', text: 'Splits values evenly among subscribers' }, { id: 'd', text: 'Makes the publisher Sendable' }] },
      { id: 'q10', question: 'What does an LRU cache evict?', correctAnswer: 'c', options: [{ id: 'a', text: 'The largest entry' }, { id: 'b', text: 'The oldest entry by insertion time' }, { id: 'c', text: 'The least recently used entry' }, { id: 'd', text: 'A random entry' }] }
    ]
  },
};

function extractTitle(content) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

function calculateReadingTime(content) {
  const words = content.split(/\s+/).length;
  return Math.max(5, Math.ceil(words / 200));
}

const REPS = {
  // Frontend Engineer
  react: {
    title: 'useState Counter',
    priority: 'high',
    prompt: 'Create a counter component using useState. Display the current count and provide increment/decrement buttons.',
    targetMinutes: 3,
    starterCode: `import React from 'react';

function Counter() {
  // TODO: Add useState for count
  // TODO: Return JSX with count display and buttons
}

export default Counter;`,
    solution: `import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}

export default Counter;`
  },
  typescript: {
    title: 'Generic Stack',
    priority: 'high',
    prompt: 'Implement a generic Stack<T> class with push, pop, and peek methods. Include proper type annotations.',
    targetMinutes: 4,
    starterCode: `// Implement a generic Stack class
class Stack {
  // TODO: Add private items array
  // TODO: Implement push, pop, peek, isEmpty
}

// Test
const stack = new Stack();
stack.push(1);
stack.push(2);
console.log(stack.pop()); // 2`,
    solution: `class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

const stack = new Stack<number>();
stack.push(1);
stack.push(2);
console.log(stack.pop()); // 2`
  },
  tailwind: {
    title: 'Responsive Card',
    priority: 'high',
    prompt: 'Create a responsive card component using Tailwind CSS. Include an image, title, description, and a button. Use responsive breakpoints.',
    targetMinutes: 3,
    starterCode: `<!-- Create a responsive card with Tailwind -->
<div class="">
  <!-- Image -->
  <!-- Title -->
  <!-- Description -->
  <!-- Button -->
</div>`,
    solution: `<div class="max-w-sm mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
  <div class="md:flex">
    <div class="md:shrink-0">
      <img class="h-48 w-full object-cover md:h-full md:w-48" src="/image.jpg" alt="Card image">
    </div>
    <div class="p-8">
      <h2 class="text-xl font-semibold text-gray-900">Card Title</h2>
      <p class="mt-2 text-gray-600">This is a description of the card content.</p>
      <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
        Learn More
      </button>
    </div>
  </div>
</div>`
  },
  websockets: {
    title: 'Chat Connection',
    priority: 'high',
    prompt: 'Create a WebSocket connection that sends and receives messages. Handle open, message, and close events.',
    targetMinutes: 4,
    starterCode: `// Create WebSocket chat connection
const socket = null; // TODO: Create WebSocket

function sendMessage(text) {
  // TODO: Send message as JSON
}

function onMessage(callback) {
  // TODO: Handle incoming messages
}`,
    solution: `const socket = new WebSocket('wss://chat.example.com');

socket.onopen = () => {
  console.log('Connected to chat server');
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

socket.onclose = () => {
  console.log('Disconnected from server');
};

function sendMessage(text) {
  socket.send(JSON.stringify({ type: 'message', text }));
}

function onMessage(callback) {
  socket.onmessage = (event) => {
    callback(JSON.parse(event.data));
  };
}`
  },
  'web-workers': {
    title: 'Fibonacci Worker',
    priority: 'medium',
    prompt: 'Create a Web Worker that calculates Fibonacci numbers without blocking the main thread.',
    targetMinutes: 4,
    starterCode: `// main.js
const worker = null; // TODO: Create worker

function calculateFib(n) {
  // TODO: Send message to worker
}

// worker.js
// TODO: Listen for messages and calculate fibonacci`,
    solution: `// main.js
const worker = new Worker('worker.js');

worker.onmessage = (e) => {
  console.log('Fibonacci result:', e.data);
};

function calculateFib(n) {
  worker.postMessage(n);
}

// worker.js
self.onmessage = (e) => {
  const n = e.data;
  const result = fibonacci(n);
  self.postMessage(result);
};

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`
  },
  pwas: {
    title: 'Service Worker Cache',
    priority: 'medium',
    prompt: 'Implement a service worker that caches static assets and serves them offline using the Cache API.',
    targetMinutes: 5,
    starterCode: `// service-worker.js
const CACHE_NAME = 'v1';
const ASSETS = ['/index.html', '/styles.css', '/app.js'];

self.addEventListener('install', (event) => {
  // TODO: Cache assets
});

self.addEventListener('fetch', (event) => {
  // TODO: Serve from cache, fallback to network
});`,
    solution: `const CACHE_NAME = 'v1';
const ASSETS = ['/index.html', '/styles.css', '/app.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
      .catch(() => caches.match('/offline.html'))
  );
});`
  },
  electron: {
    title: 'IPC Communication',
    priority: 'medium',
    prompt: 'Set up IPC communication between main and renderer processes. Send a message from renderer and respond from main.',
    targetMinutes: 4,
    starterCode: `// main.js
const { app, BrowserWindow, ipcMain } = require('electron');

// TODO: Handle IPC message from renderer

// renderer.js (preload exposed)
// TODO: Send message to main and handle response`,
    solution: `// main.js
const { app, BrowserWindow, ipcMain } = require('electron');

ipcMain.handle('get-data', async (event, query) => {
  // Simulate async operation
  return { result: 'Data for: ' + query };
});

// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getData: (query) => ipcRenderer.invoke('get-data', query)
});

// renderer.js
const result = await window.api.getData('users');
console.log(result);`
  },
  webgl: {
    title: 'Triangle Render',
    priority: 'low',
    prompt: 'Render a colored triangle using WebGL. Set up shaders, buffers, and draw call.',
    targetMinutes: 5,
    starterCode: `const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

// Vertex shader source
const vsSource = \`
  attribute vec4 aPosition;
  void main() {
    gl_Position = aPosition;
  }
\`;

// TODO: Fragment shader, program, buffer, draw`,
    solution: `const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl');

const vsSource = \`
  attribute vec4 aPosition;
  void main() { gl_Position = aPosition; }
\`;

const fsSource = \`
  precision mediump float;
  void main() { gl_FragColor = vec4(1.0, 0.5, 0.0, 1.0); }
\`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

const program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);
gl.useProgram(program);

const vertices = new Float32Array([0, 0.5, -0.5, -0.5, 0.5, -0.5]);
const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

const aPos = gl.getAttribLocation(program, 'aPosition');
gl.enableVertexAttribArray(aPos);
gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

gl.drawArrays(gl.TRIANGLES, 0, 3);`
  },

  // Backend Engineer
  express: {
    title: 'REST CRUD API',
    priority: 'high',
    prompt: 'Create an Express router with CRUD endpoints for a "users" resource. Include proper HTTP methods and status codes.',
    targetMinutes: 4,
    starterCode: `const express = require('express');
const router = express.Router();

let users = [];

// TODO: GET all users
// TODO: GET user by id
// TODO: POST create user
// TODO: PUT update user
// TODO: DELETE user

module.exports = router;`,
    solution: `const express = require('express');
const router = express.Router();

let users = [];
let nextId = 1;

router.get('/', (req, res) => {
  res.json(users);
});

router.get('/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

router.post('/', (req, res) => {
  const user = { id: nextId++, ...req.body };
  users.push(user);
  res.status(201).json(user);
});

router.put('/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});

router.delete('/:id', (req, res) => {
  users = users.filter(u => u.id !== parseInt(req.params.id));
  res.status(204).send();
});

module.exports = router;`
  },
  graphql: {
    title: 'Query and Mutation',
    priority: 'high',
    prompt: 'Define a GraphQL schema with a Query for fetching books and a Mutation for adding a book. Include resolvers.',
    targetMinutes: 4,
    starterCode: `const { gql } = require('apollo-server');

// TODO: Define typeDefs with Book type, Query, Mutation

// TODO: Define resolvers`,
    solution: `const { gql } = require('apollo-server');

const typeDefs = gql\`
  type Book {
    id: ID!
    title: String!
    author: String!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
  }

  type Mutation {
    addBook(title: String!, author: String!): Book!
  }
\`;

let books = [];
let nextId = 1;

const resolvers = {
  Query: {
    books: () => books,
    book: (_, { id }) => books.find(b => b.id === id)
  },
  Mutation: {
    addBook: (_, { title, author }) => {
      const book = { id: String(nextId++), title, author };
      books.push(book);
      return book;
    }
  }
};`
  },
  grpc: {
    title: 'Unary RPC Service',
    priority: 'medium',
    prompt: 'Define a gRPC service with a unary RPC method in Protocol Buffers and implement the server handler.',
    targetMinutes: 5,
    starterCode: `// user.proto
syntax = "proto3";

// TODO: Define UserService with GetUser RPC

// server.js
// TODO: Implement the GetUser handler`,
    solution: `// user.proto
syntax = "proto3";

package user;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
}

message GetUserRequest {
  string id = 1;
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}

// server.js
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDef = protoLoader.loadSync('user.proto');
const proto = grpc.loadPackageDefinition(packageDef);

const users = { '1': { id: '1', name: 'Alice', email: 'alice@example.com' } };

function getUser(call, callback) {
  const user = users[call.request.id];
  if (user) {
    callback(null, user);
  } else {
    callback({ code: grpc.status.NOT_FOUND, message: 'User not found' });
  }
}

const server = new grpc.Server();
server.addService(proto.user.UserService.service, { getUser });`
  },
  sqlite: {
    title: 'CRUD Operations',
    priority: 'high',
    prompt: 'Create a SQLite database with a users table. Implement functions for insert, select, update, and delete.',
    targetMinutes: 4,
    starterCode: `const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

// TODO: Create users table
// TODO: Implement insert, getAll, update, delete functions`,
    solution: `const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.run(\`CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE
)\`);

function insertUser(name, email) {
  return new Promise((resolve, reject) => {
    db.run('INSERT INTO users (name, email) VALUES (?, ?)', [name, email],
      function(err) { err ? reject(err) : resolve(this.lastID); });
  });
}

function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM users', (err, rows) => {
      err ? reject(err) : resolve(rows);
    });
  });
}

function updateUser(id, name) {
  return new Promise((resolve, reject) => {
    db.run('UPDATE users SET name = ? WHERE id = ?', [name, id],
      function(err) { err ? reject(err) : resolve(this.changes); });
  });
}

function deleteUser(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM users WHERE id = ?', [id],
      function(err) { err ? reject(err) : resolve(this.changes); });
  });
}`
  },
  postgresql: {
    title: 'Transaction Block',
    priority: 'high',
    prompt: 'Implement a PostgreSQL transaction that transfers money between accounts. Handle commit and rollback.',
    targetMinutes: 4,
    starterCode: `const { Pool } = require('pg');
const pool = new Pool();

async function transferMoney(fromId, toId, amount) {
  // TODO: Begin transaction
  // TODO: Debit from account
  // TODO: Credit to account
  // TODO: Commit or rollback
}`,
    solution: `const { Pool } = require('pg');
const pool = new Pool();

async function transferMoney(fromId, toId, amount) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const debit = await client.query(
      'UPDATE accounts SET balance = balance - $1 WHERE id = $2 RETURNING balance',
      [amount, fromId]
    );

    if (debit.rows[0].balance < 0) {
      throw new Error('Insufficient funds');
    }

    await client.query(
      'UPDATE accounts SET balance = balance + $1 WHERE id = $2',
      [amount, toId]
    );

    await client.query('COMMIT');
    return { success: true };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}`
  },
  mongodb: {
    title: 'Aggregation Pipeline',
    priority: 'high',
    prompt: 'Create a MongoDB aggregation pipeline that groups orders by customer and calculates total spent.',
    targetMinutes: 4,
    starterCode: `const { MongoClient } = require('mongodb');

async function getCustomerTotals(db) {
  // TODO: Use aggregation pipeline
  // Group by customerId, sum total, sort by total desc
}`,
    solution: `const { MongoClient } = require('mongodb');

async function getCustomerTotals(db) {
  const orders = db.collection('orders');

  return orders.aggregate([
    {
      $group: {
        _id: '$customerId',
        totalSpent: { $sum: '$total' },
        orderCount: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer'
      }
    },
    { $unwind: '$customer' },
    {
      $project: {
        customerId: '$_id',
        name: '$customer.name',
        totalSpent: 1,
        orderCount: 1
      }
    },
    { $sort: { totalSpent: -1 } }
  ]).toArray();
}`
  },
  redis: {
    title: 'Cache Aside Pattern',
    priority: 'high',
    prompt: 'Implement the cache-aside pattern with Redis. Check cache first, fetch from DB on miss, then populate cache.',
    targetMinutes: 4,
    starterCode: `const redis = require('redis');
const client = redis.createClient();

async function getUser(id) {
  // TODO: Check cache
  // TODO: If miss, fetch from DB
  // TODO: Store in cache with expiry
}`,
    solution: `const redis = require('redis');
const client = redis.createClient();
await client.connect();

async function getUser(id) {
  const cacheKey = \`user:\${id}\`;

  // Check cache
  const cached = await client.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Cache miss - fetch from database
  const user = await db.query('SELECT * FROM users WHERE id = $1', [id]);

  if (user) {
    // Store in cache with 1 hour expiry
    await client.setEx(cacheKey, 3600, JSON.stringify(user));
  }

  return user;
}

async function invalidateUser(id) {
  await client.del(\`user:\${id}\`);
}`
  },
  memcached: {
    title: 'Session Store',
    priority: 'medium',
    prompt: 'Implement a session store using Memcached with get, set, and delete operations.',
    targetMinutes: 3,
    starterCode: `const Memcached = require('memcached');
const memcached = new Memcached('localhost:11211');

// TODO: getSession(sessionId)
// TODO: setSession(sessionId, data, ttl)
// TODO: deleteSession(sessionId)`,
    solution: `const Memcached = require('memcached');
const memcached = new Memcached('localhost:11211');

function getSession(sessionId) {
  return new Promise((resolve, reject) => {
    memcached.get(\`session:\${sessionId}\`, (err, data) => {
      if (err) reject(err);
      else resolve(data ? JSON.parse(data) : null);
    });
  });
}

function setSession(sessionId, data, ttl = 3600) {
  return new Promise((resolve, reject) => {
    memcached.set(\`session:\${sessionId}\`, JSON.stringify(data), ttl, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}

function deleteSession(sessionId) {
  return new Promise((resolve, reject) => {
    memcached.del(\`session:\${sessionId}\`, (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
}`
  },

  // DevOps Engineer
  docker: {
    title: 'Multi-stage Build',
    priority: 'high',
    prompt: 'Create a multi-stage Dockerfile for a Node.js app. Use build stage for dependencies and production stage for runtime.',
    targetMinutes: 4,
    starterCode: `# Dockerfile
# TODO: Build stage with full node image
# TODO: Production stage with slim image
# TODO: Copy only necessary files`,
    solution: `# Build stage
FROM node:20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
USER node
CMD ["node", "dist/index.js"]`
  },
  kubernetes: {
    title: 'Deployment and Service',
    priority: 'high',
    prompt: 'Create a Kubernetes Deployment with 3 replicas and a Service to expose it. Include resource limits and health checks.',
    targetMinutes: 5,
    starterCode: `# deployment.yaml
apiVersion: apps/v1
kind: Deployment
# TODO: metadata, spec, containers, resources, probes

---
# service.yaml
# TODO: Service to expose the deployment`,
    solution: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-app
  template:
    metadata:
      labels:
        app: web-app
    spec:
      containers:
      - name: web-app
        image: myapp:1.0
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 3
---
apiVersion: v1
kind: Service
metadata:
  name: web-app-service
spec:
  selector:
    app: web-app
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer`
  },
  aws: {
    title: 'Lambda with API Gateway',
    priority: 'high',
    prompt: 'Create an AWS Lambda function handler that processes API Gateway events. Parse body, validate, and return proper response.',
    targetMinutes: 4,
    starterCode: `// handler.js
exports.handler = async (event) => {
  // TODO: Parse request body
  // TODO: Validate input
  // TODO: Return API Gateway response format
};`,
    solution: `exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    if (!body.name || !body.email) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'name and email required' })
      };
    }

    // Process the request
    const result = {
      id: Date.now().toString(),
      name: body.name,
      email: body.email,
      createdAt: new Date().toISOString()
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};`
  },
  kafka: {
    title: 'Producer and Consumer',
    priority: 'medium',
    prompt: 'Create a Kafka producer that sends messages and a consumer that processes them. Handle errors gracefully.',
    targetMinutes: 5,
    starterCode: `const { Kafka } = require('kafkajs');

const kafka = new Kafka({ clientId: 'my-app', brokers: ['localhost:9092'] });

// TODO: Create producer and send message
// TODO: Create consumer and process messages`,
    solution: `const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

// Producer
const producer = kafka.producer();

async function sendMessage(topic, message) {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ key: message.key, value: JSON.stringify(message.value) }]
  });
}

// Consumer
const consumer = kafka.consumer({ groupId: 'my-group' });

async function startConsumer(topic, handler) {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = JSON.parse(message.value.toString());
        await handler(value, message.key?.toString());
      } catch (error) {
        console.error('Error processing message:', error);
      }
    }
  });
}

// Usage
startConsumer('orders', async (order, key) => {
  console.log('Processing order:', order);
});`
  },

  // Systems Engineer
  go: {
    title: 'Goroutine Worker Pool',
    priority: 'high',
    prompt: 'Implement a worker pool pattern in Go using goroutines and channels. Process jobs concurrently with a fixed number of workers.',
    targetMinutes: 5,
    starterCode: `package main

type Job struct {
    ID   int
    Data string
}

type Result struct {
    JobID  int
    Output string
}

// TODO: Implement worker function
// TODO: Implement worker pool`,
    solution: `package main

import "fmt"

type Job struct {
    ID   int
    Data string
}

type Result struct {
    JobID  int
    Output string
}

func worker(id int, jobs <-chan Job, results chan<- Result) {
    for job := range jobs {
        result := Result{
            JobID:  job.ID,
            Output: fmt.Sprintf("Worker %d processed: %s", id, job.Data),
        }
        results <- result
    }
}

func main() {
    numWorkers := 3
    numJobs := 10

    jobs := make(chan Job, numJobs)
    results := make(chan Result, numJobs)

    // Start workers
    for w := 1; w <= numWorkers; w++ {
        go worker(w, jobs, results)
    }

    // Send jobs
    for j := 1; j <= numJobs; j++ {
        jobs <- Job{ID: j, Data: fmt.Sprintf("job-%d", j)}
    }
    close(jobs)

    // Collect results
    for r := 1; r <= numJobs; r++ {
        result := <-results
        fmt.Println(result.Output)
    }
}`
  },
  rust: {
    title: 'Ownership Transfer',
    priority: 'high',
    prompt: 'Demonstrate Rust ownership with a function that takes ownership, one that borrows, and one that mutably borrows.',
    targetMinutes: 4,
    starterCode: `fn main() {
    let s = String::from("hello");

    // TODO: take_ownership - moves the string
    // TODO: borrow - reads without taking ownership
    // TODO: borrow_mut - modifies with mutable borrow
}`,
    solution: `fn take_ownership(s: String) {
    println!("Took ownership: {}", s);
    // s is dropped here
}

fn borrow(s: &String) {
    println!("Borrowed: {}", s);
}

fn borrow_mut(s: &mut String) {
    s.push_str(" world");
    println!("Modified: {}", s);
}

fn main() {
    let s1 = String::from("hello");
    borrow(&s1);           // s1 still valid
    println!("After borrow: {}", s1);

    let mut s2 = String::from("hello");
    borrow_mut(&mut s2);   // s2 modified
    println!("After mut borrow: {}", s2);

    let s3 = String::from("hello");
    take_ownership(s3);    // s3 moved
    // println!("{}", s3); // Error: s3 no longer valid
}`
  },
  cpp: {
    title: 'Smart Pointers',
    priority: 'high',
    prompt: 'Demonstrate C++ smart pointers: unique_ptr for exclusive ownership and shared_ptr for shared ownership.',
    targetMinutes: 4,
    starterCode: `#include <memory>
#include <iostream>

class Resource {
public:
    Resource(int id) : id_(id) { std::cout << "Created " << id_ << "\\n"; }
    ~Resource() { std::cout << "Destroyed " << id_ << "\\n"; }
    int id_;
};

int main() {
    // TODO: unique_ptr example
    // TODO: shared_ptr example
}`,
    solution: `#include <memory>
#include <iostream>

class Resource {
public:
    Resource(int id) : id_(id) { std::cout << "Created " << id_ << "\\n"; }
    ~Resource() { std::cout << "Destroyed " << id_ << "\\n"; }
    int id_;
};

int main() {
    // unique_ptr - exclusive ownership
    {
        auto unique = std::make_unique<Resource>(1);
        std::cout << "unique_ptr owns Resource " << unique->id_ << "\\n";
        // auto copy = unique; // Error: cannot copy unique_ptr
        auto moved = std::move(unique); // Transfer ownership
    } // Resource 1 destroyed here

    // shared_ptr - shared ownership
    {
        auto shared1 = std::make_shared<Resource>(2);
        std::cout << "ref count: " << shared1.use_count() << "\\n";
        {
            auto shared2 = shared1; // Copy, increment ref count
            std::cout << "ref count: " << shared1.use_count() << "\\n";
        } // shared2 destroyed, ref count decremented
        std::cout << "ref count: " << shared1.use_count() << "\\n";
    } // Resource 2 destroyed here

    return 0;
}`
  },
  webassembly: {
    title: 'Wasm Module',
    priority: 'medium',
    prompt: 'Create a simple WebAssembly module (in WAT or compiled from C) and load it in JavaScript.',
    targetMinutes: 5,
    starterCode: `// math.wat or math.c
// TODO: Define add and multiply functions

// loader.js
// TODO: Load and instantiate the wasm module
// TODO: Call exported functions`,
    solution: `;; math.wat
(module
  (func $add (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.add
  )
  (func $multiply (param $a i32) (param $b i32) (result i32)
    local.get $a
    local.get $b
    i32.mul
  )
  (export "add" (func $add))
  (export "multiply" (func $multiply))
)

// loader.js
async function loadWasm() {
  const response = await fetch('math.wasm');
  const bytes = await response.arrayBuffer();
  const { instance } = await WebAssembly.instantiate(bytes);

  const { add, multiply } = instance.exports;

  console.log('5 + 3 =', add(5, 3));        // 8
  console.log('5 * 3 =', multiply(5, 3));   // 15
}

loadWasm();`
  },

  // Apple Developer
  swiftui: {
    title: '@State Counter',
    priority: 'high',
    prompt: 'Create a SwiftUI view with a counter using @State. Include increment, decrement, and reset buttons.',
    targetMinutes: 3,
    starterCode: `import SwiftUI

struct CounterView: View {
    // TODO: Add @State for count

    var body: some View {
        // TODO: VStack with count display and buttons
    }
}`,
    solution: `import SwiftUI

struct CounterView: View {
    @State private var count = 0

    var body: some View {
        VStack(spacing: 20) {
            Text("Count: \\(count)")
                .font(.largeTitle)

            HStack(spacing: 20) {
                Button("-") { count -= 1 }
                    .buttonStyle(.bordered)

                Button("Reset") { count = 0 }
                    .buttonStyle(.borderedProminent)

                Button("+") { count += 1 }
                    .buttonStyle(.bordered)
            }
        }
        .padding()
    }
}`
  },
  appkit: {
    title: 'NSTableView Data',
    priority: 'medium',
    prompt: 'Create an NSTableView with a data source that displays a list of items with name and price columns.',
    targetMinutes: 5,
    starterCode: `import Cocoa

struct Item {
    let name: String
    let price: Double
}

class TableViewController: NSViewController {
    // TODO: IBOutlet for table view
    // TODO: Data source array
    // TODO: NSTableViewDataSource methods
}`,
    solution: `import Cocoa

struct Item {
    let name: String
    let price: Double
}

class TableViewController: NSViewController, NSTableViewDataSource, NSTableViewDelegate {
    @IBOutlet weak var tableView: NSTableView!

    var items: [Item] = [
        Item(name: "Widget", price: 9.99),
        Item(name: "Gadget", price: 19.99),
        Item(name: "Gizmo", price: 29.99)
    ]

    override func viewDidLoad() {
        super.viewDidLoad()
        tableView.dataSource = self
        tableView.delegate = self
    }

    func numberOfRows(in tableView: NSTableView) -> Int {
        return items.count
    }

    func tableView(_ tableView: NSTableView, viewFor column: NSTableColumn?, row: Int) -> NSView? {
        let item = items[row]
        let cell = tableView.makeView(withIdentifier: column!.identifier, owner: self) as! NSTableCellView

        if column?.identifier.rawValue == "name" {
            cell.textField?.stringValue = item.name
        } else if column?.identifier.rawValue == "price" {
            cell.textField?.stringValue = String(format: "$%.2f", item.price)
        }

        return cell
    }
}`
  },

  // Data Engineer
  python: {
    title: 'List Comprehension',
    priority: 'high',
    prompt: 'Use list comprehensions to: filter even numbers, transform to squares, and flatten a nested list.',
    targetMinutes: 3,
    starterCode: `numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
nested = [[1, 2], [3, 4], [5, 6]]

# TODO: Get even numbers
evens = []

# TODO: Get squares of evens
squares = []

# TODO: Flatten nested list
flat = []`,
    solution: `numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
nested = [[1, 2], [3, 4], [5, 6]]

# Filter even numbers
evens = [n for n in numbers if n % 2 == 0]
# [2, 4, 6, 8, 10]

# Squares of evens
squares = [n ** 2 for n in numbers if n % 2 == 0]
# [4, 16, 36, 64, 100]

# Flatten nested list
flat = [x for sublist in nested for x in sublist]
# [1, 2, 3, 4, 5, 6]

# Bonus: Dictionary comprehension
square_dict = {n: n ** 2 for n in numbers if n % 2 == 0}
# {2: 4, 4: 16, 6: 36, 8: 64, 10: 100}`
  },
  'js-to-ts': {
    title: 'Type-Safe API Client',
    priority: 'high',
    prompt: 'Convert a plain JavaScript fetch function into a type-safe TypeScript generic. Define an interface for the response, add proper types, and handle errors with a Result type.',
    targetMinutes: 5,
    starterCode: `// Convert this JS function to TypeScript
// Add types for the response, error handling, and make it generic

async function fetchUser(id) {
  const res = await fetch(\`/api/users/\${id}\`);
  const data = await res.json();
  return data;
}

// TODO: Define a User interface
// TODO: Make fetchUser generic: fetchUser<T>(url: string): Promise<T>
// TODO: Add a Result<T> type: { ok: true; data: T } | { ok: false; error: string }`,
    solution: `interface User {
  id: number;
  name: string;
  email: string;
}

type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function fetchJson<T>(url: string): Promise<Result<T>> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: \`HTTP \${res.status}\` };
    const data: T = await res.json();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

// Usage
const result = await fetchJson<User>('/api/users/1');
if (result.ok) {
  console.log(result.data.name); // type: string
} else {
  console.error(result.error);
}`
  },
  scala: {
    title: 'Case Class Pattern Match',
    priority: 'high',
    prompt: 'Define a sealed trait with case classes for shapes. Implement pattern matching to calculate area.',
    targetMinutes: 4,
    starterCode: `// TODO: Define sealed trait Shape
// TODO: Case classes: Circle, Rectangle, Triangle

// TODO: Function to calculate area using pattern matching
def area(shape: Shape): Double = ???`,
    solution: `sealed trait Shape

case class Circle(radius: Double) extends Shape
case class Rectangle(width: Double, height: Double) extends Shape
case class Triangle(base: Double, height: Double) extends Shape

def area(shape: Shape): Double = shape match {
  case Circle(r) => Math.PI * r * r
  case Rectangle(w, h) => w * h
  case Triangle(b, h) => 0.5 * b * h
}

// Usage
val shapes: List[Shape] = List(
  Circle(5),
  Rectangle(4, 6),
  Triangle(3, 4)
)

shapes.foreach { s =>
  println(s"\$s has area \${area(s)}")
}

// Output:
// Circle(5.0) has area 78.54
// Rectangle(4.0,6.0) has area 24.0
// Triangle(3.0,4.0) has area 6.0`
  }
};

const DDL = `CREATE TABLE IF NOT EXISTS Courses (
  _id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT,
  estimatedHours INTEGER,
  tags TEXT,
  order_index INTEGER,
  published INTEGER NOT NULL DEFAULT 1,
  guideCount INTEGER DEFAULT 0,
  quizCount INTEGER DEFAULT 0,
  repCount INTEGER DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_slug ON Courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published_order ON Courses(published, order_index);

CREATE TABLE IF NOT EXISTS Guides (
  _id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT,
  estimatedMinutes INTEGER,
  timeToProductive TEXT,
  timeToProficient TEXT,
  interviewReady TEXT,
  order_index INTEGER,
  published INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (courseId) REFERENCES Courses(_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_guides_course_slug ON Guides(courseId, slug);
CREATE INDEX IF NOT EXISTS idx_guides_course_order ON Guides(courseId, order_index);
CREATE INDEX IF NOT EXISTS idx_guides_course_published ON Guides(courseId, published);

CREATE TABLE IF NOT EXISTS Quizzes (
  _id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  guideSlug TEXT,
  guideId TEXT,
  passingScore INTEGER DEFAULT 70,
  totalPoints INTEGER DEFAULT 0,
  order_index INTEGER,
  published INTEGER NOT NULL DEFAULT 1,
  questions TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (courseId) REFERENCES Courses(_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_quizzes_course_slug ON Quizzes(courseId, slug);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_guide ON Quizzes(courseId, guideId);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_guideslug ON Quizzes(courseId, guideSlug);
CREATE INDEX IF NOT EXISTS idx_quizzes_course_published_order ON Quizzes(courseId, published, order_index);

CREATE TABLE IF NOT EXISTS Reps (
  _id TEXT PRIMARY KEY,
  courseId TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT,
  priority TEXT,
  prompt TEXT,
  targetMinutes INTEGER,
  starterCode TEXT,
  solution TEXT,
  keyPoints TEXT NOT NULL DEFAULT '[]',
  hints TEXT NOT NULL DEFAULT '[]',
  order_index INTEGER,
  published INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (courseId) REFERENCES Courses(_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_reps_course_slug ON Reps(courseId, slug);
CREATE INDEX IF NOT EXISTS idx_reps_course_category_order ON Reps(courseId, category, order_index);
CREATE INDEX IF NOT EXISTS idx_reps_course_priority ON Reps(courseId, priority);
CREATE INDEX IF NOT EXISTS idx_reps_course_published ON Reps(courseId, published);

CREATE TABLE IF NOT EXISTS Enrollments (
  _id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  enrolledAt TEXT NOT NULL,
  completedAt TEXT,
  updatedAt TEXT,
  FOREIGN KEY (userId) REFERENCES Users(_id),
  FOREIGN KEY (courseId) REFERENCES Courses(_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_user_course ON Enrollments(userId, courseId);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON Enrollments(userId, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON Enrollments(courseId);

CREATE TABLE IF NOT EXISTS UserProgress (
  _id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courseId TEXT NOT NULL,
  completedGuides TEXT NOT NULL DEFAULT '[]',
  quizAttempts TEXT NOT NULL DEFAULT '[]',
  repAttempts TEXT NOT NULL DEFAULT '[]',
  totalTimeSpentMinutes INTEGER NOT NULL DEFAULT 0,
  lastActivityAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES Users(_id),
  FOREIGN KEY (courseId) REFERENCES Courses(_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_userprogress_user_course ON UserProgress(userId, courseId);
CREATE INDEX IF NOT EXISTS idx_userprogress_user ON UserProgress(userId);

CREATE TABLE IF NOT EXISTS Bookmarks (
  _id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  courseSlug TEXT NOT NULL,
  guideSlug TEXT NOT NULL,
  sectionTitle TEXT NOT NULL,
  bookmarkedAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES Users(_id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_user_course_guide_section ON Bookmarks(userId, courseSlug, guideSlug, sectionTitle);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_time ON Bookmarks(userId, bookmarkedAt);`;

async function seed() {
  const dbPath = process.env.SQLITE_DB_PATH || './databases/AppSchool.db';

  // Ensure parent directory exists
  try {
    mkdirSync('./databases', { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  const db = new DatabaseSync(dbPath);

  try {
    // WAL pragmas matching adapters/sqlite.js
    db.exec('PRAGMA journal_mode = WAL');
    db.exec('PRAGMA synchronous = NORMAL');
    db.exec('PRAGMA cache_size = 1000');
    db.exec('PRAGMA temp_store = memory');

    // Create tables + indexes
    db.exec(DDL);
    console.log(`Connected to SQLite (${dbPath})`);

    // Prepared statements
    const findCourse = db.prepare('SELECT _id FROM Courses WHERE slug = ?');
    const insertCourse = db.prepare(`INSERT INTO Courses
      (_id, slug, title, description, difficulty, estimatedHours, tags, order_index, published, guideCount, quizCount, repCount, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    const updateCourse = db.prepare(`UPDATE Courses SET
      title = ?, description = ?, difficulty = ?, estimatedHours = ?, tags = ?, order_index = ?, quizCount = ?, repCount = ?, updatedAt = ?
      WHERE _id = ?`);

    const findGuide = db.prepare('SELECT _id FROM Guides WHERE slug = ? AND courseId = ?');
    const insertGuide = db.prepare(`INSERT INTO Guides
      (_id, courseId, slug, title, category, content, estimatedMinutes, timeToProductive, timeToProficient, interviewReady, order_index, published, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    const findQuiz = db.prepare('SELECT _id FROM Quizzes WHERE slug = ? AND courseId = ?');
    const insertQuiz = db.prepare(`INSERT INTO Quizzes
      (_id, courseId, slug, title, description, guideSlug, passingScore, totalPoints, order_index, published, questions, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    const findRep = db.prepare('SELECT _id FROM Reps WHERE slug = ? AND courseId = ?');
    const insertRep = db.prepare(`INSERT INTO Reps
      (_id, courseId, slug, title, category, priority, prompt, targetMinutes, starterCode, solution, keyPoints, hints, order_index, published, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

    console.log(`Processing ${COURSES.length} courses...`);

    for (const courseData of COURSES) {
      const { guides, extraReps = [], ...courseFields } = courseData;

      // Count quizzes and reps for this course
      let quizCount = 0;
      let repCount = extraReps.length;
      for (const guide of guides) {
        if (QUIZZES[guide.slug]) quizCount++;
        if (REPS[guide.slug]) repCount++;
      }

      // Check if course exists
      const existingCourse = findCourse.get(courseData.slug);
      let courseId;
      const nowIso = new Date().toISOString();

      if (existingCourse) {
        courseId = existingCourse._id;
        // Update course with new counts
        updateCourse.run(
          courseFields.title,
          courseFields.description ?? null,
          courseFields.difficulty ?? null,
          courseFields.estimatedHours ?? null,
          JSON.stringify(courseFields.tags ?? []),
          courseFields.order ?? null,
          quizCount,
          repCount,
          nowIso,
          courseId
        );
        console.log(`Updated course: ${courseData.title}`);
      } else {
        // Insert new course
        courseId = crypto.randomUUID();
        insertCourse.run(
          courseId,
          courseFields.slug,
          courseFields.title,
          courseFields.description ?? null,
          courseFields.difficulty ?? null,
          courseFields.estimatedHours ?? null,
          JSON.stringify(courseFields.tags ?? []),
          courseFields.order ?? null,
          1,
          guides.length,
          quizCount,
          repCount,
          nowIso,
          nowIso
        );
        console.log(`Created course: ${courseData.title}`);
      }

      // Process guides, quizzes, and reps for this course
      for (let i = 0; i < guides.length; i++) {
        const guideInfo = guides[i];
        const filePath = join(GUIDES_DIR, guideInfo.file);

        try {
          const content = readFileSync(filePath, 'utf-8');
          const title = guideInfo.title || extractTitle(content);
          const estimatedMinutes = calculateReadingTime(content);
          const ts = new Date().toISOString();

          // Upsert guide
          const existingGuide = findGuide.get(guideInfo.slug, courseId);
          if (!existingGuide) {
            insertGuide.run(
              crypto.randomUUID(),
              courseId,
              guideInfo.slug,
              title,
              guideInfo.category ?? null,
              content,
              estimatedMinutes,
              guideInfo.timeToProductive ?? null,
              guideInfo.timeToProficient ?? null,
              guideInfo.interviewReady ?? null,
              i + 1,
              1,
              ts,
              ts
            );
            console.log(`  - ${title} (${estimatedMinutes} min)`);
          } else {
            console.log(`  - ${title} (exists)`);
          }

          // Upsert quiz if exists in QUIZZES
          const quizData = QUIZZES[guideInfo.slug];
          if (quizData) {
            const existingQuiz = findQuiz.get(guideInfo.slug, courseId);
            if (!existingQuiz) {
              const totalPoints = quizData.questions.length * 10;
              insertQuiz.run(
                crypto.randomUUID(),
                courseId,
                guideInfo.slug,
                quizData.title,
                quizData.description ?? null,
                guideInfo.slug,
                70,
                totalPoints,
                i + 1,
                1,
                JSON.stringify(quizData.questions),
                ts,
                ts
              );
              console.log(`    + Quiz: ${quizData.title} (${quizData.questions.length} questions)`);
            } else {
              console.log(`    + Quiz: ${quizData.title} (exists)`);
            }
          }

          // Upsert rep if exists in REPS
          const repData = REPS[guideInfo.slug];
          if (repData) {
            const repSlug = `${guideInfo.slug}-1`;
            const existingRep = findRep.get(repSlug, courseId);
            if (!existingRep) {
              insertRep.run(
                crypto.randomUUID(),
                courseId,
                repSlug,
                repData.title,
                guideInfo.slug,
                repData.priority ?? null,
                repData.prompt ?? null,
                repData.targetMinutes ?? null,
                repData.starterCode ?? null,
                repData.solution ?? null,
                JSON.stringify([]),
                JSON.stringify([]),
                i + 1,
                1,
                ts,
                ts
              );
              console.log(`    + Rep: ${repData.title} (${repData.targetMinutes} min)`);
            } else {
              console.log(`    + Rep: ${repData.title} (exists)`);
            }
          }

        } catch (err) {
          console.error(`  - Error reading ${guideInfo.file}: ${err.message}`);
        }
      }

      // Course-level reps (solution read verbatim from a file under new-reps/)
      for (let r = 0; r < extraReps.length; r++) {
        const repInfo = extraReps[r];
        try {
          const solution = readFileSync(join(REPS_DIR, repInfo.file), 'utf-8');
          const existingRep = findRep.get(repInfo.slug, courseId);
          if (!existingRep) {
            const ts = new Date().toISOString();
            insertRep.run(
              crypto.randomUUID(),
              courseId,
              repInfo.slug,
              repInfo.title,
              repInfo.category ?? null,
              repInfo.priority ?? null,
              repInfo.prompt ?? null,
              repInfo.targetMinutes ?? null,
              repInfo.starterCode ?? '',
              solution,
              JSON.stringify([]),
              JSON.stringify([]),
              r + 1,
              1,
              ts,
              ts
            );
            console.log(`    + Rep: ${repInfo.title} (${repInfo.targetMinutes} min)`);
          } else {
            console.log(`    + Rep: ${repInfo.title} (exists)`);
          }
        } catch (err) {
          console.error(`  - Error reading rep ${repInfo.file}: ${err.message}`);
        }
      }
    }

    console.log('\nSeeding complete!');

    // Summary
    const totalCourses = db.prepare('SELECT COUNT(*) AS c FROM Courses').get().c;
    const totalGuides = db.prepare('SELECT COUNT(*) AS c FROM Guides').get().c;
    const totalQuizzes = db.prepare('SELECT COUNT(*) AS c FROM Quizzes').get().c;
    const totalReps = db.prepare('SELECT COUNT(*) AS c FROM Reps').get().c;
    console.log(`Total courses: ${totalCourses}`);
    console.log(`Total guides: ${totalGuides}`);
    console.log(`Total quizzes: ${totalQuizzes}`);
    console.log(`Total reps: ${totalReps}`);

  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

seed();
