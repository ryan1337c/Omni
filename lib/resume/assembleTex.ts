export type AssembleTexParts = {
  preamble: string;
  macros: string;
  documentBody: string;
};

/**
 * Prepend preamble + Jake macros to a document body.
 * `documentBody` must already be `\begin{document}...\end{document}`.
 */
export function assembleTex(parts: AssembleTexParts): string {
  const preamble = parts.preamble.trim();
  const macros = parts.macros.trim();
  const documentBody = parts.documentBody.trim();

  if (!preamble || !macros || !documentBody) {
    throw new Error(
      "Cannot assemble .tex: preamble, macros, or document body is empty",
    );
  }

  return `${preamble}\n\n${macros}\n\n${documentBody}\n`;
}
