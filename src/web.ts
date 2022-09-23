import { WebPlugin } from '@capacitor/core';

import type { NativeNavigationPlugin } from './definitions';

export class NativeNavigationWeb
  extends WebPlugin
  implements NativeNavigationPlugin
{
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
