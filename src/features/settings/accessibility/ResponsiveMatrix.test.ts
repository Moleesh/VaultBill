import { describe, expect, it } from 'vitest';

import { getViewportColumnMode, requiredResponsiveViewports } from './ResponsiveMatrix';

describe('ResponsiveMatrix', () => {
  const getRequiredViewport = (index: number) => {
    const viewport = requiredResponsiveViewports[index];

    if (!viewport) {
      throw new Error(`Missing required viewport at index ${String(index)}`);
    }

    return viewport;
  };

  it('tracks every required viewport from the spec', () => {
    expect(requiredResponsiveViewports.map((viewport) => viewport.name)).toEqual([
      'Small mobile',
      'Standard mobile',
      'Tablet',
      'Laptop',
      'Desktop',
      'Wide desktop',
    ]);
  });

  it('maps required viewport widths to usable column modes', () => {
    expect(getViewportColumnMode(getRequiredViewport(0))).toBe('Single');
    expect(getViewportColumnMode(getRequiredViewport(2))).toBe('Double');
    expect(getViewportColumnMode(getRequiredViewport(5))).toBe('Triple');
  });
});
