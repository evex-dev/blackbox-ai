import { blackbox } from './mod.ts'
import { streamText } from 'npm:ai'

for await (
  const chunk of streamText({
    model: blackbox('QwQ-32B-Preview'),
    prompt: 'あなたは誰'
  }).textStream
) {
  await Deno.stdout.write(new TextEncoder().encode(chunk))
}
