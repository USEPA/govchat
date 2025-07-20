import { makeTimestamp } from '@/types/chat';

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

const printLogLines = (
  loggingObject: {
    messagesJSON: string;
    userName: string | null;
    logID: string;
    maxTokens: number;
    temperature: number | undefined;
    model: string | undefined;
    page: number;
    totalPages: number;
  },
  messages: { role: string; content: string; }[],
  result: String
) => {
  // Splunk supports up to 10,000 but because it's encoded JSON the quoted value may be up to 2x the unquoted
  // Plus there's a field other fields in the logging object.
  const maxCharacterCount = 5000;
  loggingObject.messagesJSON = JSON.stringify([
    ...messages,
    {
      role: 'assistant',
      content: result,
      timestamp: makeTimestamp()
    }
  ]
  );

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
