# Coding Standards

Read during review. Each rule is a judgement call; lint, typecheck, and tests cover the mechanical ones.

## Domain language

Code, tests, and comments use the terms in [`GLOSSARY.md`](GLOSSARY.md), and never a term it lists under _Avoid_. Existing identifiers that predate a glossary term (such as the `matched` field) may stay, but new names and comments use the glossary term. When a change introduces a domain concept the glossary lacks, flag it.

## Comments

A comment states a constraint the code can't show: a unit, an invariant, a reason a value was chosen, an external contract. A comment that narrates the next line, explains where code came from, or argues the change is correct gets flagged.

## One source per contract

A value whose meaning is shared across files (a level scale, a set of band names, a threshold) is defined once and imported. Flag the same ladder or mapping written out again in another file.
