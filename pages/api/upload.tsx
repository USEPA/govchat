import type { NextApiRequest, NextApiResponse } from 'next';
import { createAzureOpenAI } from '@/utils/lib/azure';
import busboy from 'busboy';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

export const config = {
    api: { bodyParser: false },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    const openAI = createAzureOpenAI();

    const vectorStoreId = typeof req.query.vectorStoreId === 'string' ? req.query.vectorStoreId : undefined;

    try {
        const bb = busboy({ headers: req.headers });
        const uploadPromises: Promise<any>[] = [];

        bb.on('file', (fieldname, file, filename) => {
            // Randomuuid is used to prevent directory traversal attacks
            const tmpPath = path.join(os.tmpdir(), `${randomUUID()}.tmp`);
            const writeStream = fs.createWriteStream(tmpPath);

            file.pipe(writeStream);

            const uploadPromise = new Promise(async (resolve, reject) => {
                writeStream.on('finish', async () => {
                    try {
                        const fileStream = fs.createReadStream(tmpPath);
                        // Monkey patch in the filename for metadata, do not overwrite .path
                        (fileStream as any).name = filename.filename;
                        const result = await openAI.files.create({
                            purpose: 'assistants',
                            file: fileStream,
                        });

                        if (vectorStoreId) {
                            await openAI.beta.vectorStores.files.create(
                                vectorStoreId,
                                { file_id: result.id }
                            );
                        }

                        fs.unlink(tmpPath, () => { });
                        resolve(result);
                    } catch (error: any) {
                        fs.unlink(tmpPath, () => { });
                        reject(error);
                    }
                });
                writeStream.on('error', reject);
            });

            uploadPromises.push(uploadPromise);
        });

        bb.on('finish', async () => {
            try {
                const results = uploadPromises.length > 0 ? await Promise.all(uploadPromises) : [];
                res.status(200).json(results.map((r: any) => r.id));
            } catch (error: any) {
                res.status(500).json({ error: error.message || 'File upload failed' });
            }
        });

        bb.on('error', () => {
            res.status(400).json({ error: 'Error parsing form data' });
        });

        req.pipe(bb);
    } catch (error: any) {
        res.status(500).json({ error: error.message || 'File upload failed' });
    }
};


export default handler;
