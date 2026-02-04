import type { NextApiRequest, NextApiResponse } from 'next';
import { DEFAULT_MODEL } from '@/utils/app/const';
import { createAzureOpenAI } from '@/utils/lib/azure';
import { CompactEncrypt } from 'jose';
import { createSecretKey } from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
	if (req.method !== 'POST') {
	    res.status(405).json({ error: 'Method not allowed' });
	    return;
	}
	const openAI = createAzureOpenAI();

	try {
		const store = await openAI.vectorStores.create({
			expires_after: {
				anchor: 'last_active_at',
				days: 30
			}
		});

		// Can be spoofed if not set or at least cleared by the proxy
		const userName = req.headers['x-ms-client-principal-name']?.toString() || '';
		const valuesToStore = { assistantId: null, vectorStoreId: store.id, userName: userName };

		const secret = (process.env.AUTH_SECRET || '').slice(0, 32);
		if (!secret) {
			res.status(500).json({ error: 'Server configuration error' });
			return;
		}

		// Build payload with standard claims (iat, exp)
		const now = Math.floor(Date.now() / 1000);
		const payload = {
			...valuesToStore,
			iat: now
		};

		const encoder = new TextEncoder();
		const key = createSecretKey(encoder.encode(secret));
        console.error(key);
		const jwe = await new CompactEncrypt(encoder.encode(JSON.stringify(payload)))
			.setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
			.encrypt(key);

		res.status(200).json({ vectorStoreJWE: jwe });
	} catch (error: any) {
		console.error('getids error:', error);
		res.status(500).json({ error: 'Failed to create assistant/vector store' });
	}
}