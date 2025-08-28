//import { DefaultAzureCredential } from "@azure/identity";

export const DEFAULT_SYSTEM_PROMPT =
  process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT ||
  "You are an AI Assistant that uses Azure OpenAI. Follow the user's instructions carefully. Respond using markdown.";

export const OPENAI_API_HOST =
  process.env.OPENAI_API_HOST || 'https://api.openai.com';

export const DEFAULT_TEMPERATURE = 
  parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || "0.5");

export const OPENAI_API_TYPE =
  process.env.OPENAI_API_TYPE || 'openai';

export const OPENAI_API_VERSION =
  process.env.OPENAI_API_VERSION || '2024-12-01-preview';

export const OPENAI_ORGANIZATION =
  process.env.OPENAI_ORGANIZATION || '';

export const AZURE_DEPLOYMENT_ID =
  process.env.AZURE_DEPLOYMENT_ID || '';

export const DEFAULT_MODEL = process.env.DEFAULT_MODEL || 'gpt5';

export const AZURE_SUBSCRIPTION_ID = process.env.AZURE_SUBSCRIPTION_ID || '';

export const AZURE_REGION = process.env.AZURE_REGION || '';

export const AZURE_APIM = process.env.AZURE_APIM_KEY || false;

export const AZURE_USE_MANAGED_IDENTITY = process.env.AZURE_USE_MANAGED_IDENTITY || false;

//export const myAZCredentials = new DefaultAzureCredential();

export const CHARACTERS_PER_TOKEN = 4;
