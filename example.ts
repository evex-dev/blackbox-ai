import { Chat } from './mod.ts'

const chat = new Chat({
  model: 'deepseek-r1',
})

for await (const chunk of chat.sendStream({ role: 'user', content: '何か物語を書いて'})) {
  await Deno.stdout.write(new TextEncoder().encode(chunk))
}
