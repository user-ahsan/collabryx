import { ProviderRegistry } from './registry'
import { MiniMaxProvider } from './minimax'
import { OpenAI } from 'openai'

const registry = new ProviderRegistry()

if (process.env.MINIMAX_API_KEY) {
  registry.registerProvider({
    name: 'minimax',
    provider: new MiniMaxProvider({
      apiKey: process.env.MINIMAX_API_KEY,
      baseURL: process.env.MINIMAX_BASE_URL,
      model: process.env.MINIMAX_MODEL || 'MiniMax-M2.7'
    }),
    priority: 1,
    capabilities: ['chat', 'streaming']
  })
}

if (process.env.OPENAI_API_KEY) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  registry.registerProvider({
    name: 'openai',
    provider: {
      config: {
        name: 'openai',
        model: 'gpt-4o-mini',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 60000
      },
      async chat(messages, systemPrompt) {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: systemPrompt
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages
        })
        return {
          content: response.choices[0].message.content || '',
          provider: 'openai',
          model: response.model,
          finishReason: response.choices[0].finish_reason,
          usage: {
            promptTokens: response.usage?.prompt_tokens || 0,
            completionTokens: response.usage?.completion_tokens || 0,
            totalTokens: response.usage?.total_tokens || 0
          }
        }
      },
      async *stream(messages, systemPrompt) {
        const stream = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: systemPrompt
            ? [{ role: 'system', content: systemPrompt }, ...messages]
            : messages,
          stream: true
        })
        for await (const chunk of stream) {
          yield chunk.choices[0]?.delta?.content || ''
        }
      }
    },
    priority: 2,
    capabilities: ['chat', 'streaming']
  })
}

if (process.env.ANTHROPIC_API_KEY) {
  registry.registerProvider({
    name: 'anthropic',
    provider: {
      config: {
        name: 'anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: 'claude-sonnet-4-20250514',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 60000
      },
      async chat(messages, systemPrompt) {
        const anthropicKey = process.env.ANTHROPIC_API_KEY!
        const allMessages: Array<{ role: string; content: string }> = []
        if (systemPrompt) {
          allMessages.push({ role: 'system', content: systemPrompt })
        }
        allMessages.push(...messages)

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': anthropicKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            messages: allMessages,
            max_tokens: 1000
          })
        })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          throw new Error(`Anthropic API error: ${response.status} - ${JSON.stringify(errorBody)}`)
        }

        const data = await response.json() as {
          content: Array<{ type: string; text: string }>
          model: string
          stop_reason: string
          usage: { input_tokens: number; output_tokens: number }
        }

        const responseText = data.content[0]?.text || ''

        return {
          content: responseText,
          provider: 'anthropic',
          model: data.model,
          finishReason: data.stop_reason,
          usage: {
            promptTokens: data.usage.input_tokens,
            completionTokens: data.usage.output_tokens,
            totalTokens: data.usage.input_tokens + data.usage.output_tokens
          }
        }
      }
    },
    priority: 3,
    capabilities: ['chat']
  })
}

export { registry as providerRegistry }
export { ProviderRegistry } from './registry'
