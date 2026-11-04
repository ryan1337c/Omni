// The package entry runs a debug self-test when loaded outside a bundler; the library entry doesn't.
declare module "pdf-parse/lib/pdf-parse.js" {
  import type { Options, Result } from "pdf-parse";

  export default function pdf(data: Buffer | Uint8Array, options?: Options): Promise<Result>;
}
