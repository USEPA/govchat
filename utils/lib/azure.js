// lib/azure.js

//import { DefaultAzureCredential } from "@azure/identity";
//import { log } from "console";
//import { getCache, setCache } from "./cache";



export async function getAuthToken() {
  if (process.env.AZURE_USE_MANAGED_IDENTITY != "true") {
    return "";
  }
  let cachedToken = process.env.AUTH_TOKEN ? JSON.parse(process.env.AUTH_TOKEN) : '';
  if (!cachedToken || cachedToken.expiresOnTimestamp < Date.now()) {
    let cachedCredential = new DefaultAzureCredential();
    cachedToken = await cachedCredential.getToken("https://cognitiveservices.azure.com/.default");
    //setCache("cachedToken", JSON.stringify(cachedToken));
    //console.log("set the cachedToken in cache");
    //let a = JSON.parse(getCache("cachedToken"));
    //console.log("cachedToken from memory", a);
    process.env.AUTH_TOKEN = JSON.stringify(cachedToken);
    return cachedToken;
  }
  console.log("cachedToken from memory", cachedToken);
  return process.env.AUTH_TOKEN ? JSON.parse(process.env.AUTH_TOKEN) : '';;
}
 