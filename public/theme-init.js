/**
 * Apply the brutalist theme and the saved or system color scheme before paint.
 *
 * Classic (non-module) script so it runs while parsing and avoids a light-theme
 * flash. Served from /theme-init.js (public/) so CSP script-src 'self' allows it
 * without 'unsafe-inline'.
 *
 * Sets both classes src/assets/styles.css keys on: `theme-brutalist` always, and
 * `dark` when the saved theme is 'dark' or, with no saved 'light' or 'dark'
 * (unset or 'system'), when the system prefers dark. Same rule skateboard-ui
 * applies once the app boots.
 */
(function () {
  var root = document.documentElement;
  root.classList.add('theme-brutalist');
  var savedTheme = null;
  try {
    savedTheme = localStorage.getItem('theme');
  } catch (e) {
    // Storage can be unavailable (private mode, some web views): follow the system
  }
  var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  var isDark = savedTheme === 'dark' || (savedTheme !== 'light' && systemPrefersDark);
  if (isDark) {
    root.classList.add('dark');
  }
})();
