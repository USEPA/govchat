import { OPENAI_API_TYPE } from '../utils/app/const';

export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message in CHARACTERS
  tokenLimit: number; // context length for a conversation in TOKENS
}

export enum OpenAIModelID {
  GPT_4 = 'gpt-4'
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_4;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_4]: {
    id: OpenAIModelID.GPT_4,
    name: 'GPT-4',
    maxLength: 128_000 * 3.5, // *3.5 was the tested limit using some trial and error
    tokenLimit: 128_000,
  }
};
