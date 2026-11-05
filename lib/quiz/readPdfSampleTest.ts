import { encodePng, type DecodedImage } from "./encodePng";
import { figureMarker, type Figure } from "./figureRules";
import { configurePdfJs, PDFJS, type PdfJsPage } from "./pdfJs";

type Matrix = number[];

const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/** A picture painted on a page, with the height of its top edge in page space. */
type PlacedImage = { top: number; image: DecodedImage };

/**
 * Reads a PDF's text page by page, the way pdf-parse lays it out, and puts a
 * Figure marker above the first line that sits below the top of each picture.
 */
export async function readPdfSampleTest(
  bytes: Uint8Array,
): Promise<{ text: string; figures: Figure[] }> {
  configurePdfJs();
  // "none" makes pdf.js decode JPEGs itself; the other modes need a browser to decode them.
  const doc = await PDFJS.getDocument({
    data: new Uint8Array(bytes),
    nativeImageDecoderSupport: "none",
  });
  const figures: Figure[] = [];
  const addFigure = (image: DecodedImage): string | null => {
    const png = encodePng(image);
    if (!png) {
      return null;
    }
    figures.push({ bytes: png, mimeType: "image/png" });
    return figureMarker(figures.length);
  };

  try {
    let text = "";
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const pageText = await doc
        .getPage(pageNumber)
        .then((page) => readPage(page, addFigure))
        .catch(() => "");
      text = `${text}\n\n${pageText}`;
    }
    return { text, figures };
  } finally {
    doc.destroy();
  }
}

async function readPage(
  page: PdfJsPage,
  addFigure: (image: DecodedImage) => string | null,
): Promise<string> {
  const [operators, content] = await Promise.all([
    page.getOperatorList(),
    page.getTextContent(),
  ]);
  const pending = placedImages(page, operators).sort((a, b) => b.top - a.top);

  let text = "";
  let lastY: number | undefined;
  const flushImagesAbove = (y: number) => {
    while (pending.length > 0 && pending[0].top > y) {
      const figureMarker = addFigure(pending.shift()!.image);
      if (figureMarker) {
        text += text ? `\n${figureMarker}` : figureMarker;
        lastY = undefined;
      }
    }
  };

  for (const item of content.items) {
    const y = item.transform[5];
    flushImagesAbove(y);
    text += lastY === y || !text ? item.str : `\n${item.str}`;
    lastY = y;
  }
  flushImagesAbove(-Infinity);
  return text;
}

function placedImages(
  page: PdfJsPage,
  operators: { fnArray: number[]; argsArray: any[][] },
): PlacedImage[] {
  const { OPS } = PDFJS;
  const placed: PlacedImage[] = [];
  const saved: Matrix[] = [];
  let ctm = IDENTITY;

  operators.fnArray.forEach((fn, index) => {
    const args = operators.argsArray[index];
    switch (fn) {
      case OPS.save:
        saved.push(ctm);
        break;
      case OPS.restore:
      case OPS.paintFormXObjectEnd:
        ctm = saved.pop() ?? IDENTITY;
        break;
      case OPS.paintFormXObjectBegin:
        saved.push(ctm);
        if (Array.isArray(args[0]) && args[0].length === 6) {
          ctm = multiply(ctm, args[0]);
        }
        break;
      case OPS.transform:
        ctm = multiply(ctm, args);
        break;
      case OPS.paintImageXObject:
      case OPS.paintInlineImageXObject: {
        const image = fn === OPS.paintImageXObject ? page.objs.get(args[0]) : args[0];
        if (image?.data) {
          placed.push({ top: topOfUnitSquare(ctm), image });
        }
        break;
      }
    }
  });
  return placed;
}

function multiply(m: Matrix, n: Matrix): Matrix {
  return [
    m[0] * n[0] + m[2] * n[1],
    m[1] * n[0] + m[3] * n[1],
    m[0] * n[2] + m[2] * n[3],
    m[1] * n[2] + m[3] * n[3],
    m[0] * n[4] + m[2] * n[5] + m[4],
    m[1] * n[4] + m[3] * n[5] + m[5],
  ];
}

/** Images paint into the unit square, so its highest transformed corner is the image's top. */
function topOfUnitSquare(m: Matrix): number {
  return Math.max(...[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => m[1] * x + m[3] * y + m[5]));
}
