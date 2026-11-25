import { HttpError } from './http.js';

export function createRouter() {
  const routes = [];

  function add(method, pattern, handler, options = {}) {
    const keys = [];
    const source = pattern
      .split('/')
      .map((part) => {
        if (part.startsWith(':')) {
          keys.push(part.slice(1));
          return '([^/]+)';
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      })
      .join('/');
    routes.push({ method, regex: new RegExp(`^${source}$`), keys, handler, options });
  }

  return {
    get: (p, h, o) => add('GET', p, h, o),
    post: (p, h, o) => add('POST', p, h, o),
    patch: (p, h, o) => add('PATCH', p, h, o),
    put: (p, h, o) => add('PUT', p, h, o),
    delete: (p, h, o) => add('DELETE', p, h, o),
    match(method, pathname) {
      for (const route of routes) {
        if (route.method !== method) continue;
        const match = route.regex.exec(pathname);
        if (!match) continue;
        const params = {};
        route.keys.forEach((key, i) => {
          params[key] = decodeURIComponent(match[i + 1]);
        });
        return { route, params };
      }
      return null;
    },
    hasPath(pathname) {
      return routes.some((r) => r.regex.test(pathname));
    }
  };
}

export { HttpError };
