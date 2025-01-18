import { OpenAIModel } from './openai';

export interface Message {
  role: Role;
  content: string;
}

export type Role = 'assistant' | 'user' | 'system';

export interface ChatBody {
  model: OpenAIModel;
  messages: Message[];
  key: string;
  prompt: string;
  useRAG: boolean;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  model: OpenAIModel;
  prompt: string;
  folderId: string | null;
}

export interface QnA {
  id: number;
  q: string;
  a: string;
}

export interface DataQnA {
  qna: QnA[];
  pass: string;
}
export interface Data {
  status: string;
  error: object | null;
}