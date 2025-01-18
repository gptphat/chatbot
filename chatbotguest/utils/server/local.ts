
import { Message } from '@/types/chat';
import { StreamingTextResponse } from 'ai';
import { createDelayedStreamFromString } from '../create-stream-message';

export const LocalAIStream = async (messages: Message[], signal: any): Promise<StreamingTextResponse> => {
    const body = {
        model: process.env.DEFAULT_MODEL,
        messages: messages,
        stream: true
    }
    const response = await fetch(
        process.env.NEXT_PUBLIC_OLLAMA_URL + "/api/chat",
        {
            method: "POST",
            body: JSON.stringify(body),
            headers: {
                "Content-Type": "application/json",
            },
            signal: signal
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
    if (process.env.USE_FASTAPI_LITELLM === 'true') {
        const { readable, writable } = new TransformStream();
        response.body?.pipeTo(writable);
        return new StreamingTextResponse(readable);
    }
    const decoder = new TextDecoder();
    const encoder = new TextEncoder()
    const jsonDecoder = () => {
        return new TransformStream({
            transform(chunk, controller) {
                const queue = encoder.encode(JSON.parse(decoder.decode(chunk)).message.content);
                controller.enqueue(queue)
            }
        })
    }
    const { readable, writable } = new TransformStream()
    response.body
        ?.pipeThrough(jsonDecoder())
        .pipeTo(writable)
    return new StreamingTextResponse(readable);
}
