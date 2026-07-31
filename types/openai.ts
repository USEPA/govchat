import { OPENAI_API_TYPE } from '../utils/app/const';
import { Message } from './chat';

export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message in CHARACTERS
  tokenLimit: number; // context length for a conversation in TOKENS
}

export enum OpenAIModelID {
  GPT_54m = 'gpt-5.4-mini',
  GPT_54 = 'gpt-5.4',
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_54m;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_54m]: {
    id: OpenAIModelID.GPT_54m,
    name: 'GPT-5.4-mini',
    maxLength: 128_000 * 100, // Testing using trial and error to see the limit
    tokenLimit: 128_000,
  },
  [OpenAIModelID.GPT_54]: {
    id: OpenAIModelID.GPT_54,
    name: 'GPT-5.4',
    maxLength: 128_000 * 100, // Testing using trial and error to see the limit
    tokenLimit: 128_000,
  }
};

