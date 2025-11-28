import { compactDecrypt } from 'jose';
import { createSecretKey } from 'crypto';


export async function decryptVectorStoreJWE(vectorStoreJWE, requestUser) {
    const secret = (process.env.AUTH_SECRET || '').slice(0, 32);
    if (!secret) {
        throw new Error('Server configuration error');
    }
    const encoder = new TextEncoder();
    const key = createSecretKey(encoder.encode(secret));

    const { plaintext } = await compactDecrypt(vectorStoreJWE, key);
    const payload = JSON.parse(new TextDecoder().decode(plaintext));

    if (requestUser) {
        const tokenUser = payload.userName || '';
        if (tokenUser && tokenUser !== requestUser) {
            throw new Error('Token user does not match request user');
        }
    }
    return {
        vectorStoreId: payload.vectorStoreId,
        assistantId: payload.assistantId
    };
}

export default decryptVectorStoreJWE;
