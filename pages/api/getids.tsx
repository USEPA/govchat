import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';

// Import your OpenAI client and constants
import { DEFAULT_MODEL, DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { createAzureOpenAI } from '@/utils/lib/azure';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const openAI = createAzureOpenAI();

    try {
        // Create assistant if not present
        const assistant = await openAI.beta.assistants.create({
            model: DEFAULT_MODEL,
            name: "GovChat Assistant " + randomUUID(),
            instructions: DEFAULT_SYSTEM_PROMPT,
            tools: [{ type: "file_search" }]
        });
        const thread = await openAI.beta.threads.create();
        res.status(200).json({ assistantId: assistant.id, threadId: thread.id });
    } catch (error: any) {
        res.status(500).json({ error: error?.message || 'Failed to create assistant/thread' });
    }
}