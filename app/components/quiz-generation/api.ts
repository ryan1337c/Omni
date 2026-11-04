import { AuthServices } from "@/lib/authServices";

import type { GenerationSourceState } from "./generationSource";

const authServices = new AuthServices();

function generationSourceFields(state: GenerationSourceState) {
  switch (state.selected) {
    case "fromScratch":
      return { text: state.inputs.fromScratch.text, file: null };
    case "notes":
      return { text: state.inputs.notes.focus, file: state.inputs.notes.file };
    case "sampleTest":
      return { text: "", file: state.inputs.sampleTest.file };
  }
}

export async function generateQuizRequest(
  title: string,
  generationSource: GenerationSourceState,
  questionCount: number | string,
) {
  const { text, file } = generationSourceFields(generationSource);
  const body = new FormData();
  body.append("title", title);
  body.append("source", generationSource.selected);
  body.append("questionCount", String(Number(questionCount)));
  body.append("text", text);
  if (file) {
    body.append("file", file, file.name);
  }

  const session = await authServices.getSession();
  const result = await fetch(`/api/generateQuiz`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body,
  });

  const data = await result.json();
  return { result, data };
}
