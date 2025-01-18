import { StreamingTextResponse } from "ai"
import { Knowledge, getKnowledge } from "@/lib/elastic"
import { createDelayedStreamFromString } from "@/lib/create-stream-message"

export const runtime = "edge"

export async function POST(request: Request) {
  const json = await request.json()
  request.signal
  const { messages } = json as {
    messages: any[]
  }
  try {
    let lastItem = messages[messages.length - 1]
    let system = messages[0]
    if (lastItem !== undefined) {
      const knowledge: Knowledge = await getKnowledge(lastItem)
      if (knowledge.score > 8) {
        return new StreamingTextResponse(
          createDelayedStreamFromString(knowledge.text, 100)
        )
      }
      system.content = knowledge.text
      lastItem.content = `${lastItem.content}`
    }
    const body = {
      model: json.model,
      messages: messages,
      stream: true // Remote not stream
    }
    console.log(body)
    const response = await fetch(
      process.env.NEXT_PUBLIC_OLLAMA_URL + "/api/chat",
      {
        method: "POST",
        body: JSON.stringify(body),
        signal: request.signal
      }
    )
    if (!response.ok) {
      return new StreamingTextResponse(
        createDelayedStreamFromString(
          "Xin lỗi máy chủ của tôi đang có vấn đề, vui lòng liên hệ quản trị viên!",
          100
        )
      )
    }
    // // Remote not stream
    // const data = await response.json()
    // return new StreamingTextResponse(
    //   createDelayedStreamFromString(data.message.content, 100)
    // )
    // // Local stream json
    // const { readable, writable } = new TransformStream()
    // function jsonDecoder() {
    //   return new TransformStream({
    //     transform(chunk, controller) {
    //       controller.enqueue(JSON.parse(chunk).message.content)
    //     }
    //   })
    // }
    // response.body
    //   ?.pipeThrough(new TextDecoderStream())
    //   .pipeThrough(jsonDecoder())
    //   .pipeTo(writable)
    // return new StreamingTextResponse(readable)

    const { readable, writable } = new TransformStream()
    response.body
      ?.pipeThrough(new TextDecoderStream())
      .pipeTo(writable)
    return new StreamingTextResponse(readable)
  } catch (error: any) {
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
