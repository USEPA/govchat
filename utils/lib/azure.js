// lib/azure.js

import { DefaultAzureCredential } from "@azure/identity";
//import { getCache, setCache } from "./cache";



export async function getAuthToken() {
  let cachedToken = process.env.AUTH_TOKEN ? JSON.parse(process.env.AUTH_TOKEN) : '';
  if (!cachedToken || cachedToken.expiresOnTimestamp < Date.now()) {
    let cachedCredential = new DefaultAzureCredential();
    cachedToken = await cachedCredential.getToken("https://cognitiveservices.azure.com/.default");
    process.env.AUTH_TOKEN = JSON.stringify(cachedToken);
    return cachedToken;
  }
  // console.log("cachedToken from memory", cachedToken);
  return process.env.AUTH_TOKEN ? JSON.parse(process.env.AUTH_TOKEN) : '';;
}
 