import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION, AZURE_APIM } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';
import { getAuthToken } from '../lib/azure';
import { getEntraToken } from '../lib/azureEntra';
import * as os from 'os';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number,
  key: string,
  messages: Message[],
  principalName: string|null,
  bearer: string|null,
  bearerAuth: string|null,
  userName: string|null
) => {

  var url = ``; 
  var header = {};

  url = `${OPENAI_API_HOST}/v1/chat/completions`;
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  }

  if (os.hostname() === "localhost") {

    //url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/providers/Microsoft.CognitiveServices/locations/${AZURE_REGION}/models?api-version=${OPENAI_API_VERSION}`;

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
      ...(OPENAI_API_TYPE === 'azure' && process.env.AZURE_USE_MANAGED_IDENTITY=="false" && {
        'api-key': `${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && process.env.AZURE_USE_MANAGED_IDENTITY=="true" && {
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

  const body = {
    ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: temperature,
    stream: true,
  };

  const res = await fetch(url, {
    headers: header,
    method: 'post',
    body: JSON.stringify(body),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const loggingObjectTempResult:string[] = [];
  const loggingObject: { messages: any; userName: string|null; result: string } = { 
    messages: body, 
    userName: userName, 
    result: ""
  };

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      
      console.debug("Got a Chat Error: " + result.error.message);
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      console.debug("Got a Chat Error: " + result.statusText);
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  console.debug("got Chat");  
  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if(data !== "[DONE]"){
            try {
              const json = JSON.parse(data);
              if (json.choices[0] && json.choices[0].finish_reason && json.choices[0].finish_reason != null) {
                loggingObject.result = loggingObjectTempResult.join('');
                console.log(JSON.stringify(loggingObject));
                controller.close();
                return;
              }
              if (json.choices[0] && json.choices[0].delta) {
              const text = json.choices[0].delta.content;
              const queue = encoder.encode(text);
              loggingObjectTempResult.push(text);
              controller.enqueue(queue);
              }
            } catch (e) {
              controller.error(e + " Data: " + data);              
            }
        }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
