/**
 * @module
 * @example
 * ```ts
 * import { BlackboxAI } from '@evex/blackbox-ai'
 * ```
 */

/**
 * Client options
 */
export interface Init {
  modelName: 'gpt-4o' | 'claude-sonnet-3.5' | 'gemini-pro' | 'blackboxai'
}

/**
 * Chat Init
 */
export interface ChatInit {
  history?: Message[]
}

/**
 * Message
 */
export type Message = {
  role: 'user' | 'assistant'
  content: string
  data?: {
    /**
     * Base64 URL
     */
    imageBase64: string
  }
}

class Chat {
  #history: Message[]
  #id: string
  #core: BlackboxAI
  constructor(core: BlackboxAI, init: ChatInit) {
    this.#core = core
    this.#history = init.history ?? []
    this.#id = crypto.randomUUID()
  }
  #createRequest(messages: Message[]) {
    const json = {
      messages: messages.map(message => ({ ...message, id: this.#id })),
      id: this.#id,
      previewToken: null,
      userId: null,
      codeModelMode: true,
      agentMode: {},
      trendingAgentMode: {},
      isMicMode: false,
      userSystemPrompt: null,
      maxTokens: 1024,
      playgroundTopP: 0.9,
      playgroundTemperature: 0.5,
      isChromeExt: false,
      githubToken: null,
      clickedAnswer2: false,
      clickedAnswer3: false,
      clickedForceWebSearch: false,
      visitFromDelta: false,
      mobileClient: false,
      userSelectedModel: this.#core.init.modelName
    }
    return new Request('https://www.blackbox.ai/api/chat', {
      body: JSON.stringify(json),
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST'
    })
  }
  #formatResponse(body: ReadableStream<Uint8Array>) {
    let newLines = 0
    return body.pipeThrough(new TextDecoderStream()).pipeThrough(new TransformStream<string>({
      transform(chunk, ctrler) {
        if (newLines === 2) {
          return ctrler.enqueue(chunk)
        }
        let resultI
        for (let i = 0; i < chunk.length; i++) {
          const char = chunk[i]
          if (char === '\n') {
            newLines++
          }
          if (newLines === 2) {
            resultI = i
            break
          }
        }
        if (resultI) {
          ctrler.enqueue(chunk.slice(resultI + 1))
        }
      }
    }))
  }
  async generate(messages: Message | Message[]): Promise<string> {
    const req = this.#createRequest([...this.#history, ...(Array.isArray(messages) ? messages : [messages]),])
    const body = await fetch(req).then(res => res.body)
    if (!body) { throw new Error('Response body is null.') }

    let generated = ''
    for await (const chunk of this.#formatResponse(body)) {
      generated += chunk
    }
    return generated
  }
  async * generateWithStream(messages: Message | Message[]): AsyncGenerator<string, void, unknown> {
    const req = this.#createRequest([...this.#history, ...(Array.isArray(messages) ? messages : [messages]),])
    const body = await fetch(req).then(res => res.body)
    if (!body) { throw new Error('Response body is null.') }

    const stream = this.#formatResponse(body)
    const reader = stream.getReader()
    while (true) {
      const { value, done } = await reader.read()
      if (value) {
        yield value as string
      }
      if (done) {
        return
      }
    }
  }
}

/**
 * Main class
 */
export class BlackboxAI {
  readonly init: Init
  constructor(init: Init) {
    this.init = init
  }
  startChat(init: ChatInit): Chat {
    return new Chat(this, init)
  }
}
