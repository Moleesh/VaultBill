export type ResponsiveViewport = {
  readonly name: string;
  readonly width: number;
  readonly height: number;
};

export const requiredResponsiveViewports: readonly ResponsiveViewport[] = [
  { name: 'Small mobile', width: 320, height: 568 },
  { name: 'Standard mobile', width: 390, height: 844 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'Wide desktop', width: 1920, height: 1080 },
];

export const getViewportColumnMode = (
  viewport: ResponsiveViewport,
): 'Single' | 'Double' | 'Triple' => {
  if (viewport.width < 640) {
    return 'Single';
  }

  if (viewport.width < 1200) {
    return 'Double';
  }

  return 'Triple';
};
