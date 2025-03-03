
import { Tiktoken } from '@dqbd/tiktoken';
import { get_encoding, encoding_for_model } from "@dqbd/tiktoken";


export const getTokenLength = (text: string) => {
  if (!Tiktoken) {
    throw new Error("Tiktoken not initialized.");
  }

  // encoding = tiktoken.encoding_for_model('gpt-4o-mini')
  console.log( 'encoding: ' + JSON.stringify(encoding_for_model('gpt-4o')));

  //const encoded = get_encoding("cl100k_base").encode(text);   // cl100k_base is for gpt-4 and gpt-35 and earlier
  const encoded = get_encoding("o200k_base").encode(text);   // o200k_base is for gpt-4o

  console.log( 'encoded text: ' + encoded);

  return encoded.length;
}

