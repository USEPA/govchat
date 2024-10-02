// lib/azure.js

//import { getCache, setCache } from "./cache";



export async function getAuthToken() {
  if (process.env.AZURE_USE_MANAGED_IDENTITY != "true") {
    return "";
  }
  const { ManagedIdentityCredential } = require("@azure/identity");
  let cachedToken = process.env.AUTH_TOKEN ? JSON.parse(process.env.AUTH_TOKEN) : '';
  if (!cachedToken || cachedToken.expiresOnTimestamp < Date.now()) {
    let cachedCredential = new ManagedIdentityCredential();
    cachedToken = await cachedCredential.getToken("https://cognitiveservices.azure.com/.default");
    process.env.AUTH_TOKEN = JSON.stringify(cachedToken);
    return cachedToken;
  }
  // console.log("cachedToken from memory", cachedToken);
  return process.env.AUTH_TOKEN ? JSON.parse(process.env.AUTH_TOKEN) : '';;
}
