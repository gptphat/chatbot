import { Message } from '@/types/chat';
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';
// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';
import { OpenAIModel } from '@/types/openai';
import { Knowledge, getKnowledge } from '../elastic';
import { StreamingTextResponse } from 'ai';
import { createDelayedStreamFromString } from '../create-stream-message';

export const config = {
  runtime: 'edge',
};
const GPT_3_5: OpenAIModel = {
      id: 'gpt-3.5-turbo-1106',
      name: 'GPT-3.5',
      maxLength: 16385,
      tokenLimit: 4096,
    }
const OpenAICallAPI = async (messages: Message[], key: string, prompt: string, useRAG: boolean): Promise<Response> => {
  try {
    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    let tokenCount = 0;
    let messagesToSend: Message[] = [];
    let lastItem = messages[messages.length - 1]
    if (lastItem !== undefined) {
      if (useRAG){
        const knowledge: Knowledge = await getKnowledge(lastItem, "qna,qna_remove_accents", ['q', 'q_s'])
        if (knowledge.score > 8) {
          return new StreamingTextResponse(
            createDelayedStreamFromString(knowledge.text, 100)
          )
        }
        promptToSend = `${promptToSend}\n${knowledge.text}`
      }
      const tokens = encoding.encode(promptToSend);
      tokenCount += tokens.length;
    }


    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encoding.encode(message.content);

      if (tokenCount + tokens.length + 1000 > GPT_3_5.maxLength) {
        break;
      }
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }

    encoding.free();

    const stream = await OpenAIStream(GPT_3_5, promptToSend, key, messagesToSend);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default OpenAICallAPI;
