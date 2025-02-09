import { Chat } from './mod.ts'

const chat = new Chat({
  model: 'QwQ-32B-Preview',
})

for await (
  const chunk of chat.sendStream({ role: 'user', content: 'あなたは誰' })
) {
  await Deno.stdout.write(new TextEncoder().encode(chunk))
}
