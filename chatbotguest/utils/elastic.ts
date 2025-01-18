const fuzz = require("fuzzball")
import md5 from 'md5';
import { isMatchAboveThreshold } from './lcs';
import { QnA } from '@/types/chat';

const elasticsearchServer = process.env.ELASTIC_URL ?? "http://localhost:9200" // Replace with your Elasticsearch server address
const indexLogs = "logs-qna"

export interface Knowledge {
  text: string
  score: number
  question?: string
  tokenLength?: number
}

interface Document {
  score: number
  question: string
  query: string
  type: number
  scoreSynonymous?: number,
  timestamp?: number
  hit?: any
}
export enum TypeLog {
  ElasticScore,
  FuzzScore,
  FuzzScoreAugmentation,
  FuzzScoreBuddhism,
  FullQuery,
  NoNeedFuzzPhrase,
  NoNeedFuzz,
}

const Synonymous: { [key: string]: string } = {
  "tứ thánh đế": "tứ diệu đế",
  "bát chánh đạo": "bát chính đạo",
  "là như thế nào": "là gì",
  "như thế nào là": "là gì",
  "thế nào": "là gì",
  "kẻ nào": "ai",
  "tại sao": "sao",
  "bao giờ": "lúc nào",
  "nào": "khi nào",
  "khi nào": "lúc nào",
  "ra sao": "như thế nào",
  "vì sao": "tại sao",
  "người nào": "ai",
  "làm sao": "như thế nào",
  "đâu": "ở đâu",
}

function replaceKSynonymous(input: string): string {
  input = input.toLocaleLowerCase();
  for (var key in Synonymous) {
    input = input.replace(key, Synonymous[key]);
  }
  return input;
}

export async function fetchWithTimeout(url: string, options: any, timeout: number = 3000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal
  })
  clearTimeout(id);
  return response;
}

