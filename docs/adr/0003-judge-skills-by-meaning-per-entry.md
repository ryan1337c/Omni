# Hard and Soft Skills are judged by meaning, one Work History Entry at a time

ADR 0001 made literal wording the only way for a Hard or Soft Skill to earn credit, because Jev reading the whole resume credited skills that weren't there. Literal matching has the opposite failures: "Go" in "go-to-market" counts as the Go language, and "containerized services on EKS" earns nothing for Kubernetes. Now Jev judges each Work History Entry on its own, sent as a separate request whose state is only that Entry, so every credit points at a specific Entry or Bullet. An Implied Skill earns a reduced share of what the same skill would earn if named (Hard Skills 0.5, Soft Skills 0.8), because applicant tracking systems search for the name. Depth Level is rated per Entry, and a skill scores by its best Placement. This replaces the "Explicit only" rule of ADR 0001 and the "Hard and Soft Skills stay literal" part of ADR 0002. Other Keywords stay as ADR 0002 describes.

Hard Skills get two questions per Entry: whether the Entry shows the skill in that sense (counts at 0.7 or above) and its Depth Level. Soft Skills get one question per Bullet: whether a recruiter would cite that Bullet as a specific example of the trait. Soft Skills have no Depth Level question and are Applied / Production, Mentioned, or Absent. Each Education Entry is also its own request, with Depth Level asked only for skills it names, so coursework can still reach Familiarity, but Education never implies a skill. A probe on an 8-Entry, 30-skill resume answered 480 questions in 0.4 s for about $0.004. Asked per Entry, Jev credited Teamwork, Ownership, and Problem Solving to purely technical Entries. Asked per Bullet with the stricter wording, it credited nearly nothing beyond the Bullets that were real examples of the trait.

## Considered Options

- **Keep Hard and Soft Skills literal and add aliases in extraction (ADR 0001's fix).** Rejected: extraction can't anticipate every way of describing a tool, and aliases can't reject a literal match used in another sense.
- **One request with the whole resume.** Rejected: a large resume goes over Jev's 64k-token limit for one request, irrelevant state lowers accuracy, and Jev answers can't say where the evidence is.
- **Ask about each Bullet for Hard Skills too.** Rejected: Recency and Duration only need the Entry, and asking per Bullet multiplies the number of questions about five times.
- **One Score question with a "not shown" level instead of separate presence and depth questions.** Rejected: a Score averages over levels, so being unsure between "not shown" and Applied lands on Familiarity.

## Consequences

- If any request fails, the whole resume falls back to literal matching (Explicit Skills only, no check that the word is used in that sense), never a mix of the two.
- Implied Skills have no word to highlight. Their chip lists the Entries that showed them instead.
- One strong Bullet can satisfy several overlapping Soft Skills, such as Leadership, Ownership, and Teamwork. The fix belongs in keyword extraction, by merging near-duplicates, not in the scorer.
