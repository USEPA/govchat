import { Message, makeTimestamp } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { OPENAI_API_TYPE, DEFAULT_SYSTEM_PROMPT, DEFAULT_MODEL } from '../app/const';
import { createAzureOpenAI } from '../lib/azure';

import { AzureOpenAI } from 'openai';
import * as fs from 'fs';


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
  const openAI = createAzureOpenAI();

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

  if (assistantId === null) {
    const assistant = await openAI.beta.assistants.create({
      model: DEFAULT_MODEL,
      name: "GovChat Assistant " + conversationId,
      instructions: DEFAULT_SYSTEM_PROMPT,
      tools: [{ type: "file_search" }]
    });
    assistantId = assistant.id;
  }
  if (threadId === null || threadId === '') {
    const thread = await openAI.beta.threads.create();
    threadId = thread.id;
  }

  var newMessageContent = messages[messages.length - 1].content;
  var newMessageText = JSON.parse(newMessageContent)
    .filter((part: { type: string; }) => part.type === 'text')[0].text;

  messages[messages.length - 1] = newMessageText;

  var newMessageFiles = "";
  var fileIds: string[] = [];

  if (isJson(newMessageContent) && JSON.parse(newMessageContent).some((content: { type: string; }) => content.type === 'file')) {
    newMessageFiles = JSON.parse(newMessageContent).filter( (part: { type: string; }) => part.type === 'file')
    .map((part: { file: { filename: string, file_data: string; }; }) => part.file);

    fileIds = await getChatFileIds(
      newMessageFiles,
      openAI
    );
  }

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

  const run = await openAI.beta.threads.runs.create(threadId, {
    assistant_id: assistantId
  });

  let runStatus;
  do {
    await new Promise(r => setTimeout(r, 2000));
    runStatus = await openAI.beta.threads.runs.retrieve(threadId, run.id);
  } while (runStatus.status !== "completed" && runStatus.status !== "failed");

  if (runStatus.status === "completed") {
    const threadMessages = await openAI.beta.threads.messages.list(threadId);
    const lastMessage = threadMessages.data.find(m => m.role === "assistant");

    const reply: Message = { 
      role: lastMessage?.role || "assistant", 
      content: lastMessage?.content[0].type == "text" ? lastMessage?.content[0].text.value : "", 
      timestamp: makeTimestamp() 
    };
    
    if(reply) {
      openAIConversation.messages.pop(); // only send the reply
      openAIConversation.messages.push(reply);
    }

  } else {
    console.error('Assistant run failed:', runStatus);
  }

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
