import { v4 as uuidv4 } from 'uuid';

import { Message, makeTimestamp } from '@/types/chat';
import { OpenAIModel, OpenAIModels } from '@/types/openai';

import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION, AZURE_APIM, DEFAULT_SYSTEM_PROMPT, DEFAULT_MODEL } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';
import { auth } from '../lib/azure';
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

interface OpenAIConversation {
  conversationId: string;
  assistantId: string;
  threadId: string;
  messages: Message[];
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
  messages: Message[],
  principalName: string|null,
  bearer: string|null,
  bearerAuth: string|null,
  userName: string|null,
  assistantId: string|null = '',
  threadId: string|null = '',
) => {

  //var url = `${OPENAI_API_HOST}/v1/chat/completions`; 
  var url = `${OPENAI_API_HOST}/assistants`;

  
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}openai/assistants?api-version=${OPENAI_API_VERSION}`;
  }

  var header = await auth(key, principalName, bearer, bearerAuth);

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

  // if the conversation is new, create an assistant
  if (assistantId === null) {
    console.log("No assistantId provided, creating a new assistant...");

    const assistant = await openAI.beta.assistants.create({
      model: DEFAULT_MODEL,
      name: "GovChat Assistant " + conversationId,
      instructions: DEFAULT_SYSTEM_PROMPT,
      tools: [{ type: "file_search" }]
    });
    assistantId = assistant.id;

    console.log(`created assistant: ${assistantId}`);
  }
  if (threadId === null || threadId === '') {

    const thread = await openAI.beta.threads.create();

    threadId = thread.id;
    console.log(`created thread: ${thread.id} for assistant: ${assistantId}`);
  }

  var newMessageContent = messages[messages.length - 1].content;
  var newMessageText = JSON.parse(newMessageContent)
    .filter((part: { type: string; }) => part.type === 'text')[0].text;

  messages[messages.length - 1] = newMessageText;

  var newMessageFiles = "";
  var fileIds: string[] = [];

  // if there is a file uploaded, send it, then add the fileId to the body 
  if (isJson(newMessageContent) && JSON.parse(newMessageContent).some((content: { type: string; }) => content.type === 'file')) {

    newMessageFiles = JSON.parse(newMessageContent).filter( (part: { type: string; }) => part.type === 'file')
    .map((part: { file: { filename: string, file_data: string; }; }) => part.file);

    console.log("File upload detected in the last message content. Processing files:" + newMessageFiles);

    fileIds = await getChatFileIds(
      newMessageFiles,
      openAI
    );

  }

  // Add a message to the thread with the prompt and attach the uploaded files using correct tools object
  await openAI.beta.threads.messages.create(threadId, {
    role: "user",
    content: newMessageText,
    attachments: fileIds.map((id: any) => ({ file_id: id, tools: [{ type: "file_search" }] }))
  });

  var openAIConversation : OpenAIConversation = {
    conversationId: conversationId,
    assistantId: assistantId,
    threadId: threadId,
    messages: messages
  };

  // Run the assistant on the thread
  const run = await openAI.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  });

  // Poll for the run to complete
  let runStatus;
  do {
    await new Promise(r => setTimeout(r, 2000));
    runStatus = await openAI.beta.threads.runs.retrieve(threadId, run.id);
  } while (runStatus.status !== "completed" && runStatus.status !== "failed");

  if (runStatus.status === "completed") {
    const threadMessages = await openAI.beta.threads.messages.list(threadId);
    const lastMessage = threadMessages.data.find(m => m.role === "assistant");

    // const reply = lastMessage?.content?.[0]?.text?.value || "No summary returned.";
    
    const reply: Message = { 
      role: lastMessage?.role || "assistant", 
      content: lastMessage?.content[0].type == "text" ? lastMessage?.content[0].text.value : "", 
      timestamp: makeTimestamp() 
    };
    
    console.log('threads.message found:', reply?.content || "");

    if(reply) {
      openAIConversation.messages.pop(); // only send the reply
      openAIConversation.messages.push(reply);
    }

  } else {
    console.error('Assistant run failed:', runStatus);

  }

  // const encoder = new TextEncoder();
  // const decoder = new TextDecoder();
  // const loggingObjectTempResult:string[] = [];
  // const loggingObject: { 
  //     messagesJSON: string; 
  //     userName: string|null;
  //     logID: string;
  //     maxTokens: number;
  //     temperature: number|undefined;
  //     model: string|undefined;
  //     page: number;
  //     totalPages: number } 
  //   = { 
  //   messagesJSON: "", 
  //   userName: userName,
  //   logID: uuidv4(),
  //   maxTokens: 0,
  //   temperature: body.temperature,
  //   model: body.model,
  //   page: 1,
  //   totalPages: 1
  // };

  const res = new Response(JSON.stringify(openAIConversation), {
    status: 200,
    statusText: "Response received",
    headers: {
        'Content-Type': 'application/json'
    }
  });

  return Promise.resolve(res.body);

};

export const getChatFileIds = async (
  messageFiles: any,
  openAI: AzureOpenAI,
) => {

  const fileIds = [];
  const tmpFileDir = "_tmpFiles/";
  
  for (const messageFile of messageFiles) {
    const fileStream = base64ToReadStream(messageFile.filename, messageFile.file_data, tmpFileDir);
    const uploadedFile = await openAI.files.create({
      purpose: 'assistants',
      file: fileStream
    });
    fileIds.push(uploadedFile.id);

    //console.log(`Uploaded file: ${uploadedFile.filename}, id: ${uploadedFile.id}`);

    fs.unlinkSync( tmpFileDir + messageFile.filename); // should we keep the files for later viewing by the user?
  }

  return fileIds;

};


function isJson(item : any) {
  let value = typeof item !== "string" ? JSON.stringify(item) : item;    
  try {
    value = JSON.parse(value);
  } catch (e) {
    return false;
  }
    
  return typeof value === "object" && value !== null;
}

function base64ToReadStream(fileName:string, base64String: string, tmpFileDir: string): fs.ReadStream{
  
  var newString = base64String.substring(base64String.indexOf(',') + 1);

  const buffer = Buffer.from(newString, 'base64');
  const newFilePath :string = tmpFileDir + fileName;
  fs.writeFileSync(newFilePath, new Uint8Array(buffer));
   
  return fs.createReadStream(newFilePath);
}

