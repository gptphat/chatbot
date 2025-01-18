import { ChatBody, Message } from '@/types/chat';
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { OpenAIError } from '@/utils/server';
import { Knowledge, TypeLog, addLog, getKnowledge, getDataElasticQuery, getKnowledgeV2 } from '@/utils/elastic';
import { StreamingTextResponse } from "ai"
import { createDelayedStreamFromString } from '@/utils/create-stream-message';
import { LocalAIStream } from '@/utils/server/local';
import OpenAICallAPI from '@/utils/server/openai';

export const config = {
  runtime: 'edge',
  unstable_allowDynamic: [
    '/node_modules/fuzzball/dist/esm/fuzzball.esm.min.js'
  ],
};

const handler = async (req: Request): Promise<StreamingTextResponse> => {
  try {
    const { messages, key, prompt, useRAG } = (await req.json()) as ChatBody;
    if (key) {
      console.log("Call API OpenAI");
      return await OpenAICallAPI(messages, key, prompt, useRAG);
    }

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }


    let messagesToSend: Message[] = [];
    let lastItem = messages[messages.length - 1]
    if (lastItem !== undefined) {
      if (useRAG) {
        let min_score = 6;
        // let knowledge: Knowledge = await getKnowledge(lastItem, "qna", ['q', 'q_s'], 6, 60, true);
        let knowledge: Knowledge = await getKnowledgeV2(lastItem, "qna", ['q', 'q_s']);
        if (knowledge.score > 0) {
          return new StreamingTextResponse(
            createDelayedStreamFromString(knowledge.text.replace(new RegExp('\n','g'), '\n\n'), 100)
          )
        }
        // knowledge = await getKnowledge(lastItem, "qna_remove_accents", ['q', 'q_s'], 6, 60, true);
        knowledge = await getKnowledgeV2(lastItem, "qna_remove_accents", ['q', 'q_s']);
        if (knowledge.score > 0) {
          return new StreamingTextResponse(
            createDelayedStreamFromString(knowledge.text.replace(new RegExp('\n','g'), '\n\n'), 100)
          )
        }
        // query qna_budsas
        min_score = 8;
        // knowledge = await getKnowledge(lastItem, "qna_budsas", ['q'], min_score);
        knowledge = await getKnowledgeV2(lastItem, "qna_budsas", ['q']);
        if (knowledge.score > 0) {
          return new StreamingTextResponse(
            createDelayedStreamFromString(knowledge.text.replace(new RegExp('\n','g'), '\n\n'), 100)
          )
        }
        // query qna_theravada
        // knowledge = await getKnowledge(lastItem, "qna_theravada", ['q'], min_score);
        knowledge = await getKnowledgeV2(lastItem, "qna_theravada", ['q']);
        if (knowledge.score > 0) {
          return new StreamingTextResponse(
            createDelayedStreamFromString(knowledge.text.replace(new RegExp('\n','g'), '\n\n'), 100)
          )
        }
        // query all
        const knowledgeprompt: Knowledge = await getDataElasticQuery(lastItem)
        promptToSend = `${promptToSend}\n${knowledgeprompt.text}`
      }
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      messagesToSend = [message, ...messagesToSend];
    }
    messagesToSend = [
      {
        role: 'system',
        content: promptToSend,
      },
      ...messagesToSend
    ];
    console.log(`Call Local`)
    await addLog(0, lastItem.content, "", TypeLog.FullQuery, [{ messagesToSend: messagesToSend }])
    return await LocalAIStream(messagesToSend, req.signal)

  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
