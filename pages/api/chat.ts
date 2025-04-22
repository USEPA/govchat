import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import { ChatBody, Message } from '@/types/chat';

import tiktokenModel from '@dqbd/tiktoken/encoders/o200k_base.json';
import { NextApiRequest, NextApiResponse } from 'next';
import { Tiktoken } from '@dqbd/tiktoken';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse<any>) => {
  try {
    const { model, messages, key, prompt, temperature } = req.body as ChatBody;
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );
    let promptToSend = prompt || DEFAULT_SYSTEM_PROMPT;
    let temperatureToUse = temperature ?? DEFAULT_TEMPERATURE;

    const prompt_tokens = encoding.encode(promptToSend);
    let tokenCount = prompt_tokens.length;
    let messagesToSend: Message[] = [];

    // Reverse loop through the messages to add them until the token limit is reached
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encoding.encode(message.content);

      if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
        break;
      }
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }

    const principalName: string = req.headers['x-ms-client-principal-name']?.toString() || "";
    const bearer: string = req.headers['x-ms-token-aad-access-token']?.toString() || req.headers['x-ms-client-principal']?.toString() || "";
    const bearerAuth: string = req.headers['x-ms-client-principal-id']?.toString() || "";
    const userName: string = req.headers['x-ms-client-principal-name']?.toString() || "";

    encoding.free();

    const stream = await OpenAIStream(
      model,
      promptToSend,
      temperatureToUse,
      key,
      messagesToSend,
      principalName,
      bearer,
      bearerAuth,
      userName
    );

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

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

    await processStream();

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
