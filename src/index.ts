import { registerPlugin } from '@capacitor/core';

import type { NativeNavigationPlugin } from './definitions';

const NativeNavigation = registerPlugin<NativeNavigationPlugin>(
  'NativeNavigation',
  {
    web: () => import('./web').then(m => new m.NativeNavigationWeb()),
  },
);

export * from './definitions';
export { NativeNavigation };
