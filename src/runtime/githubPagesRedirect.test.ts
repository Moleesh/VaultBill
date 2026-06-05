import { describe, expect, it } from 'vitest';

import { getCanonicalBasePath, restoreGithubPagesRoute } from './githubPagesRedirect';

describe('GitHub Pages routing', () => {
  it('returns a normalized canonical base path', () => {
    expect(getCanonicalBasePath()).toBe('/');
  });

  it('restores a deep route passed by the Pages fallback', () => {
    window.history.replaceState(null, '', '/?route=%2Fapp%2Freports');
    restoreGithubPagesRoute();
    expect(window.location.pathname).toBe('/app/reports');
  });
});
