import { v4 as uuidv4 } from 'uuid';

import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION, AZURE_APIM } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';
import { getAuthToken } from '../lib/azure';
import { getEntraToken } from '../lib/azureEntra';
import { AzureOpenAI } from 'openai';
import * as os from 'os';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}


const printLogLines = (
  loggingObject: { 
    messagesJSON: string; 
    userName: string|null;
    logID: string;
    maxTokens: number;
    temperature: number;
    model: string|undefined;
    page: number;
    totalPages: number },
    messages: {role: string; content: string}[],
  result: String
) => {
  // Splunk supports up to 10,000 but because it's encoded JSON the quoted value may be up to 2x the unquoted
  // Plus there's a field other fields in the logging object.
  const maxCharacterCount = 5_000;
  loggingObject.messagesJSON = JSON.stringify([
      ...messages,
      {
        role: 'assistant',
        content: result,
      }
    ]
  )

  const messagesLength = loggingObject.messagesJSON.length;
  loggingObject.totalPages = Math.ceil(messagesLength / maxCharacterCount);

  for (let i = 0; i < loggingObject.totalPages; i++) {
    const start = i * maxCharacterCount;
    const end = Math.min(start + maxCharacterCount, messagesLength);
    loggingObject.page = i + 1;
    console.log(JSON.stringify({
      ...loggingObject,
      messagesJSON: loggingObject.messagesJSON.substring(start, end)
    }));
  }
};