async function getElasticQuery(question: string, size: number = 1, index: string = "qna", fields: string[] = ["q^2", "a"], noNeedFuzzFirst: boolean = false): Promise<Response> {
  const query = {
    query: {
      multi_match: {
        query: question,
        fields: fields,
        type: noNeedFuzzFirst ? "phrase" : "best_fields"
      }
    },
    size: size
  }
  const response = await fetchWithTimeout(`${elasticsearchServer}/${index}/_search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(query)
  })
  return response;
}

export async function getDataElasticQuery(lastChatMessage: any, indexQnA: string = "qna,qna_budsas,qna_theravada", fields: string[] = ["q^2", "a"]): Promise<Knowledge> {
  console.log("getDataElasticQuery ", indexQnA)
  const response = await getElasticQuery(lastChatMessage?.content ?? "", 2, indexQnA, fields);
  const result = await response.json()
  return {
    text: await buildRetrievalText(result.hits.hits),
    score: result.hits.hits[0]._score,
  }
}
const DEFAULTMESSAGE = {
  text: "",
  score: 0
}

export async function getAndMatchQuery(query: string, indexQnA: string, fields: string[], min_score: number = 0.5, need: boolean = true): Promise<Knowledge> {
  const response = await getElasticQuery(query, 10, indexQnA, fields, need);
  const result = await response.json()
  if (result.hits.hits.length === 0) {
    return DEFAULTMESSAGE;
  }
  for (let i = 0; i < result.hits.hits.length; i++) {
    const question_DB = result.hits.hits[i]._source.q;
    console.log(indexQnA)
    if (isMatchAboveThreshold(query, question_DB, min_score)) {
      return {
        text: result.hits.hits[i]._source.a_o ?? result.hits.hits[i]._source.a,
        score: 100,
        question: result.hits.hits[i]._source.q
      }
    }
  }
  return DEFAULTMESSAGE;
}

async function getAndMatch(lastChatMessage: any, indexQnA: string, fields: string[], min_score: number = 0.5, need: boolean = true): Promise<Knowledge> {
  const query = lastChatMessage.content;
  return await getAndMatchQuery(query, indexQnA, fields, min_score, need);
}

export async function getKnowledgeV2(lastChatMessage: any, indexQnA: string, fields: string[], min_score: number = 0.5) {
  try {
    if (!lastChatMessage?.content) {
      return DEFAULTMESSAGE;
    }
    const result = await getAndMatch(lastChatMessage, indexQnA, fields, min_score, true);
    if (result === DEFAULTMESSAGE) {
      return await getAndMatch(lastChatMessage, indexQnA, fields, min_score, false);
    }
    return result;
  } catch (error) {
    console.error("error", error)
  }
  return DEFAULTMESSAGE;
}

export async function getKnowledge(lastChatMessage: any, indexQnA: string, fields: string[], min_score: number = 6, FUZZSCORE: number = 60, noNeedFuzzFirst: boolean = false): Promise<Knowledge> {
  try {
    if (!lastChatMessage?.content) {
      return {
        text: "",
        score: 0
      }
    }
    const query = lastChatMessage.content;

    if (noNeedFuzzFirst) {
      const response = await getElasticQuery(query, 1, indexQnA, fields, noNeedFuzzFirst);
      const result = await response.json()

      if (result.hits.hits.length > 0) {
        console.log(result.hits.hits[0]._score, min_score - 3)
        if (result.hits.hits[0]._score > (min_score - 3)) {
          await addLog(
            result.hits.hits[0]._score,
            result.hits.hits[0]._source.q,
            query,
            TypeLog.NoNeedFuzzPhrase,
            result.hits.hits,
          )
          return {
            text: result.hits.hits[0]._source.a_o ?? result.hits.hits[0]._source.a,
            score: result.hits.hits[0]._score,
          }
        }
      }
      // else {
      //   const response = await getElasticQuery(query, 1, indexQnA, fields);
      //   const result = await response.json()
      //   console.log(result.hits.hits[0]._score)
      //   if (result.hits.hits.length > 0) {
      //     const fuzzScore = fuzz.token_set_ratio(result.hits.hits[0]._source.q, query)
      //     console.log(fuzzScore)
      //     if (result.hits.hits[0]._score > min_score && fuzzScore/10 > min_score) {
      //       await addLog(
      //         result.hits.hits[0]._score,
      //         result.hits.hits[0]._source.q,
      //         query,
      //         TypeLog.NoNeedFuzz,
      //         result.hits.hits,
      //       )
      //       return {
      //         text: result.hits.hits[0]._source.a_o ?? result.hits.hits[0]._source.a,
      //         score: result.hits.hits[0]._score,
      //       }
      //     }
      //   }
      // }
    }
    const response = await getElasticQuery(query, 1, indexQnA, fields);
    const result = await response.json()
    if (result.hits.hits.length === 0) {
      return {
        text: "",
        score: 0
      }
    }
    const question_DB = result.hits.hits[0]._source.q
    const question_S_DB = result.hits.hits[0]._source.q_s
    const fuzzScore = fuzz.token_set_ratio(question_DB, query)
    const fuzzScoreS = fuzz.token_set_ratio(query, question_S_DB)
    await addLog(
      fuzzScore,
      question_DB,
      query,
      TypeLog.FuzzScore,
      result.hits.hits,
      fuzzScoreS
    )
    if (result.hits.hits[0]._score > min_score && (fuzzScore >= FUZZSCORE || fuzzScoreS >= FUZZSCORE)) {
      return {
        text: result.hits.hits[0]._source.a_o ?? result.hits.hits[0]._source.a,
        score: Math.max(result.hits.hits[0]._score, fuzzScore / 10, fuzzScoreS / 10),
      }
    }
    if (result.hits.hits[0]._score > min_score) {
      const queryreplaceKey = replaceKSynonymous(query);
      const fuzzScoreAugmentation = fuzz.token_set_ratio(question_S_DB, queryreplaceKey)
      // const fuzzScorePhatGiao = fuzz.token_sort_ratio(queryPhatGiao, _query);
      await addLog(
        fuzzScoreAugmentation,
        question_S_DB,
        queryreplaceKey,
        TypeLog.FuzzScoreAugmentation
      )
      if (fuzzScoreAugmentation >= FUZZSCORE) {
        return {
          text: result.hits.hits[0]._source.a_o ?? result.hits.hits[0]._source.a,
          score: result.hits.hits[0]._score
        }
      }
      const questionBuddhism = question_S_DB + " Phật Giáo"
      const fuzzScoreBuddhism = fuzz.token_set_ratio(questionBuddhism, queryreplaceKey)
      await addLog(
        fuzzScoreBuddhism,
        questionBuddhism,
        queryreplaceKey,
        TypeLog.FuzzScoreBuddhism
      )
      if (fuzzScoreBuddhism >= FUZZSCORE) {
        return {
          text: result.hits.hits[0]._source.a_o ?? result.hits.hits[0]._source.a,
          score: result.hits.hits[0]._score
        }
      }
    }
    return {
      text: "",
      score: 0
    }
  } catch (error) {
    console.error("error", error)
    return {
      text: "",
      score: 0
    }
  }
}

async function buildRetrievalText(hits: any[]): Promise<string> {
  const answers: string[] = [];
  const hashIds: string[] = [];
  for (const hit of hits) {
    const answer = hit._source.a_o ?? hit._source.a;
    const hashedStringCheck: string = md5(answer.toLowerCase());
    const isHashedInList: boolean = hashIds.includes(hashedStringCheck);
    if (!isHashedInList) {
      hashIds.push(hashedStringCheck);
      answers.push(answer);
    }
  }
  const retrievalText = answers.join("\n")
  // `Sử dụng bối cảnh dưới đây, trả lời câu hỏi đầu đủ kiến thức trong Phật Giáo. \n Bối cảnh: \n${retrievalText}`
  // `Không sáng tạo thêm, không bịa, dựa vào bài sau để trả lời tiếng Việt\n${retrievalText}`
  return retrievalText;
}

export async function addLog(
  score: number,
  question: string,
  query: string,
  type: number,
  hit?: any[],
  other?: number
) {
  try {
    if (type !== TypeLog.FullQuery) {
      if (hit) {
        const modifi = hit.map(item => {
          const { _source, ...rest } = item;
          const modifiedSource = { ..._source };
          delete modifiedSource.a;
          return { _source: modifiedSource, ...rest };
        });
        await insertDocument({
          score: score,
          question: question,
          query: query,
          type: type,
          hit: modifi,
          scoreSynonymous: other
        });
        return;
      }
    }
    await insertDocument({
      score: score,
      question: question,
      query: query,
      type: type,
      hit: hit,
      scoreSynonymous: other
    })
  } catch (error) {
    console.error("error", error)
  }
}

export async function indexExists(index: string) {
  const response = await fetchWithTimeout(`${elasticsearchServer}/${index}?pretty`, {
    method: "HEAD"
  })
  return response.ok
}

export async function insertDocument(doc: Document) {
  // await createIndex()
  doc.timestamp = Date.now()
  const response = await fetchWithTimeout(`${elasticsearchServer}/${indexLogs}/_doc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(doc)
  })
  if (!response.ok) {
    console.error(
      `Failed to insert document. Status: ${response.status}`,
      indexLogs
    )
  }
}

export async function createIndex(): Promise<string> {
  if (!(await indexExists(indexLogs))) {
    const response = await fetchWithTimeout(`${elasticsearchServer}/${indexLogs}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    })
    if (response.ok) {
      await fetchWithTimeout(`${elasticsearchServer}/${indexLogs}/_flush?pretty`, {
        method: "GET"
      })
      console.log(`Index '${indexLogs}' created.`)
    } else {
      console.error(`Failed to create index '${indexLogs}'.`)
    }
  }
  return indexLogs
}

export async function insertQnA(docs: QnA[]) {
  const data: any[] = [];
  docs.forEach(element => {
    console.log(element.id)
    data.push(JSON.stringify({ index: { _index: 'qna', _id: `${element.id}` } }));
    data.push(JSON.stringify(element));
  });
  console.log(data[0], data[1])
  const response = await fetchWithTimeout(`${elasticsearchServer}/_bulk`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: data.join('\n')+ "\n",
  })
  if (!response.ok) {
    console.error(
      `Failed to insert document. Status: ${response.status}`,
      "qna"
    )
  }
}