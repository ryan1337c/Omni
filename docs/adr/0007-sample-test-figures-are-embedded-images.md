# Sample Test Figures are the document's embedded images

A Sample Test's Figures are the raster images embedded in its PDF or DOCX, pulled out with their position and marked as `[FIGURE n]` in the text the AI reads; the AI only names which numbers each question needs and never sees the pixels. This keeps pricing on text alone and the pictures exact, but diagrams drawn as PDF vector paths (charts, LaTeX/TikZ figures) and scanned tests produce no Figures, and the user adds those by hand while editing.

## Considered Options

- **Render each page and crop the regions a vision model picks.** Rejected for now: it catches vector diagrams, but crops can be sloppy, it costs far more per test, and it's hard to test. Worth revisiting if users hit vector diagrams often.
