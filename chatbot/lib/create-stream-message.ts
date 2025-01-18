export function createDelayedStreamFromString(
  text: string,
  delay: number = 100
): ReadableStream<string> {
  const encoder = new TextEncoder()
  const textUint8Array = encoder.encode(text)

  return new ReadableStream({
    async start(controller) {
      let wordStart = 0

      for (let i = 0; i < textUint8Array.length; i++) {
        if (textUint8Array[i] === 32 || i === textUint8Array.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay))
          const word = new TextDecoder().decode(
            textUint8Array.slice(wordStart, i + 1)
          )
          controller.enqueue(word)
          wordStart = i + 1
        }
      }
      controller.close()
    }
  })
}
