import { v4 as uuidv4 } from 'uuid';

import { Message, OpenAIMessage, makeTimestamp } from '@/types/chat';
import { OpenAIModel, OpenAIModels } from '@/types/openai';

import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION, AZURE_APIM, DEFAULT_SYSTEM_PROMPT, DEFAULT_MODEL } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';
import { getAuthToken } from '../lib/azure';
import { getEntraToken } from '../lib/azureEntra';
import { AzureOpenAI, toFile } from 'openai';
import * as os from 'os';
import * as fs from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { Uploadable } from 'openai/core';
import { Assistant } from 'openai/resources/beta/assistants';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';


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


const printLogLines = (
  loggingObject: { 
    messagesJSON: string; 
    userName: string|null;
    logID: string;
    maxTokens: number;
    temperature: number|undefined;
    model: string|undefined;
    page: number;
    totalPages: number },
    messages: {role: string; content: string}[],
  result: String
) => {
  // Splunk supports up to 10,000 but because it's encoded JSON the quoted value may be up to 2x the unquoted
  // Plus there's a field other fields in the logging object.
  const maxCharacterCount = 5_000;
  loggingObject.messagesJSON = JSON.stringify([
      ...messages,
      {
        role: 'assistant',
        content: result,
        timestamp: makeTimestamp()
      }
    ]
  )

  const messagesLength = loggingObject.messagesJSON.length;
  loggingObject.totalPages = Math.ceil(messagesLength / maxCharacterCount);

  for (let i = 0; i < loggingObject.totalPages; i++) {
    const start = i * maxCharacterCount;
    const end = Math.min(start + maxCharacterCount, messagesLength);
    loggingObject.page = i + 1;
    console.log(JSON.stringify({
      ...loggingObject,
      messagesJSON: loggingObject.messagesJSON.substring(start, end)
    }));
  }
};

