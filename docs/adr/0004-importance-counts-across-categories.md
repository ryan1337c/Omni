# Importance counts across Keyword Categories

The Match Score gave each Keyword Category a fixed share (Hard 70%, Other 20%, Soft 10%) and applied Importance only inside a category, so a Keyword's weight depended on how many others shared its category: with one Preferred Hard Skill and four Soft Skills, the Hard Skill was worth 70% of the score and a Required Soft Skill about 4%. The Match Score is now one pool: each Keyword has a fixed Keyword Weight, category weight × Importance (Hard 0.5, Other 0.3, Soft 0.2; Required ×3, Preferred ×1), and the score is Credit weighted by Keyword Weight. The lightest Required Keyword (Soft, 0.6) outweighs the heaviest Preferred one (Hard, 0.5) in every job description, and Hard still leads Other and Soft at the same Importance. This replaces "times importance" in ADR 0002.

## Considered Options

- **Keep the old category weights and raise the Required multiplier.** Rejected: Hard is 7× Soft, so Required would need more than ×7 and would swamp everything else.
- **A fixed 75/25 split between Required and Preferred.** Rejected: the same crowding problem on the other axis; with ten Required Keywords and one Preferred, the Preferred one outweighs any single Required one.
- **Strict tiers, every Required above every Preferred.** Rejected: one Required Keyword could outweigh any number of Preferred ones.
- **Equal category weights.** Rejected: a Preferred Soft Skill would count as much as a Preferred Hard Skill, and one Bullet can show several traits, so Soft Skills would inflate the score.

## Consequences

- A set of Alternatives counts one Keyword Weight, not one per option (ADR-0005).
- Categories no longer have a fixed share: a job description that is mostly Hard Skills is scored mostly on Hard Skills.
- A missing Required Keyword costs far more than before. Without Jev, a Required Other Keyword that is not written literally (such as years of experience) scores 0 and pulls the fallback score down.
