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
      model: {
        id: 'gpt-35-turbo',
        name: 'GPT-3.5',
        maxLength: 12000,
        tokenLimit: 4000,
      },
      messages: [
        {
          role: 'user',
          content: 'test',
        },
      ],
      key: '',
      prompt: "You are Gov Chat an AI Assistant using Azure OpenAI. Follow the user's instructions carefully. Respond using markdown.",
      temperature: 0.5,
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