export const OpenAIStream = async (
  conversationId: string,
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number|undefined,
  key: string,
  messages: OpenAIMessage[],
  principalName: string|null,
  bearer: string|null,
  bearerAuth: string|null,
  userName: string|null
) => {

  //var url = `${OPENAI_API_HOST}/v1/chat/completions`; 
  var url = `${OPENAI_API_HOST}/assistants`;

  var header = {};
  
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}openai/assistants?api-version=${OPENAI_API_VERSION}`;
  }

  if (os.hostname() === "localhost") {

    //url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/providers/Microsoft.CognitiveServices/locations/${AZURE_REGION}/models?api-version=${OPENAI_API_VERSION}`;
    /*
    const credential = new DefaultAzureCredential();
    const scope = "https://cognitiveservices.azure.com/.default";
    const azureADTokenProvider = getBearerTokenProvider(credential, scope);
    //await credential.getToken("https://cognitiveservices.azure.com/.default").token;

    const openAI = new AzureOpenAI({
      azureADTokenProvider: azureADTokenProvider,
      endpoint: OPENAI_API_HOST,
      //azureDeploymentId: AZURE_DEPLOYMENT_ID,
      apiVersion: OPENAI_API_VERSION
    });
    */


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

  var body = {
    ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),

    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    temperature: temperature,
    stream: true
  };

  if (model.id == "o3-mini" || model.id == "o1") {
    delete body.temperature;
  }

  console.log(`Messages : (${messages.length}) ${messages[messages.length - 1].content.substring(0, 1000) }`);

  const newMessageContent = messages[messages.length - 1].content;
  
  if (isJson(newMessageContent) && JSON.parse(newMessageContent).some((content: { type: string; }) => content.type === 'file')) {

    console.log("File upload detected in the last message content. Processing...");

    // change body
    body = getFileChatBody(
      conversationId,
      model,
      systemPrompt,
      temperature,
      key,
      messages,
      principalName,
      bearer,
      bearerAuth,
      userName,
      header,
      newMessageContent
    );

  }

  console.log(`fetching url: ${url}`);

  const res = await fetch(url, {
    headers: header,
    method: 'post',
    body: JSON.stringify(body),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const loggingObjectTempResult:string[] = [];
  const loggingObject: { 
      messagesJSON: string; 
      userName: string|null;
      logID: string;
      maxTokens: number;
      temperature: number|undefined;
      model: string|undefined;
      page: number;
      totalPages: number } 
    = { 
    messagesJSON: "", 
    userName: userName,
    logID: uuidv4(),
    maxTokens: 0,
    temperature: body.temperature,
    model: body.model,
    page: 1,
    totalPages: 1
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
                printLogLines(loggingObject, body.messages, loggingObjectTempResult.join(''))
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



export const getFileChatBody = async (
  conversationId: string,
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number | undefined,
  key: string,
  messages: OpenAIMessage[],
  principalName: string | null,
  bearer: string | null,
  bearerAuth: string | null,
  userName: string | null,
  header: {},
  newMessage: string,
) => {


  const credential = new DefaultAzureCredential();
  const scope = "https://cognitiveservices.azure.com/.default";
  const azureADTokenProvider = getBearerTokenProvider(credential, scope);
  //await credential.getToken("https://cognitiveservices.azure.com/.default").token;


  console.log(`getFileChatBody - making AzureOpenAI`);

  const openAI = new AzureOpenAI({
    azureADTokenProvider: azureADTokenProvider,
    endpoint: OPENAI_API_HOST,
    //azureDeploymentId: AZURE_DEPLOYMENT_ID,
    apiVersion: OPENAI_API_VERSION
  });

  const messageFiles: string[] = JSON.parse(newMessage).filter( (part: { type: string; }) => part.type === 'file')
    .map((part: { file: { file_data: string; }; }) => part.file.file_data);
  
  console.log(`getFileChatBody - messageFiles: ${messageFiles.length} `);

  // // convert base64 to fs.readstream
  // const files = await Promise.all(messageFiles
  //   .map(messageFile => base64ToReadStream(messageFile)));


  // console.log(`getFileChatBody - files: ${files.length} `);

  // Upload each file using the files endpoint with purpose 'user_data'
  const fileIds = [];
  for (const fileStr of messageFiles) {
    const fileStream = base64ToReadStream(fileStr);
    const uploadedFile = await openAI.files.create({
      purpose: 'assistants',
      file: fileStream
    });
    fileIds.push(uploadedFile.id);
    console.log(`Uploaded file: ${uploadedFile.filename}, id: ${uploadedFile.id}`);
  }

  //// create assistant with file_search tool for file Q&A (v2 API)
  const assistant = await openAI.beta.assistants.create({
    model: DEFAULT_MODEL,
    name: "GovChat File Upload Assistant " + conversationId,
    instructions: DEFAULT_SYSTEM_PROMPT,
    tools: [{ type: "file_search" }]
  });

  console.log(`created assistant: ${assistant.id}`);

  // Create a thread
  const thread = await openAI.beta.threads.create();

  const message: string = JSON.parse(messages[messages.length - 1].content)
                        .any((part: { type: string; }) => part.type === 'text')
                        .text;

  // Add a message to the thread with the prompt and attach the uploaded files using correct tools object
  await openAI.beta.threads.messages.create(thread.id, {
    role: "user",
    content: message,
    attachments: fileIds.map(id => ({ file_id: id, tools: [{ type: "file_search" }] }))
  });

  // Run the assistant on the thread
  const run = await openAI.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id
  });

  // Poll for the run to complete
  let runStatus;
  do {
    await new Promise(r => setTimeout(r, 2000));
    runStatus = await openAI.beta.threads.runs.retrieve(thread.id, run.id);
  } while (runStatus.status !== "completed" && runStatus.status !== "failed");

  if (runStatus.status === "completed") {
    const messages = await openAI.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data.find(m => m.role === "assistant");
    const reply = lastMessage?.content?.[0]?.text?.value || "No summary returned.";
    console.log('message:', reply);

    messages.push(reply);

  } else {
    console.error('Assistant run failed:', runStatus);

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

  return body;
};


function isJson(item) {
  let value = typeof item !== "string" ? JSON.stringify(item) : item;    
  try {
    value = JSON.parse(value);
  } catch (e) {
    return false;
  }
    
  return typeof value === "object" && value !== null;
}



function base64ToReadStream(base64String: string): Readable {
  const buffer = Buffer.from(base64String, 'base64');

  return new Readable({
    read() {
      this.push(buffer);
      this.push(null);
    },
  });
}




