import { format } from 'date-fns';
import { OpenAIModel } from './openai';

export interface Message {
  role: Role;
  content: string;
  timestamp: string;
}
export const makeTimestamp = () => {return format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");}

export interface OpenAIMessage {
  role: Role;
  content: string;
}

export type Role = 'assistant' | 'user';

export interface ChatBody {
  conversationId: string;
  model: OpenAIModel;
  messages: OpenAIMessage[];
  key: string;
  prompt: string;
  temperature: number;
  assistantId?: string | null;
}

export interface Conversation {
  id: string;
  name: string;
  messages: Message[];
  model: OpenAIModel;
  prompt: string;
  temperature: number;
  folderId: string | null;
  tokenLength: number;
  characterLength: number;
  assistantId?: string | null;
}
