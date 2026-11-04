# Quizzes

Lets a user build a multiple-choice quiz, by hand or with AI from a description or their own documents, then take it and learn from the answers.

## Language

### Creating a quiz

**Creation Mode**:
How a new quiz's questions are made: Manual, where the user writes every question, or Generate with AI, where the AI writes them from a Generation Source.
_Avoid_: Quiz type, input mode

**Generation Source**:
What the AI builds a quiz from in Generate with AI: From Scratch, Notes, or Sample Test.
_Avoid_: Input type, upload mode

**From Scratch**:
The Generation Source where the user describes a topic, difficulty, or style in their own words and the AI writes a new quiz.
_Avoid_: Topic & Style, freeform

**Notes**:
The Generation Source where the user uploads study material and the AI writes new questions grounded in it.
_Avoid_: Study material upload, document mode

**Sample Test**:
The Generation Source where the user uploads an existing exam or practice test and the AI turns its own questions into a quiz, keeping its printed Choices and answer key where it has them.
_Avoid_: Past paper, exam upload

### Questions

**Choice**:
One answer a quiz taker can pick for a question. Exactly one Choice per question is correct.
_Avoid_: Option, answer (when meaning any Choice)

**Explanation**:
A short note on a question saying why the correct Choice is right, and sometimes why a tempting wrong Choice is not.
_Avoid_: Rationale, solution, hint

### Taking a quiz

**Review**:
The state of a quiz after the taker submits it, when each question shows which Choice was correct and its Explanation.
_Avoid_: Results, answer key
