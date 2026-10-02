import { useEffect, useState } from 'react';

// Tiny hash router: #/users/abc → ['users', 'abc']. Hash routes work on static hosting with no rewrites.
function read(): string[] {
  return window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
}

export function useRoute(): string[] {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const onChange = () => {
      setRoute(read());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function go(path: string) {
  window.location.hash = `#/${path}`;
}

export const href = (path: string) => `#/${path}`;
