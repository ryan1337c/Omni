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

**Keyword Category**:
The kind of Keyword: Hard Skill (tools, technologies, methods), Soft Skill (interpersonal and work-style traits), or Other (degrees, certifications, years of experience, languages, domains). Hard and Soft Skills earn credit as Explicit Skills, or as Implied Skills for less; Other Keywords earn credit only as Semantic Matches.
_Avoid_: Section (a Section is a block of the resume)

**Explicit Skill**:
A Hard or Soft Skill whose term or one of its aliases literally appears in a Placement, in that sense. Once named anywhere, every Placement of the skill counts in full, including Work History that shows it without naming it. "Go" in "go-to-market" is not the Go language. A term that appears only in a company name, location, school name, or the header does not count.
_Avoid_: Matched skill, hit

**Implied Skill**:
A Hard or Soft Skill that Work History shows in use while its term and aliases appear nowhere on the resume, such as "orchestrated containers on EKS" for Kubernetes with no mention of Kubernetes. It earns less credit than the same skill named, because applicant tracking systems and recruiters search for the name. An Implied Hard Skill loses more than an Implied Soft Skill, since tools are searched by name and traits are better shown than claimed. A Skills Listing never implies a skill.
_Avoid_: Inferred skill, implicit match, Semantic Match (that is for Other Keywords)

**Semantic Match**:
An Other Keyword the resume satisfies in meaning, whatever the wording. "Bachelor of Science in Computer Science, Honours" is a Semantic Match for "BS in Computer Science". Placement, Recency, Duration, and Depth Level do not apply.

**Match Probability**:
How likely it is, from 0 to 1, that the resume satisfies an Other Keyword. It decides how much credit a Semantic Match earns.
_Avoid_: Confidence (Jev uses that word for how certain it is about its own answer)

**Placement**:
Where an Explicit or Implied Skill appears in the resume. There are two kinds: Work History and Skills Listing. One Keyword can have several Placements.

**Work History**:
A Placement in an Experience Entry's title or Bullets, or in a Projects Entry. It carries dates, so it has Recency and Duration.

**Project**:
A Work History Placement in a Projects Entry. It always counts for less than a Current Role.

**Skills Listing**:
A Placement with no dates attached: the Technical Skills section, the Professional Summary, Education, or an Honor.
_Avoid_: Keyword stuffing (when meaning any Skills Listing)

**Current Role**:
An Experience Entry whose end date is "Present" (or "Current", "Now", "Ongoing", "Today"), or left blank after a range separator ("Jan 2023 –"). A lone date with no range, such as "Mar 2023", is unreadable, not current. A resume can have more than one.

**Recency**:
How long ago a Work History Placement ended. A Current Role has full Recency.

**Duration**:
How long the Entry behind a Work History Placement lasted.

**Dual Placement**:
An Explicit Skill that appears both in Work History and in a Skills Listing.

**Depth Level**:
How much practical use of an Explicit or Implied Skill the resume shows, judged separately for each Experience, Projects, or Education Entry it appears in. In order: Mentioned, Familiarity, Applied / Production. Applied / Production earns full credit. It is judged from what the work shows, never from job title, Duration, or a list of technologies alone. Soft Skills skip Familiarity: a Soft Skill is Applied / Production when a Bullet is a specific example of the trait, and Mentioned when it is only named or claimed, as in "strong communicator".
_Avoid_: Proficiency, rubric level, seniority
