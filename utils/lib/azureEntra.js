// lib/azureEntra.js

import { DefaultAzureCredential } from "@azure/identity";
import { env } from "process";


export async function getEntraToken() {
  if (env.AZURE_USE_MANAGED_IDENTITY == "false") {
    return "";
  }

  const credential = new DefaultAzureCredential();

  /*
  const deployment = "YOUR_DEPLOYMENT_NAME";
  const endpoint = "YOUR_ENDPOINT"; // e.g., "https://<your-resource-name>.openai.azure.com"
  const apiVersion = "2024-04-01-preview";
  const client = new AzureOpenAI({
      azureADTokenProvider: async () => (await credential.getToken("https://cognitiveservices.azure.com/.default")).token,
      endpoint,
      deployment,
      apiVersion
  });
  
  const chatCompletion = await client.chat.completions.create({
    messages: [{ role: "user", content: "Hello, Azure OpenAI!" }],
  });
  
  console.log(chatCompletion.choices[0].message);
  */

  return await credential.getToken("https://cognitiveservices.azure.com/.default").token;

}
