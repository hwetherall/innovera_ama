export interface Question {
  id: string;
  question: string;
  assignedTo: string;
}

export interface AIAnswer {
  question_id: string;
  answer_text: string;
  confidence_score: number;
}

export interface AnswerGenerationRequest {
  transcript: string;
  questions: Question[];
}

export interface AnswerGenerationResponse {
  answers: AIAnswer[];
} 