import { blackbox } from './mod.ts'
import { generateText, streamText } from 'npm:ai'

const result = await generateText({
  model: blackbox('deepseek-r1'),
  messages: [
    {
      role: 'system',
      content: '回答の最後に★つけて'
    },
    {
      role: 'user',
      content: '458654+58547=?'
    }
  ]
})

console.log(result.text)