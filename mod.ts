/**
 * @example
 * ```ts
 * import { generate } from '@evex/blackbox-ai'
 * ```
 * @module
 */
import type { LanguageModelV1, LanguageModelV1CallOptions } from '@ai-sdk/provider'

const BASE_HEADERS = {
  Origin: 'https://www.blackbox.ai',
  Referer: 'https://www.blackbox.ai',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'ja',
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-origin',
}

function generateId(): string {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''

  for (let i = 0; i < 7; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length)
    result += characters[randomIndex]
  }

  return result
}

/*export */ const createSession = async () => {
  const res = await fetch('https://www.blackbox.ai', {
    headers: {
      ...BASE_HEADERS,
    },
  })
  const sessionId = res.headers.getSetCookie().find((v) =>
    v.startsWith('sessionId')
  )?.match(/.{8}-.{4}-.{4}-.{4}-.{12}/)?.[0]
  if (!sessionId) {
    throw new Error('Failed to get session id')
  }
  /*await fetch('https://www.useblackbox.io/tlm', {
    method: 'POST',
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'application/json',
      Cookie: `sessionId=${sessionId}`,
      Accept: 'application/json',
    },
    body: JSON.stringify({
      userId: sessionId,
      eventName: 'page visit',
      eventMetadata: {
        tag: 'web',
        referrer: 'https://www.blackbox.ai/?model=DeepSeek-R1',
      },
    }),
  })*/
  await fetch('https://www.blackbox.ai/api/auth/session', {
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'application/json',
      Cookie: `sessionId=${sessionId}`,
    },
  }).then((res) => res.text()) //.then(console.log)
  return sessionId
}

/**
 * Custom model types
 */
export interface Model {
  id: string
  name: string
}
/**
 * Model names you can use
 */
export type AvailableModel =
  | 'deepseek-r1'
  | 'deepseek-v3'
  | 'gemini-2.0-flash'
  | 'llama-3.3-70b-instruct-turbo'
  | 'mistral-small-24b-instruct-2501'
  | 'deepseek-llm-67b-chat'
  | 'dbrx-instruct'
  | 'QwQ-32B-Preview'
  | 'Nous-Hermes-2-Mixtral-8x7B-DPO'

const MODELS: Record<AvailableModel, Model> = {
  'deepseek-r1': {
    id: 'deepseek-reasoner',
    name: 'DeepSeek-R1',
  },
  'deepseek-v3': {
    id: 'deepseek-chat',
    name: 'DeepSeek-V3',
  },
  'gemini-2.0-flash': {
    id: 'Gemini/Gemini-Flash-2.0',
    name: 'Gemini-Flash-2.0',
  },
  'llama-3.3-70b-instruct-turbo': {
    id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    name: 'Meta-Llama-3.3-70B-Instruct-Turbo',
  },
  'mistral-small-24b-instruct-2501': {
    id: 'mistralai/Mistral-Small-24B-Instruct-2501',
    name: 'Mistral-Small-24B-Instruct-2501',
  },
  'deepseek-llm-67b-chat': {
    id: 'deepseek-ai/deepseek-llm-67b-chat',
    name: 'DeepSeek-LLM-Chat-(67B)',
  },
  'dbrx-instruct': {
    id: 'databricks/dbrx-instruct',
    name: 'DBRX-Instruct',
  },
  'QwQ-32B-Preview': {
    id: 'Qwen/QwQ-32B-Preview',
    name: 'Qwen-QwQ-32B-Preview',
  },
  'Nous-Hermes-2-Mixtral-8x7B-DPO': {
    id: 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO',
    name: 'Nous-Hermes-2-Mixtral-8x7B-DPO',
  },
}

/**
 * Config for generating
 */
export interface GenerationConfig {
  /**
   * Model name or custom model definition
   */
  model: AvailableModel | Model

  /**
   * A custom fetch function that you can set.
   * @default `globalThis.fetch`
   */
  fetch?: (req: Request) => Promise<Response>

