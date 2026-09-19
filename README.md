<div align="center">

  <p align="center" style="margin-top: 40px; margin-bottom: 5px;">
    <img src="public/icons/icon.png" width="60" height="60" alt="AppSchool Logo">
  </p>
  <h1 align="center" style="border-bottom: none; margin-bottom: 0;">AppSchool</h1>
  <h3 align="center" style="margin-top: 0; font-weight: normal;">
    interview prep for js/react and swift/ios developers, with react, rust, and sqlite
  </h3>

  <p align="center">
    <a href="https://www.appschool.com"><strong>Website</strong></a> · <a href="docs/GUIDE.md"><strong>Docs</strong></a>
  </p>

</div>

<br />

## Quick Start

```bash
git clone https://github.com/stevederico/appschool
cd appschool
npm run install-all
npm run start             # frontend  http://localhost:5173
cd backend && cargo run   # backend   http://localhost:8000
```

The repo ships a seeded SQLite database, so courses load on first run. Frontend is Vite. Backend is Rust (`cargo run`).

<br />

## ✨ What's Included

### 📚 **Courses**
- **9 courses** covering frontend, backend, DevOps, systems, data, Rust, TypeScript, Apple platforms, and iOS interviews
- **Markdown guides** with syntax-highlighted code, read at your own pace
- **Quizzes** graded on the server, with a passing score per quiz
- **Timed reps** in a Monaco code editor for hands-on practice

### 📈 **Progress**
- **Progress checklists** per course, with time estimates for each guide and rep
- **Bookmarks** to save sections of a guide
- **Enrollments** so each learner tracks their own courses

### 🔐 **Accounts & Payments**
- **Sign up / Sign in** with HS256 JWT in HttpOnly cookies
- **Stripe checkout** and a customer portal for subscriptions
- **Webhook handling** for payment events

### 🛠️ **Developer Experience**
- **Zero-crate Rust backend** with system libsqlite3 and libcurl
- **TypeScript strict mode** with `npm run typecheck` gating build and test
- **Blog workspace** for posts, run with `npm run blog`

<br />

## 📖 Frontend Configuration

Update `src/constants.json` to customize the app name, tagline, landing page, and API URLs:

```json
{
  "appName": "AppSchool",
  "tagline": "Learn To Code",
  "backendURL": "/api",
  "devBackendURL": "http://localhost:8000/api"
}
```

## 📖 Backend Configuration

`backend/config.json` points the backend at its database:

```json
{
  "staticDir": "../dist",
  "database": {
    "db": "AppSchool",
    "dbType": "sqlite",
    "connectionString": "./databases/AppSchool.db"
  }
}
```

Add secrets to `backend/.env` (never commit it):

```bash
JWT_SECRET=your-secret-key
STRIPE_KEY=sk_test_...
STRIPE_ENDPOINT_SECRET=whsec_...
XAI_API_KEY=xai-...   # optional, mints ephemeral voice tokens
```

**Security Note:** Use a Stripe restricted key with **Read/Write** on Checkout Sessions and **Read** on Customers, Prices, and Products. See [docs/DEPLOY.md](docs/DEPLOY.md) for every production variable.

<br />

## 🏗️ Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | v19.2 | UI Framework |
| **skateboard-ui** | v5.1 | Application Shell, Components, Theming |
| **Vite** | v8 | Build Tool & Dev Server |
| **Tailwind CSS** | v4.3 | Styling |
| **React Router** | v7.18 | Routing (via skateboard-ui) |
| **Monaco Editor** | v4.7 | Code editor for reps |
| **lucide-react** | v0.546 | Icons |
| **TypeScript** | v7 | Frontend types (strict) |
| **Node.js** | v24+ | Frontend toolchain |
| **Rust** | 1.95+ | Zero-crate backend |
| **SQLite** | system lib | Database |
| **Stripe** | REST + libcurl | Payments |

<br />

## Architecture

The frontend is an application shell: **skateboard-ui** owns routing, auth, layout, and theming, and this app supplies routes, views, and `src/constants.json`. Course content lives in SQLite (`Courses`, `Guides`, `Quizzes`, `Reps`) and is served by the Rust backend. A seed script (`backend/seed/seed-new-courses.js`) loads guides from `backend/new-guides/`.

```typescript
import { createSkateboardApp } from '@stevederico/skateboard-ui/App';
import constants from './constants.json';
import CoursesView from './components/CoursesView';

createSkateboardApp({
  constants,
  appRoutes: [{ path: 'courses', element: <CoursesView /> }],
});
```

Full write-up in [docs/GUIDE.md](docs/GUIDE.md#architecture). Contributor and agent notes live in [AGENTS.md](AGENTS.md).

<br />

## Deployment

See [docs/DEPLOY.md](docs/DEPLOY.md) for the Docker image, environment variables, database volume, and Stripe webhook setup.

<br />

## Contributing

```bash
# Fork the repo, then:
git clone https://github.com/YOUR_USERNAME/appschool
cd appschool
npm run install-all
npm run test                      # typecheck + script tests
cd backend && cargo test --locked # backend tests
```

<br />

## 📬 Community & Support

- **🐦 X**: [@stevederico](https://x.com/stevederico)
- **🐛 Issues**: [GitHub Issues](https://github.com/stevederico/appschool/issues)

<br />

## 🙏 Acknowledgements

- [React](https://react.dev) - The library that powers the web
- [Vite](https://vite.dev) - Lightning fast build tool
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - The editor behind VS Code
- [Rust](https://www.rust-lang.org) - Zero-crate backend
- [Stripe](https://stripe.com) - Payment infrastructure

<br />

## 🎪 Related Projects

- [skateboard](https://github.com/stevederico/skateboard) - The boilerplate this app is built on
- [skateboard-ui](https://github.com/stevederico/skateboard-ui) - Component library

<br />

## 🚀 Ready to Learn?

```bash
git clone https://github.com/stevederico/appschool && cd appschool && npm run install-all && npm run start
```

<br />

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

<br />

---

<div align="center">
  Made with <a href="https://github.com/stevederico/skateboard">Skateboard</a> — a React boilerplate with auth and payments
</div>
