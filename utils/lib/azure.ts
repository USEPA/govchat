import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';

import { env } from "process";
import { OPENAI_API_TYPE, OPENAI_ORGANIZATION, AZURE_APIM, OPENAI_API_VERSION, OPENAI_API_HOST } from '../app/const';
import * as os from 'os';
import { AzureOpenAI } from 'openai';


export async function getEntraToken() {
  if (env.AZURE_USE_MANAGED_IDENTITY == "false") {
    return "";
  }
  const credential = new DefaultAzureCredential();
  return (await credential.getToken("https://cognitiveservices.azure.com/.default")).token;
}

export async function getAuthToken() {
  if (env.AZURE_USE_MANAGED_IDENTITY=="false") {
    return "";
  }
  let cachedToken = process.env.AUTH_TOKEN ? JSON.parse(process.env.AUTH_TOKEN) : '';
  if (!cachedToken || cachedToken.expiresOnTimestamp < Date.now()) {
    let cachedCredential = new DefaultAzureCredential();
    cachedToken = await cachedCredential.getToken("https://cognitiveservices.azure.com/.default");
    process.env.AUTH_TOKEN = JSON.stringify(cachedToken);
    return cachedToken;
  }
  return process.env.AUTH_TOKEN ? JSON.parse(process.env.AUTH_TOKEN) : '';;
}

export function createAzureOpenAI(): AzureOpenAI {
  const credential = new DefaultAzureCredential();
  const scope = "https://cognitiveservices.azure.com/.default";

  return new AzureOpenAI({
    azureADTokenProvider:  getBearerTokenProvider(credential, scope),
    endpoint: OPENAI_API_HOST,
    apiVersion: OPENAI_API_VERSION
  });
}

export async function auth(key: string, principalName: string | null, bearer: string | null, bearerAuth: string | null) {
  var header = {};
  if (os.hostname() === "localhost") {
    let entraToken = await getEntraToken();
    header = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${entraToken}`
    };
  }
  else {
    let token = await getAuthToken();
    header = {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && process.env.AZURE_USE_MANAGED_IDENTITY == "false" && {
        'api-key': `${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && process.env.AZURE_USE_MANAGED_IDENTITY == "true" && {
        Authorization: `Bearer ${token.token}`
      }),
      ...((OPENAI_API_TYPE === 'openai' && OPENAI_ORGANIZATION) && {
        'OpenAI-Organization': OPENAI_ORGANIZATION,
      }),
      ...((AZURE_APIM) && {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_APIM_KEY
      }),
      ...((principalName) && {
        'x-ms-client-principal-name': principalName
      }),
      ...((bearer) && {
        'x-ms-client-principal': bearer
      }),
      ...((bearerAuth) && {
        'x-ms-client-principal-id': bearerAuth
      })
    };
  }
  return header;
}
