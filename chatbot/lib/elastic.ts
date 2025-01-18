const fuzz = require("fuzzball")

const elasticsearchServer = "http://localhost:9200" // Replace with your Elasticsearch server address
const indexQnA = "qna,qna_remove_accents"
const indexLogs = "logs-qna"

export interface Knowledge {
  text: string
  score: number
}

interface Document {
  score: number
  question: string
  query: string
  type: number
  timestamp?: number
  other?: any
}
enum TypeLog {
  ElasticScore,
  FuzzScore,
  FuzzScoreAugmentation
}

export async function getKnowledge(lastChatMessage: any): Promise<Knowledge> {
  try {
    const query = {
      query: {
        multi_match: {
          query: lastChatMessage?.content ?? "",
          fields: ["q", "a"]
        }
      },
      size: 2
    }
    const response = await fetch(`${elasticsearchServer}/${indexQnA}/_search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(query)
    })
    const result = await response.json()
    const question = result.hits.hits[0]._source.q
    const _query = lastChatMessage.content
    const fuzzScore = fuzz.token_set_ratio(question, _query)
    if (result.hits.hits[0]._score > 10 && fuzzScore > 80) {
      await addLog(
        fuzzScore,
        question,
        _query,
        TypeLog.ElasticScore,
        result.hits.hits[0]._score,
      )
      return {
        text: result.hits.hits[0]._source.q_o ? createA(result.hits.hits[0]._source.a, result.hits.hits[0]._source.q_o) : result.hits.hits[0]._source.a ,
        score: result.hits.hits[0]._score
      }
    }
    if (result.hits.hits[0]._score > 8) {
      const queryPhatGiao = question + " Phật Giáo"
      const fuzzScorePhatGiao = fuzz.token_sort_ratio(queryPhatGiao, _query)
      // const fuzzScorePhatGiao = fuzz.token_set_ratio(queryPhatGiao, _query);
      await addLog(
        fuzzScore,
        queryPhatGiao,
        _query,
        TypeLog.FuzzScoreAugmentation,
        result.hits.hits[0]._score 
      )

      if (fuzzScorePhatGiao > 80) {
        return {
          text: result.hits.hits[0]._source.q_o ? createA(result.hits.hits[0]._source.a, result.hits.hits[0]._source.q_o) : result.hits.hits[0]._source.a ,
          score: result.hits.hits[0]._score
        }
      }
    }
    const sResult = await buildRetrievalText(result.hits.hits)
    return {
      text: sResult,
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

async function buildRetrievalText(hits: any[]) {
  const retrievalText = hits.map(item => `${item._source.a}\n`).join("\n")

  // return `Sử dụng bối cảnh dưới đây, trả lời câu hỏi đầu đủ kiến thức trong Phật Giáo. \n Bối cảnh: \n${retrievalText}`
  return `Dựa vào bài sau để trả lời \n${retrievalText}`
  // return `Không sáng tạo thêm, không bịa, dựa vào bài sau để trả lời tiếng Việt\n${retrievalText}`
}

async function addLog(
  score: number,
  question: string,
  query: string,
  type: number,
  other?: any
) {
  try {
    await insertDocument({
      score: score,
      question: question,
      query: query,
      type: type,
      other: other
    })
  } catch (error) {
    console.error("error", error)
  }
}

export async function indexExists(index: string) {
  const response = await fetch(`${elasticsearchServer}/${index}?pretty`, {
    method: "HEAD"
  })
  return response.ok
}

export async function insertDocument(doc: Document) {
  await createIndex()
  doc.timestamp = Date.now()
  const response = await fetch(`${elasticsearchServer}/${indexLogs}/_doc`, {
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
    const response = await fetch(`${elasticsearchServer}/${indexLogs}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    })
    if (response.ok) {
      await fetch(`${elasticsearchServer}/${indexLogs}/_flush?pretty`, {
        method: "GET"
      })
      console.log(`Index '${indexLogs}' created.`)
    } else {
      console.error(`Failed to create index '${indexLogs}'.`)
    }
  }
  return indexLogs
}

function createA(s: string, question: string){
  return `Có phải câu hỏi của bạn là: ${question}\n\r${s}`;
}