import { NextApiRequest, NextApiResponse } from 'next';
import handler from './chat';

export default async function healthCheck(req: NextApiRequest, res: NextApiResponse) {
  try {
    req.method = 'POST';
    req.headers['content-type'] = 'application/json';
    req.headers['x-ms-client-principal-name'] = req.headers['x-ms-client-principal-name'] || '';
    req.headers['x-ms-token-aad-access-token'] = req.headers['x-ms-token-aad-access-token'] || '';
    req.headers['x-ms-client-principal-id'] = req.headers['x-ms-client-principal-id'] || '';

    req.body = {
      conversation: {
        id: 0,
        messages: [
          {
            role: 'user',
            content: 'Reply with "ok" to this message to confirm the health of the API.',
          },
        ],
        model: {
          id: 'gpt-5',
          name: 'GPT-5',
          maxLength: 128_000 * 3.5, // *3.5 was the tested limit using some trial and error
          tokenLimit: 128_000,
        },
      prompt: "You are an AI Assistant that uses Azure OpenAI. Follow the user's instructions carefully. Respond using markdown.",
      temperature: 0.5,
      folderId: null,
      tokenLength: 0,
      characterLength: 0,
    },
      useGrounding: false,
      prompt: "You are an AI Assistant that uses Azure OpenAI. Follow the user's instructions carefully. Respond using markdown."
    };
    await handler(req, res);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Health check failed:', error.message);
      return res.status(500).send(error.message );
    } else {
      // Handle cases where a non-Error object is thrown
      return res.status(500).send('Unknown error occurred');
    }
  }
}
