import './assets/styles.css';
import { createSkateboardApp } from '@stevederico/skateboard-ui/App';
import type { AppRoute } from '@stevederico/skateboard-ui/App';
import Layout from '@stevederico/skateboard-ui/Layout';
import constants from './constants.json';
import AnalyticsProvider from './components/AnalyticsProvider';
import CommandMenu from './components/CommandMenu';

if (import.meta.env.VITE_ANALYTICS_ID && import.meta.env.VITE_ANALYTICS_SRC) {
  const s = document.createElement('script');
  s.defer = true;
  s.src = import.meta.env.VITE_ANALYTICS_SRC;
  s.dataset.websiteId = import.meta.env.VITE_ANALYTICS_ID;
  document.head.appendChild(s);
}
import HomeView from './components/HomeView';
import ChatView from './components/ChatView';
import CoursesView from './components/CoursesView';
import CourseDetailView from './components/CourseDetailView';
import GuideView from './components/GuideView';
import QuizView from './components/QuizView';
import RepView from './components/RepView';
import ProgressView from './components/ProgressView';
import BookmarksView from './components/BookmarksView';

/**
 * App layout with global command menu overlay.
 *
 * Wraps the default skateboard-ui Layout and injects CommandMenu
 * so the Cmd+K shortcut is available on all authenticated routes.
 *
 * @returns Layout with command menu
 */
function AppLayout() {
  return (
    <>
      <CommandMenu />
      <Layout />
    </>
  );
}

const appRoutes: AppRoute[] = [
  { path: 'home', element: <HomeView /> },
  { path: 'chat', element: <ChatView /> },
  { path: 'courses', element: <CoursesView /> },
  { path: 'courses/:slug', element: <CourseDetailView /> },
  { path: 'courses/:slug/guides/:guideSlug', element: <GuideView /> },
  { path: 'courses/:slug/quizzes/:guideSlug', element: <QuizView /> },
  { path: 'courses/:slug/reps/:repSlug', element: <RepView /> },
  { path: 'bookmarks', element: <BookmarksView /> },
  { path: 'progress', element: <ProgressView /> }
];

createSkateboardApp({
  constants,
  appRoutes,
  defaultRoute: 'courses',
  wrapper: AnalyticsProvider,
  overrides: { layout: AppLayout }
});
