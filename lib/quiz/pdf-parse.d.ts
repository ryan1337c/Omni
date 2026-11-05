// The package entry runs a debug self-test when loaded outside a bundler; the library entry doesn't.
declare module "pdf-parse/lib/pdf-parse.js" {
  import type { Options, Result } from "pdf-parse";

  export default function pdf(data: Buffer | Uint8Array, options?: Options): Promise<Result>;
}

// The pdf.js build that pdf-parse bundles, typed only as far as the Sample Test reader uses it.
declare module "pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js" {
  type PdfJsTextItem = { str: string; transform: number[] };

  export type PdfJsPage = {
    getTextContent(): Promise<{ items: PdfJsTextItem[] }>;
    getOperatorList(): Promise<{ fnArray: number[]; argsArray: any[][] }>;
    objs: { get(id: string): any };
  };

  export type PdfJsDocument = {
    numPages: number;
    getPage(pageNumber: number): Promise<PdfJsPage>;
    destroy(): void;
  };

  const PDFJS: {
    disableWorker: boolean;
    OPS: Record<string, number>;
    getDocument(source: {
      data: Uint8Array;
      nativeImageDecoderSupport?: "decode" | "display" | "none";
    }): Promise<PdfJsDocument>;
  };
  export default PDFJS;
}
