export interface NativeNavigationPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
