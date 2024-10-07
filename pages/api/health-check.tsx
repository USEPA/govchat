import { NextRequest, NextResponse } from 'next/server';
import handler from './chat';  // Adjust this path based on the actual location of 'chat'

// Declare the function as an edge runtime function
export const config = {
  runtime: 'edge', // Ensure this is executed in Edge runtime
};

export default async function healthCheck(req: NextRequest) {
  try {
    const mockReq: Request = new Request("http://example.org", {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-ms-client-principal-name': 'test-principal', // These can be mock values
        'x-ms-token-aad-access-token': 'mock-token',
      },
      body: JSON.stringify({
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
      }),
    });

    // Simulate the handler with the mock request
    const mockRes:Response = await handler(mockReq);
    if (mockRes.status != 200) {
      throw Error("Status not 200")
    }

    // Return a successful health check
    return NextResponse.json({ message: 'Health check passed successfully' }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Health check failed:', error.message);
      return NextResponse.json({ message: 'Health check failed', error: error.message }, { status: 500 });
    } else {
      // Handle cases where a non-Error object is thrown
      return NextResponse.json({ message: 'Unknown error occurred' }, { status: 500 });
    }
  }
}
