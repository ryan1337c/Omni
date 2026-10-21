# Resume Tailoring

Turns a user's source resume into a tailored resume for a specific job description, then scores it against that job's keywords.

## Language

**Source Resume**:
The resume the user uploads, before any tailoring.
_Avoid_: Original resume, input resume

**Tailored Resume**:
The structured resume produced from a Source Resume for one job description.

**Section**:
One titled block of a Tailored Resume. The sections are Professional Summary, Education, Experience, Projects, Technical Skills, and Licenses, Certifications, and Awards. A Section with no content is omitted.

**Section Order**:
The sequence in which Sections appear. It starts from a fixed default, and the user can change it.

**Entry**:
One item within a Section, such as a single job, school, project, skill category, or Honor.

**Bullet**:
One line of accomplishment or detail listed under an Entry.
_Avoid_: Point, item

**Professional Summary**:
A 2–4 sentence paragraph at the top of the resume that follows the Who, What, Value formula. It appears only when the Source Resume has a summary-like paragraph to tailor.
_Avoid_: Objective, profile, about me

**Honor**:
One entry in the Licenses, Certifications, and Awards section: a title, its issuer, its date, and an optional one-line context description.
_Avoid_: Award (when meaning any entry), achievement, certificate

**Placeholder**:
A hint shown in an empty field in the scoring UI. It is never part of the resume content.

**Keyword**:
A skill or term extracted from a job description, with its aliases, that a Tailored Resume is scored against.

**Explicit Skill**:
A Keyword whose term or one of its aliases literally appears in the Tailored Resume. Only Explicit Skills earn credit.
_Avoid_: Matched skill, hit

**Implied Skill**:
A Keyword the resume suggests but never names by its term or an alias. It earns no credit.
_Avoid_: Inferred skill, implicit match

**Placement**:
Where an Explicit Skill appears in the resume. There are two kinds: Work History and Skills Listing. One Keyword can have several Placements.

**Work History**:
A Placement in an Experience Entry's title or Bullets, or in a Projects Entry. It carries dates, so it has Recency and Duration.

**Project**:
A Work History Placement in a Projects Entry. It always counts for less than a Current Role.

**Skills Listing**:
A Placement with no dates attached: the Technical Skills section, the Professional Summary, Education, or an Honor.
_Avoid_: Keyword stuffing (when meaning any Skills Listing)

**Current Role**:
An Experience Entry whose end date is "Present" (or "Current", "Now", "Ongoing", "Today"), or missing while a start date exists. A resume can have more than one.

**Recency**:
How long ago a Work History Placement ended. A Current Role has full Recency.

**Duration**:
How long the Entry behind a Work History Placement lasted.

**Dual Placement**:
An Explicit Skill that appears both in Work History and in a Skills Listing.

**Depth Level**:
How much practical use of an Explicit Skill the resume shows. In order: Mentioned, Familiarity, Applied / Production, Advanced / Specialized. It is judged from what the work shows, never from job title, Duration, or a list of technologies alone.
_Avoid_: Proficiency, rubric level, seniority
