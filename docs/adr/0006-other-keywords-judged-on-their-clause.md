# Other Keywords are judged on their Clause

A 1–4 word term turned "+3 years of professional software development experience, including internships or co-op placements" into "Professional experience", so Jev checked for any experience at all and never learned the number or that internships count. Other Keywords now carry a Clause, the job description's own sentence, and Jev's match question uses it when present; the term stays a short label that keeps its numbers ("3+ years professional experience"). Hard and Soft Skills carry no Clause, because their questions are asked per Entry about the skill's name, and a sentence naming several skills would let Jev credit an Entry for the wrong one. The fallback and resume highlighting ignore the Clause, so a years-of-experience Keyword still scores 0 without Jev (ADR-0004).

## Considered Options

- **Only lengthen the term.** Rejected: qualifiers like "including internships" don't fit a chip label, and Jev would decide on its own what counts.
- **A Clause on every Keyword.** Rejected for the reason above.
