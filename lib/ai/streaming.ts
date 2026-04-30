import type { AIProvider, Message } from './providers/base'

export function createSSEStream(text: string): ReadableStream {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      const tokens = text.split(' ')
      let index = 0

      function pushToken() {
        if (index >= tokens.length) {
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
          return
        }

        const token = tokens[index]
        const data = JSON.stringify({ content: token + (index < tokens.length - 1 ? ' ' : '') })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        index++

        setTimeout(pushToken, 10)
      }

      pushToken()
    }
  })
}

export function streamToResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

export async function createMessageStream(
  messages: Message[],
  provider: AIProvider,
  systemPrompt?: string
): Promise<Response> {
  try {
    const stream = provider.stream ? provider.stream(messages, systemPrompt) : null

    if (!stream) {
      throw new Error('Provider does not support streaming')
    }

    const sseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        for await (const token of stream) {
          const data = JSON.stringify({ content: token })
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    })

    return streamToResponse(sseStream)
  } catch (error) {
    const errorStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        const data = JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
        controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    })
    return streamToResponse(errorStream)
  }
}