  /**
   * Max output tokens
   * @default 1024
   */
  maxTokens?: number

  /**
   * System prompt
   */
  systemPrompt?: string

  /**
   * Temperature
   */
  temperature?: string

  /**
   * topP
   */
  topP?: number
}

/**
 * Message
 */
export interface Message {
  content: string
  role: 'user' | 'assistant'
  data?: {
    imagesData?: {
      filePath: string
      /** Base64 URL */
      contents: string
    }[]
  }
}

/**
 * Generate a content
 * @param config A config for generating
 * @param messages messages
 * @returns ReadableStream that streams string
 */
export const generate = async (
  config: GenerationConfig,
  messages: Message[],
): Promise<ReadableStream<string>> => {
  const model = typeof config.model === 'string'
    ? MODELS[config.model]
    : config.model

  const firstMessageId = generateId()

  const body = {
    messages: messages.map((message, i) => ({
      id: i === 0 ? firstMessageId : generateId(),
      role: message.role,
      content: message.content,
      data: message.data ? {
        imagesData: message.data.imagesData ?? [],
        fileText: '',
        title: ''
      } : null
    })),
    agentMode: {
      'mode': true,
      ...model,
    },
    id: firstMessageId,
    previewToken: null,
    userId: null,
    codeModelMode: true,
    trendingAgentMode: {},
    isMicMode: false,
    userSystemPrompt: config.systemPrompt,
    maxTokens: config.maxTokens ?? 1024,
    playgroundTopP: config.topP ?? null,
    playgroundTemperature: config.temperature ?? null,
    'isChromeExt': false,
    'githubToken': '',
    'clickedAnswer2': false,
    'clickedAnswer3': false,
    'clickedForceWebSearch': false,
    'visitFromDelta': false,
    'isMemoryEnabled': false,
    'mobileClient': false,
    'userSelectedModel': model.name,
    'validated': '00f37b34-a166-4efb-bce5-1312d87f2f94',
    'imageGenerationMode': false,
    'webSearchModePrompt': false,
    'deepSearchMode': false,
    'domains': null,
    'vscodeClient': false,
    'codeInterpreterMode': false,
    'customProfile': {
      'name': '',
      'occupation': '',
      'traits': [],
      'additionalInfo': '',
      'enableNewChats': false,
    },
    'session': null,
    'isPremium': false,
  }

  const req = new Request('https://www.blackbox.ai/api/chat', {
    method: 'POST',
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'appliction/json',
      //Cookie: `sessionId=${sessionId}`,
    },
    body: JSON.stringify(body),
  })

  const res = await (config.fetch ?? globalThis.fetch.bind(globalThis))(req)
  if (!res.ok) {
    throw new Error(`Received status code ${res.status} ${res.statusText}`)
  }
  if (!res.body) {
    throw new Error('Response body is null.')
  }
  return res.body.pipeThrough(new TextDecoderStream())
}
function uint8ArrayToDataUrl(uint8Array: Uint8Array, mimeType: string) {
  // Convert Uint8Array to binary string
  const binaryString = Array.from(uint8Array)
      .map(byte => String.fromCharCode(byte))
      .join('');
  
  // Convert binary string to base64
  const base64String = btoa(binaryString);
  
  // Create data URL
  return `data:${mimeType};base64,${base64String}`;
}
/**
 * Wrapper for chatting
 * @example
 * ```ts
 * const chat = new Chat({
 *   model: 'gemini-2.0-flash'
 * })
 *
 * await chat.send({ role: 'user', content: 'aaa' })
 * await chat.sendStream({ role: 'user', content: 'aaa' })
 * ```
 * @deprecated use AI SDK
 */
export class Chat {
  #config: GenerationConfig
  messages: Message[]
  constructor(config: GenerationConfig, initialMessages: Message[] = []) {
    this.#config = config
    this.messages = initialMessages
  }

