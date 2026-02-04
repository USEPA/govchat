import { format } from 'date-fns';
import { OpenAIModel } from './openai';

export interface Message {
  role: Role;
  content: string;
  type?: string;
  timestamp?: string;
  useGrounding?: boolean;
}
export const makeTimestamp = () => {return format(new Date(), "yyyy-MM-dd'T'HH:mm:ssxxx");}

export type Role = 'assistant' | 'user' | 'fileUpload';

export interface ChatBody {
  conversation: Conversation;
  key: string;
  prompt?: string;
  useGrounding: boolean;
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
  vectorStoreId?: string | null;
  vectorStoreJWE?: string | null;
  fileIds?: string[] | null;
}
