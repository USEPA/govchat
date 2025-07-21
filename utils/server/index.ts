import { Message, makeTimestamp } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { OPENAI_API_TYPE, DEFAULT_SYSTEM_PROMPT, DEFAULT_MODEL } from '../app/const';
import { createAzureOpenAI } from '../lib/azure';

import { AzureOpenAI } from 'openai';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from 'openai/resources/chat/completions';


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
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number|undefined,
  messages: Message[],
  assistantId: string|null = '',
  threadId: string|null = '',
  fileIds: string[] | null = [],
) => {
  const openAI = createAzureOpenAI();
  var modelId: string = model.id as string;
  if (modelId === "gpt-4") {
    modelId = "gpt-4o"
  }

  var body: ChatCompletionCreateParams = {
    model: modelId,
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ] as Array<ChatCompletionMessageParam>,
    temperature: temperature,
    stream: true
  };

  if (modelId == "o3-mini" || modelId == "o1") {
    delete body.temperature;
  }
  var res = await openAI.chat.completions.create(body);

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of res) {
        const text = chunk.choices?.[0]?.delta?.content;
        if (text) {
          controller.enqueue(new TextEncoder().encode(text));
        }
      }
      controller.close();
    }
  });

  return stream;
 
  // var newMessageContent = messages[messages.length - 1].content;
  // var newMessageText = JSON.parse(newMessageContent)
  //   .filter((part: { type: string; }) => part.type === 'text')[0].text;

  // messages[messages.length - 1] = newMessageText;

  // var newMessageFiles = "";
  // var fileIds: string[] = [];

  // if (isJson(newMessageContent) && JSON.parse(newMessageContent).some((content: { type: string; }) => content.type === 'file')) {
  //   newMessageFiles = JSON.parse(newMessageContent).filter( (part: { type: string; }) => part.type === 'file')
  //   .map((part: { file: { filename: string, file_data: string; }; }) => part.file);

  //   fileIds = await getChatFileIds(
  //     newMessageFiles,
  //     openAI
  //   );
  // }

  // await openAI.beta.threads.messages.create(threadId, {
  //   role: "user",
  //   content: newMessageText,
  //   attachments: fileIds.map((id: any) => ({ file_id: id, tools: [{ type: "file_search" }] }))
  // });

  // var openAIConversation : OpenAIConversation = {
  //   conversationId: conversationId,
  //   assistantId: assistantId,
  //   threadId: threadId,
  //   messages: messages
  // };

  // const run = await openAI.beta.threads.runs.create(threadId, {
  //   assistant_id: assistantId
  // });

  // let runStatus;
  // do {
  //   await new Promise(r => setTimeout(r, 2000));
  //   runStatus = await openAI.beta.threads.runs.retrieve(threadId, run.id);
  // } while (runStatus.status !== "completed" && runStatus.status !== "failed");

  // if (runStatus.status === "completed") {
  //   const threadMessages = await openAI.beta.threads.messages.list(threadId);
  //   const lastMessage = threadMessages.data.find(m => m.role === "assistant");

  //   const reply: Message = { 
  //     role: lastMessage?.role || "assistant", 
  //     content: lastMessage?.content[0].type == "text" ? lastMessage?.content[0].text.value : "", 
  //     timestamp: makeTimestamp() 
  //   };
    
  //   if(reply) {
  //     openAIConversation.messages.pop(); // only send the reply
  //     openAIConversation.messages.push(reply);
  //   }

  // } else {
  //   console.error('Assistant run failed:', runStatus);
  // }

  // const res = new Response(JSON.stringify(openAIConversation), {
  //   status: 200,
  //   statusText: "Response received",
  //   headers: {
  //       'Content-Type': 'application/json'
  //   }
  // });

  // return Promise.resolve(res.body);
};
