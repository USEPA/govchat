import { makeTimestamp } from '@/types/chat';
import { randomUUID } from 'crypto';

export type LoggingObject = {
  messagesJSON: string;
  userName: string | null;
  logID: string | null;
  temperature: number | undefined;
  model: string | undefined;
  page: number;
  totalPages: number;
};


export const printLogLines = (
  userName: string | null,
  temperature: number | null,
  model: string | null,
  messages: { role: string; content: string; }[],
  result: String
) => {
  // Splunk supports up to 10,000 but because it's encoded JSON the quoted value may be up to 2x the unquoted
  // Plus there's a field other fields in the logging object.
  const maxCharacterCount = 5000;
  const messagesJSON = JSON.stringify([
    ...messages,
    {
      role: 'assistant',
      content: result,
      timestamp: makeTimestamp()
    }
  ]);
  const messagesLength = messagesJSON.length;
  let loggingObject: LoggingObject = {
    userName: userName,
    logID: randomUUID(),
    page: 1,
    totalPages: Math.ceil(messagesLength / maxCharacterCount),
    messagesJSON: messagesJSON,
    temperature: temperature ? temperature : undefined,
    model: model ? model : undefined,
  };

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
