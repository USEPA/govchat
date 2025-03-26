
import { Tiktoken, get_encoding } from "@dqbd/tiktoken";


export const getTokenLength = (text: string) => {
  if (!Tiktoken) {
    throw new Error("Tiktoken not initialized.");
  }

  const encoded = get_encoding("o200k_base").encode(text);   // o200k_base is for gpt-4o

  //console.log( 'encoded text: ' + encoded);

  return encoded.length;
}

