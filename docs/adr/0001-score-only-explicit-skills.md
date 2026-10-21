# Score only Explicit Skills; Jev judges depth, not presence

Jev used to decide both whether a Keyword was on the resume and how deeply it was used. That let it credit Implied Skills, which produced false positives whenever it misread the resume. Now a deterministic literal match on the term or an alias decides whether a Keyword is an Explicit Skill. Implied Skills earn 0. Jev rates only the Depth Level of Explicit Skills. Placement, Recency, Duration, and the Dual Placement bonus are computed from the resume itself, so the score still works when Jev is unavailable.

## Considered Options

- **Keep Implied Skills at reduced weight.** Rejected: every Implied Skill credit depends on the same Jev judgement that caused the false positives, so a lower weight only shrinks the error.
- **Drop Jev entirely.** Rejected: Placement alone can't tell "deployed a basic tutorial app" from "designed the production architecture" in the same Current Role.

## Consequences

- A skill the candidate clearly used but never names (ECS without "AWS") scores 0. The fix belongs in keyword extraction, by adding the alias, not in the scorer.
- Depth is rated once per Keyword across the whole resume. A skill used at Advanced depth in an old role but only Mentioned in the Current Role scores as Advanced × Current Role.
