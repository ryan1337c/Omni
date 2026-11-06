# Glossary Map

Each context's glossary sits beside the `lib/` module that owns its domain logic, so the vocabulary lives next to the code most likely to use it. The UI for each context (`app/components/resume-*`, `app/components/quiz-*`, `app/components/flashcard-*`) uses the same glossary.

## Contexts

- [Resume Tailoring](./lib/resume/GLOSSARY.md): tailors a user's resume to a job description and scores it against that job's keywords
- [Quizzes](./lib/quiz/GLOSSARY.md): builds multiple-choice quizzes by hand or with AI, and lets users take and review them
- [Flashcards](./lib/flashcards/GLOSSARY.md): builds decks of two-sided cards by hand or with AI from typed text or one uploaded document

## Relationships

- **Resume Tailoring ↔ Quizzes**: independent. They share only platform concerns (accounts, credits), not domain terms.
- **Resume Tailoring ↔ Flashcards**: independent. They share only platform concerns (accounts, credits), not domain terms.
- **Flashcards ↔ Quizzes**: the same creation language (Creation Mode, Generation Source, From Scratch, Notes, Focus) for a different study item. A Card is not a quiz question. Flashcard From Scratch is Topic or Text. Flashcards have no Sample Test.
