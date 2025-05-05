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

export interface AskAnythingRequestBody {
  question: string;
}

export interface AskAnythingResponse {
  answer: string;
  sources: string[];
  confidence: number;
}

// OpenRouter API Types
export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface OpenRouterChoice {
  message: {
    content: string;
    role: string;
  };
  finish_reason: string;
  index: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  created: number;
  choices: OpenRouterChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}