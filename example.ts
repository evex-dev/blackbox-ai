import { BlackboxAI } from './mod.ts'

const result = await new BlackboxAI({
  modelName: 'gpt-4o'
}).startChat({}).generateWithStream([
  {
    role: 'user',
    content: Deno.args[0]
  }
])
for await (const chunk of result) {
  Deno.stdout.write(new TextEncoder().encode(chunk))
}
