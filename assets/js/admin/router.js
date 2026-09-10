const DEFAULT_HASH = '#/today';

const PATTERNS = [
  { name: 'today', re: /^\/today$/, keys: [] },
  { name: 'queue', re: /^\/queue$/, keys: [] },
  { name: 'grade', re: /^\/grade\/([^/?]+)$/, keys: ['id'] },
  { name: 'results', re: /^\/students\/([^/?]+)\/results\/([^/?]+)$/, keys: ['uid', 'courseId'] },
  { name: 'student', re: /^\/students\/([^/?]+)$/, keys: ['uid'] },
  { name: 'students', re: /^\/students$/, keys: [] }
];

export function parseRoute(hash) {
  const [path, search = ''] = (hash || '').replace(/^#/, '').split('?');
  for (const { name, re, keys } of PATTERNS) {
    const match = re.exec(path);
    if (!match) continue;
    const params = Object.fromEntries(keys.map((key, i) => [key, decodeURIComponent(match[i + 1])]));
    return { name, params, query: Object.fromEntries(new URLSearchParams(search)) };
  }
  return null;
}

// Views implement mount(root, route, ctx) and return { dispose, ready }.
export function createRouter({ window, root, routes, ctx, onRoute }) {
  let current = null;
  let renderedHash = null;
  let pending = Promise.resolve();

  function render() {
    let route = parseRoute(window.location.hash);
    if (!route) {
      window.history.replaceState(null, '', DEFAULT_HASH);
      route = parseRoute(DEFAULT_HASH);
    }
    if (route.name === 'results') {
      window.history.replaceState(null, '', `#/students/${encodeURIComponent(route.params.uid)}`);
      route = parseRoute(window.location.hash);
    }
    if (window.location.hash === renderedHash) return pending;
    renderedHash = window.location.hash;
    current?.dispose?.();
    root.innerHTML = '';
    current = routes[route.name].mount(root, route, ctx) || {};
    const heading = root.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus();
    }
    onRoute?.(route);
    pending = Promise.resolve(current.ready);
    return pending;
  }

  const onHashChange = () => { render(); };

  function navigate(path) {
    window.location.hash = path;
    return render();
  }

  ctx.navigate = navigate;

  return {
    navigate,
    ready: () => pending,
    start() {
      window.addEventListener('hashchange', onHashChange);
      return render();
    },
    stop() {
      window.removeEventListener('hashchange', onHashChange);
    }
  };
}