  async *sendStream(
    message: Message | Message[],
    generationConfig?: GenerationConfig,
  ): AsyncGenerator<string, void, unknown> {
    this.messages = this.messages.concat(message)
    const config = {
      ...this.#config,
      ...generationConfig,
    }
    const stream = (await generate(config, this.messages)).getReader()
    while (true) {
      const { done, value } = await stream.read()
      if (value) {
        yield value
      }
      if (done) {
        break
      }
    }
  }
  async send(
    message: Message | Message[],
    generationConfig?: GenerationConfig,
  ): Promise<string> {
    let result = ''
    for await (const chunk of this.sendStream(message, generationConfig)) {
      result += chunk
    }
    return result
  }
}

/**
 * Create blackbox client
 * @param modelId Model ID
 * @returns AI Sdk model
 */
export function blackbox (modelId: AvailableModel): LanguageModelV1 {
  const createGenerated = (opts: LanguageModelV1CallOptions) => {
    return generate({
      model: modelId
    }, opts.prompt.flatMap(prompt => {
      if (prompt.role !== 'user' && prompt.role !== 'assistant') {
        return []
      }
      const texts = prompt.content.filter(part => part.type === 'text').map(part => part.text)
      const images = prompt.content.filter(part => part.type === 'image').map(part => {
        if (part.image instanceof URL) {
          throw new Error('URL is not supported')
        }
        if (!part.mimeType) {
          throw new Error('mimeType is required')
        }
        return uint8ArrayToDataUrl(part.image, part.mimeType)
      })
      return {
        role: prompt.role,
        content: texts.join('\n'),
        data: images.length === 0 ? undefined : {
          imagesData: images.map(image => ({
            filePath: '',
            contents: image
          }))
        }
      }
    }))
  }
  return {
    specificationVersion: 'v1',
    defaultObjectGenerationMode: 'json',
    supportsStructuredOutputs: false,
    modelId,
    provider: 'blackbox',
    async doGenerate(options) {
      const reader = (await createGenerated(options)).getReader()
      let result = ''
      while (true) {
        const { done, value } = await reader.read()
        if (value) {
          result += value
        }
        if (done) {
          break
        }
      }
      let reasoning: string | undefined
      if (result.startsWith('<think>')) {
        const thinkFinishes = result.indexOf('</think>')
        if (thinkFinishes !== -1) {
          reasoning = result.slice(7, thinkFinishes)
          result = result.slice(thinkFinishes + 8)
        }
      }
      return {
        finishReason: 'stop',
        rawCall: {
          rawPrompt: options.prompt,
          rawSettings: options
        },
        text: result,
        reasoning,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
        },
      }
    },
    async doStream(options) {
      const stream = await createGenerated(options)
      let isInReasoning = false
      let text = ''
      return {
        rawCall: {
          rawPrompt: options.prompt,
          rawSettings: options
        },
        stream: stream.pipeThrough(new TransformStream({
          transform(chunk, controller) {
            text += chunk
            if (text.startsWith('<think>')) {
              isInReasoning = true
              text = text.slice(7)
              controller.enqueue({
                type: 'reasoning',
                textDelta: text
              })
              return
            }
            if (isInReasoning && text.includes('</think>')) {
              const endThinkIndex = text.indexOf('</think>')
              isInReasoning = false
              controller.enqueue({
                type: 'reasoning',
                textDelta: text.slice(0, endThinkIndex)
              })
              controller.enqueue({
                type: 'text-delta',
                textDelta: text.slice(endThinkIndex + 8).trimEnd()
              })
              text = ''
              return
            }
            controller.enqueue({
              type: isInReasoning ? 'reasoning' : 'text-delta',
              textDelta: chunk
            })
          },
          flush(controller) {
            controller.enqueue({
              type: 'finish',
              finishReason: 'stop',
              usage: {
                promptTokens: 0,
                completionTokens: 0,
              }
            })
          }
        }))
      }
    },
  }
}