export const OpenAIStream = async (
  conversationId: string,
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number,
  key: string,
  messages: Message[],
  principalName: string|null,
  bearer: string|null,
  bearerAuth: string|null,
  userName: string|null
) => {

  var url = `${OPENAI_API_HOST}/v1/chat/completions`; 
  var header = {};
  
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  }

  if (os.hostname() === "localhost") {

    //url = `https://management.azure.com/subscriptions/${AZURE_SUBSCRIPTION_ID}/providers/Microsoft.CognitiveServices/locations/${AZURE_REGION}/models?api-version=${OPENAI_API_VERSION}`;

    let entraToken = await getEntraToken();

    header = {
      'Content-Type': 'application/json',
       'Authorization': `Bearer ${entraToken}`
    };

  }
  else {

    let token = await getAuthToken();

    header = {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && process.env.AZURE_USE_MANAGED_IDENTITY=="false" && {
        'api-key': `${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && process.env.AZURE_USE_MANAGED_IDENTITY=="true" && {
        Authorization: `Bearer ${token.token}`
      }),
      ...((OPENAI_API_TYPE === 'openai' && OPENAI_ORGANIZATION) && {
        'OpenAI-Organization': OPENAI_ORGANIZATION,
      }),
      ...((AZURE_APIM) && {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_APIM_KEY
      }),
      ...((principalName) && {
        'x-ms-client-principal-name': principalName
      }),
      ...((bearer) && { 
        'x-ms-client-principal': bearer
      }),
      ...((bearerAuth) && { 
        'x-ms-client-principal-id': bearerAuth
      })
    };

  }

  var body = {
    ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: temperature,
    stream: true,
  };

  const newMessageContent = JSON.parse(messages[messages.length].content);

  //content = `[{type: "text",text: "${content}",}, {"type": "file","file":{"filename": "file_name1","file_data": "`base64String`"}}
  if (newMessageContent.some((part: { type: string; }) => part.type === 'file')) {

    // change body
    body = getFileChatBody(
      conversationId,
      model,
      systemPrompt,
      temperature,
      key,
      messages,
      principalName,
      bearer,
      bearerAuth,
      userName,
      header
    );


    // change url to assistant API
    url = "new URL From getFileChatBody properties???";

  }


  const res = await fetch(url, {
    headers: header,
    method: 'post',
    body: JSON.stringify(body),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const loggingObjectTempResult:string[] = [];
  const loggingObject: { 
      messagesJSON: string; 
      userName: string|null;
      logID: string;
      maxTokens: number;
      temperature: number;
      model: string|undefined;
      page: number;
      totalPages: number } 
    = { 
    messagesJSON: "", 
    userName: userName,
    logID: uuidv4(),
    maxTokens: body.max_tokens,
    temperature: body.temperature,
    model: body.model,
    page: 1,
    totalPages: 1
  };

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      
      console.debug("Got a Chat Error: " + result.error.message);
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      console.debug("Got a Chat Error: " + result.statusText);
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  console.debug("got Chat");  
  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if(data !== "[DONE]"){
            try {
              const json = JSON.parse(data);
              if (json.choices[0] && json.choices[0].finish_reason && json.choices[0].finish_reason != null) {
                printLogLines(loggingObject, body.messages, loggingObjectTempResult.join(''))
                controller.close();
                return;
              }
              if (json.choices[0] && json.choices[0].delta) {
              const text = json.choices[0].delta.content;
              const queue = encoder.encode(text);
              loggingObjectTempResult.push(text);
              controller.enqueue(queue);
              }
            } catch (e) {
              controller.error(e + " Data: " + data);              
            }
        }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};



export const getFileChatBody = async (
  conversationId: string,
  model: OpenAIModel,
  systemPrompt: string,
  temperature: number,
  key: string,
  messages: Message[],
  principalName: string | null,
  bearer: string | null,
  bearerAuth: string | null,
  userName: string | null,
  header: {}
) => {

  var url = `${OPENAI_API_HOST}/openai/assistants`;


  const decoder = new TextDecoder();

  const client = new AzureOpenAI();



  /*

// create assistant
assistant = client.beta.assistants.create(
  name="Financial Analyst Assistant",
  instructions="You are an expert financial analyst. Use your knowledge base to answer questions about audited financial statements.",
  model="gpt-4-turbo",
  tools=[{"type": "file_search"}],
)


// Create a vector store to hold the files
vector_store = client.beta.vector_stores.create(name="Financial Statements")
 
//Ready the files for upload to OpenAI
file_paths = ["mydirectory/myfile1.pdf", "mydirectory/myfile2.txt"]
file_streams = [open(path, "rb") for path in file_paths]
 
//Use the upload and poll SDK helper to upload the files, add them to the vector store,
//and poll the status of the file batch for completion.
file_batch = client.beta.vector_stores.file_batches.upload_and_poll(
  vector_store_id=vector_store.id, files=file_streams
)
 

console.log(file_batch.status)
console.log(file_batch.file_counts)

assistant = client.beta.assistants.update(
  assistant_id=assistant.id,
  tool_resources={"file_search": {"vector_store_ids": [vector_store.id]}},
)


with client.beta.threads.runs.stream(
    thread_id=thread.id,
    assistant_id=assistant.id,
    instructions="Please address the user as Jane Doe. The user has a premium account.",
    event_handler=EventHandler(),
) as stream:
    stream.until_done()




        # Upload the user provided file to OpenAI
        message_file = client.files.create(
          file=open("mydirectory/myfile.pdf", "rb"), purpose="assistants"
        )
 
        # Create a thread and attach the file to the message
        thread = client.beta.threads.create(
          messages=[
            {
              "role": "user",
              "content": "How many company shares were outstanding last quarter?",
              # Attach the new file to the message.
              "attachments": [
                { "file_id": message_file.id, "tools": [{"type": "file_search"}] }
              ],
            }
          ]
        )
 
        # The thread now has a vector store with that file in its tool resources.
        print(thread.tool_resources.file_search)








  */



  const createAssistantBody = {
    name: "GovChat File Upload Assistant " + conversationId,
    instructions: systemPrompt,
    tools: [{ "type": "file_search" }],
    model: model.id,
  };

  const createAssistantRes = await fetch(url, {
    headers: header,
    method: 'post',
    body: JSON.stringify(createAssistantBody),
  });

  if (createAssistantRes.status !== 200) {
    const result = await createAssistantRes.json();
    if (result.error) {

      console.debug("Got a 'Create Assistant' Error: " + result.error.message);
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      console.debug("Got a 'Create Assistant' Error: " + result.statusText);
      throw new Error(
        `OpenAI API returned an error: ${decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }



  // finally, return this
  const body = {
    ...(OPENAI_API_TYPE === 'openai' && { model: model.id }),
    messages: [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...messages,
    ],
    max_tokens: 1000,
    temperature: temperature,
    stream: true,
  };


  return body;
};