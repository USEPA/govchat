import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import { ChatBody } from '@/types/chat';

import { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    }
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse<any>) => {
  try {
    const { prompt, conversation, useGrounding } = req.body as ChatBody;
    let promptToSend = prompt || DEFAULT_SYSTEM_PROMPT;

    //const principalName: string = req.headers['x-ms-client-principal-name']?.toString() || "";
    //const bearer: string = req.headers['x-ms-token-aad-access-token']?.toString() || req.headers['x-ms-client-principal']?.toString() || "";
    //const bearerAuth: string = req.headers['x-ms-client-principal-id']?.toString() || "";
    const userName: string = req.headers['x-ms-client-principal-name']?.toString() || "";
    
    const stream = await OpenAIStream (
      conversation,
      userName,
      promptToSend,
      useGrounding
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();


    if (stream == null) {
      res.status(500).send('Failed to create OpenAI stream');
      return;
    }
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    const processStream = async () => {
      let done = false;
      while (!done) {

        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          res.write(chunk);
        }
      }
      res.end();
    };
    
    try {
      await processStream();
      // res.end();
    } catch (error) {
      console.error('chat.ts - Error processing stream:', error);
      reader.cancel();
      res.end();
    }
    reader.releaseLock();

  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      res.status(500).send(error.message);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
};

export default handler;
