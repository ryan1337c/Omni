---
status: accepted for Other Keywords; the Hard and Soft Skill part is superseded by ADR-0003; how importance applies is superseded by ADR-0004
---

# Other Keywords are scored by meaning; Hard and Soft Skills stay literal

ADR 0001 made every Keyword earn credit only as an Explicit Skill. That fits tools and traits, but fails for Other Keywords: "Bachelor of Science in Computer Science, Honours" scored 0 against "BS in Computer Science", and even an exact match in Education was capped by the Skills Listing weight. Other Keywords are now Semantic Matches: Jev answers one yes/no question per Keyword against the whole resume, and its Match Probability is the only source of credit (0 below 0.5, full at 0.9 or above, linear between), times importance. Placement, Recency, Duration, and Depth Level do not apply to them. Hard and Soft Skills keep ADR 0001 unchanged, except that Depth Level now has three levels and Applied / Production earns full credit.

## Considered Options

- **Semantic matching for Soft Skills too.** Rejected: Soft Skills are where Jev is most likely to read a trait like "Ownership" into any Bullet, the false-positive problem ADR 0001 was written to stop.
- **Use Jev's `confidence` field as credit.** Rejected: it measures how certain Jev is about the answer it picked, so a confident "not shown" would earn high credit.
- **Credit equal to Match Probability.** Rejected: it pays half credit for a coin flip.

## Consequences

- When Jev is unavailable, an Other Keyword earns full credit on a literal match of its term or an alias and 0 otherwise.
- Semantic Matches are highlighted on the resume only where the term or an alias appears literally, because Jev reports whether the resume satisfies a Keyword, not where.
