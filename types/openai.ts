import { OPENAI_API_TYPE } from '../utils/app/const';
import { Message } from './chat';

export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message in CHARACTERS
  tokenLimit: number; // context length for a conversation in TOKENS
}

export enum OpenAIModelID {
  GPT_52 = 'gpt52chat'
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_52;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
    [OpenAIModelID.GPT_52]: {
    id: OpenAIModelID.GPT_52,
    name: 'GPT-5.2',
    maxLength: 400_000 * 3.5, // Has not been tested
    tokenLimit: 400_000,
  }
};

