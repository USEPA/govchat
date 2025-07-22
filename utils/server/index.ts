import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { createAzureOpenAI } from '../lib/azure';
import { printLogLines } from '../lib/printLogLines';

import { ChatCompletionCreateParams, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ThreadCreateAndRunParams } from 'openai/resources/beta/threads/threads';


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
  temperature: number | undefined | null,
  messages: Message[],
  userName: string | null,
  assistantId: string | null = '',
  vectorStoreId: string | null = '',
  fileIds: string[] | null = [],
) => {
  const openAI = createAzureOpenAI();
  var modelId: string = model.id as string;
  if (modelId === "gpt-4") {
    modelId = "gpt-4o"
  }

  const messagesWithPrompt = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...messages,
  ];

  if (modelId == "o3-mini" || modelId == "o1") {
    temperature = undefined;
  }
  let res: AsyncIterable<any>;
  if (!vectorStoreId) {
    res = await openAI.chat.completions.create({
      model: modelId,
      messages: messagesWithPrompt as Array<ChatCompletionMessageParam>,
      temperature: temperature,
      stream: true
    })
  } else {
    // Use openAI.beta.threads.createAndRunStream attaching vectorStoreId for file search tool
    const assistantMessages: ThreadCreateAndRunParams.Thread.Message[] = messages.map((msg) => ({
      role: msg.role == "user" ? 'user' : 'assistant',
      content: msg.content,
    }));
    // Pass vectorStoreId instead of creating a new vector store from fileIds
    res = openAI.beta.threads.createAndRunStream({
      assistant_id: assistantId || '',
      model: modelId,
      temperature: temperature,
      stream: true,
      thread: {
        messages: assistantMessages,
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId]
          }
        }
      }
    }) as AsyncIterable<any>; // Cast to AsyncIterable for compatibility
  }
  const loggingObjectTempResult: string[] = [];
  var error = "";

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of res) {
        let text: string | undefined;
        if (chunk.choices?.[0]?.delta?.content) {
          text = chunk.choices[0].delta.content;
        } else if (chunk.data?.delta?.content) {
          // AssistantStream: chunk.data.delta.content is an array of content blocks
          // Find the first text content block with a value
          const textBlock = Array.isArray(chunk.data.delta.content)
            ? chunk.data.delta.content.find((c: any) => c.type === 'text' && c.text?.value)
            : undefined;
          text = textBlock?.text?.value;
        }
        if (text) {
          loggingObjectTempResult.push(text);
          controller.enqueue(new TextEncoder().encode(text));
        }
        if (chunk.data?.last_error) {
          error = chunk.data.last_error;
        }
      }
      if (error) {
        controller.error(error);
        loggingObjectTempResult.push(`\n\nError: ${error}`);
      }
      printLogLines(
        userName,
        temperature === undefined ? null : temperature,
        model.name,
        messagesWithPrompt,
        loggingObjectTempResult.join('')
      );
      controller.close();
    }
  });

  return stream;
};
