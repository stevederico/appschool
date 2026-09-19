0.35.0

  Rewrite README
  Add deploy guide
  Fix production notes
  Sync lockfile version

0.34.0

  Update AGENTS.md

0.33.0

  Remove personal email

0.32.0

  Vacuum shipped database

0.31.0

  Remove iOS reps
  Drop new-reps folder
  Update Dockerfile
  Reseed shipped database

0.30.0

  Remove personal iOS guides
  Scrub names from guides
  Drop interview quiz
  Reseed shipped database

0.29.0

  Drop sonner. Enroll errors render inline.

0.28.0

  Upgrade skateboard 4.11.0 to 5.6.0
  Replace Hono JS backend with zero-crate Rust backend
  Port courses, guides, quizzes, reps, enrollments, progress, bookmarks to db.rs
  Preserve new-guides/ and new-reps/ filesystem fallback when DB content is empty
  Mint xAI voice tokens via POST /api/xai/token (XAI_API_KEY stays on the server)
  Move icons to lucide-react after skateboard-ui dropped the subpath exports
  Repin react-router 7.15.0 as a direct dependency
  Drop dead npm scripts left by the JS backend
  Treat ENV=production as prod (Railway)
  Copy constants.json in Docker
  Pin react-router 7.18.3 to match skateboard-ui
  Prebundle cookie for Vite
  Remove dead ChatBot study assistant

0.27.0

  Roll back webhook record on failure
  Add deleteWebhookEvent adapter method

0.26.0

  Refresh shipped AppSchool.db with iOS quizzes and reps
  Seed volume DB on first boot
  Gitignore railway.json

## CHANGELOG

0.25.0

  Import 48 xPrep reps into iOS course
  Add 11 iOS quizzes (110 questions)
  Cover Swift SwiftUI UIKit Combine APIs

0.24.0

  Migrate xAI TTS to grok-voice-latest API
  Open-speak-close; built-in Grok voices
  Add /api/xai/token ephemeral mint

0.23.0

  Add brutalist theme
  Orange accent sharp corners
  Mono uppercase nav

0.22.0

  Add async db facade
  Port AppSchool models libsql
  Add content import script
  Fix courses 500 prod

0.21.0

  Fix dev backendURL port (8001 -> 8000)
  Stop gitignoring *.db so Railway ships AppSchool.db (fixes empty prod courses)

0.20.0

  Update dev backendURL

0.19.0

  Add AppSchool API
  Wire SQLite models
  Add course routes
  Add quiz grading
  Add progress tracking
  Add bookmarks endpoints

0.18.0

  Add iOS reps
  Add reference guides
  Copy xPrep reps
  Add extraReps mechanism
  Reseed SQLite db

0.17.0

  Add iOS course
  Copy xPrep guides
  Twelve verbatim guides
  Override guide titles
  Reseed SQLite db

0.16.0

  Convert MongoDB to SQLite
  Use node:sqlite builtin
  Convert seed script
  Convert all models
  Drop mongodb dependency
  Delete dead scripts
  Seed SQLite db
  Add TypeScript course
  Add Rust course
  Update docs SQLite

0.15.0

  Bump skateboard 3.4.0
  Drop demo scaffolding
  Migrate to react-router

0.14.0

  Merge AppSchool-Blog into appschool-web
  Fix blog prod path to appschool-proxy

0.13.0

  Open source audit fixes
  Remove internal infrastructure refs
  Raise minimum password length

0.12.0

  Add useAuthGate enroll guard
  Add enroll error toasts
  Parse API error messages

0.11.0

  Open source preparation
  Remove internal docs
  Update env configuration

0.10.0

  Add advanced analytics tracking
  Add AnalyticsProvider wrapper
  Add localhost analytics guard

0.9.8

  Switch chat provider to xAI
  Update model to grok-4-1

0.9.7

  Fix backendURL validation
  Add /api to constants
  Remove redundant /api from fetches

0.9.6

  Fix double /api prefix
  Simplify isProd check
  Remove .env auto-create

0.9.5

  Align skateboard 1.5.x
  Update skateboard-ui 1.5.2
  Add ESM shims
  Add base /app/ path
  Switch bcryptjs
  Add CSRF logging
  Add dark mode CSS
  Add JSDoc adapters
  Add FRONTEND_URL origin
  Add paymentLimiter portal
  Add shutdown error handling

0.9.4

  Add Dockerfile node:22-alpine
  Add dockerignore
  Fix backend URL

0.9.3

  Add skip code TTS option
  Update settings to modal
  Add rep priority breakdown
  Fix quiz answer display
  Update bookmark styling
  Add TTS breathing instructions

0.9.2

  Add word count calculation
  Replace estimatedMinutes with wordCount
  Add dynamic reading time

0.9.1

  Remove QuizView header
  Sort quiz options by ID

0.9.0

  Remove Header components
  Simplify view layouts

0.8.9

  Add bookmark system
  Add bookmark API routes
  Add BookmarksView page
  Add guide bookmark button
  Add guideSlug to progress

0.8.8

  Add ChatBot study assistant
  Add chat session management
  Add chat API endpoints
  Remove backend scripts

0.8.7

  Remove pending items list
  Simplify progress view

0.8.6

  Add completion timestamps API
  Refactor progress to timeline
  Simplify course card layout
  Remove unenroll feature

0.8.5

  Add progress bar per type
  Add time remaining calc
  Fix TTS text chunking
  Update category to review
  Move difficulty to tags

0.8.4

  Fix quiz score calculation
  Sort quizzes by guide order
  Add rep priority display
  Sort reps by priority

0.8.3

  Add OpenAI TTS provider
  Add TTS voice selection
  Add TTS settings panel
  Add audio prefetching
  Add TTS caching backend

0.8.2

  Update checklist attempt format
  Sort enrolled courses first

0.8.1

  Remove editor headers
  Add solution toggle button
  Update complete tag style
  Fix reset button behavior
  Hide solution on start

0.8.0

  Add whitespace-blind code check
  Add auto-record all attempts
  Update attempts display layout
  Fix rep recording on check
  Move tags to timer right

0.7.0

  Add rep timer with start/pause/reset
  Add rep code comparison diff view
  Add rep attempt history tracking
  Add rep under-target indicators
  Add quiz option shuffling
  Add quiz best score display
  Fix quiz results key name
  Update progress checklist UI

0.6.0

  Update Swift/iOS quizzes
  Add 223 quiz questions
  Add comprehensive coverage

0.5.0

  Add slide mode for guides
  Add voice narration
  Add voice speed control
  Add auto-advance option
  Add keyboard navigation

0.4.0

  Fix quiz slug routing
  Fix quiz submission grading
  Add quiz slug to checklist
  Add estimated time display
  Fix guide titles in DB
  Fix reading time in content
  Remove personal names
  Fix UIKit guide formatting
  Add UIKit code examples
  Fix inline code rendering

0.3.0

  Update skateboard-ui 1.2.15
  Migrate Express to Hono
  Add Hono middleware
  Update vite optimizeDeps
  Update config.json

0.2.0

  Add course system
  Add guides view
  Add quizzes view
  Add reps view
  Add progress tracking
  Add code editor
  Add markdown renderer
  Add course enrollment
  Fix course content counts
