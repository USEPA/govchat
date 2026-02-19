import { Conversation } from '@/types/chat';

import { createAzureOpenAI } from '../lib/azure';
import { printLogLines } from '../lib/printLogLines';
import { decryptVectorStoreJWE } from '../lib/decryptJWE';

import { ChatCompletionChunk, ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ResponseInputItem, ResponseOutputText, ResponseStreamEvent, Tool } from 'openai/resources/responses/responses';
import { Stream } from 'openai/core/streaming';
import { AzureOpenAI } from 'openai';

type Citation = ResponseOutputText.ContainerFileCitation | ResponseOutputText.URLCitation | ResponseOutputText.FileCitation | ResponseOutputText.FilePath;
type CitationWithBounds = ResponseOutputText.ContainerFileCitation | ResponseOutputText.URLCitation;
type CitationWithFileId = ResponseOutputText.FileCitation | ResponseOutputText.FilePath;

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

const replaceCitations = (text: string, annotations: Citation[]) => {
	const citations = annotations.filter(ann => ann.type === 'container_file_citation' || ann.type === 'url_citation') as CitationWithBounds[];
	if (citations) {
    if (citations.length > 0) {
      let result = text.substring(0, citations[0].start_index - 1);
      citations.forEach((ann) => {
        result += `\n\n* ${text.substring(ann.start_index, ann.end_index)}`;
      });

      return result;
    }
  }

	return text;
}

function replaceFileCitations(text: string, annotations: Citation[], fileIdNameMap?: Record<string, string>): string {
	const citations = annotations.filter(ann => ann.type === 'file_citation' || ann.type === 'file_path') as CitationWithFileId[];

  //Support "fileciteturn0file12" style citations in GPT-5
  if (!fileIdNameMap) return text;
  if ((!citations || citations.length === 0) && text.indexOf("") == -1) return text;
  let result = text;
  let loopBreaker = 10; // Prevent infinite loops
  while (/[\uE200-\uE210]/u.test(result) && --loopBreaker > 0) {
    const fileCiteRegex = /[\uE200-\uE210]?(?:filecite[\uE200-\uE210])?turn(\d+)file(\d+)[\uE200-\uE210]/gu;
    result = result.replace(fileCiteRegex, (match, p1, p2) => {
      const fileId = Number(p1);
      const realFilename = Object.values(fileIdNameMap)[fileId] || fileId;
      return "【5:" + p2 + "†" + realFilename + "】";
    });
  }
  if (citations) {
    for (const ann of citations) {
      const citationRegex = /【*†(.+?)】/g;
        result = result.replace(citationRegex, (match, filename) => {
          const fileId = ann.file_id;
          const realFilename = fileIdNameMap[fileId] || filename;
          return match.replace(filename, realFilename);
        });
    }
  }
  return result;
}

async function getFileIdNameMap(openAI: AzureOpenAI, vectorStoreId: string): Promise<Record<string, string>> {
  const fileIdNameMap: Record<string, string> = {};
  const fileList = await openAI.vectorStores.files.list(vectorStoreId);
  if (fileList?.data && Array.isArray(fileList.data)) {
    for (const fileObj of fileList.data) {
      if (fileObj.id) {
        const fileMeta = await openAI.files.retrieve(fileObj.id);
        if (fileMeta?.id && fileMeta?.filename) {
          fileIdNameMap[fileMeta.id] = fileMeta.filename;
        }
      }
    }
  }
  return fileIdNameMap;
}

export const OpenAIStream = async (conversation: Conversation, userName: string, systemPrompt: string, useGrounding: boolean) => {
  const openAI = createAzureOpenAI();
	let modelId: string = conversation.model.id as string;
	if (modelId === "gpt-4") {
    modelId = "gpt-4o";
  }

	let temperature: number | undefined = conversation.temperature;
	if (modelId == "o3-mini" || modelId == "o1" || modelId == "gpt-5") {
		temperature = undefined;
	}

	const messagesWithPrompt = [
		{
			role: 'system',
			content: systemPrompt,
		},
		...conversation.messages.reverse().map(m => {
			return m.role === 'fileUpload' 
				? { content: m.content, role: 'system' } 
				: { content: m.content, role: m.role }
			})
	];

	let fileIdNameMap: Record<string, string> | undefined;

	let res: Stream<ChatCompletionChunk | ResponseStreamEvent>;
	if (!useGrounding && !conversation.vectorStoreId && !conversation.vectorStoreJWE) {
		res = await openAI.chat.completions.create({
			model: modelId,
			messages: messagesWithPrompt as Array<ChatCompletionMessageParam>,
			temperature: temperature,
			stream: true
		});

	} else {
		const tools: Tool[] = [];

		if (useGrounding) {
			tools.push({
				type: 'web_search'
			});
		}

		if (conversation.vectorStoreId || conversation.vectorStoreJWE) {
			let vectorStoreId;

			if (conversation.vectorStoreJWE) {
				const { vectorStoreId: decryptedVectorStoreId } = await decryptVectorStoreJWE(conversation.vectorStoreJWE, userName);
				vectorStoreId = decryptedVectorStoreId;

			} else if (conversation.vectorStoreId) {
				vectorStoreId = conversation.vectorStoreId;
			}

			fileIdNameMap = await getFileIdNameMap(openAI, vectorStoreId);

			tools.push({
				type: 'file_search',
				'vector_store_ids': [vectorStoreId]
			});
		}

		res = await openAI.responses.create({
			input: messagesWithPrompt as Array<ResponseInputItem>,
			temperature: temperature,
			model: modelId,
			stream: true,
			tools
		});
	}

	const loggingObjectTempResult: string[] = [];
  let error: string | undefined = "";

	const stream = new ReadableStream({
		async start(controller) {

			for await (let chunk of res) {
				let text: string | undefined | null;

				if ((chunk as any).choices) {
					chunk = chunk as ChatCompletionChunk;
					text = chunk.choices[0]?.delta?.content;

				} else {
					chunk = chunk as ResponseStreamEvent;

					switch (chunk.type) {
						case 'response.failed':
						case 'response.incomplete':
							error = chunk.response.error?.message || chunk.response.incomplete_details?.reason;
							break;

						case 'response.content_part.done':
							if (chunk.part.type === 'output_text') {
								text = replaceCitations(chunk.part.text, chunk.part.annotations);
								text = replaceFileCitations(text || '', chunk.part.annotations, fileIdNameMap);
							}

							break;
						default:
							break;
					}
				}

				if (text) {
					loggingObjectTempResult.push(text);
					controller.enqueue(new TextEncoder().encode(text));
				}
			}

			if (error) {
				controller.error(error);
				loggingObjectTempResult.push(`\n\nError: ${error}`);
			}

			printLogLines(
				userName,
				temperature === undefined ? null : temperature,
				conversation.model.name,
				messagesWithPrompt,
				loggingObjectTempResult.join('')
			);

			controller.close();
		}
	});

	return stream;
};