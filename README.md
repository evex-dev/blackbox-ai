# @evex/blackbox-ai

Blackbox.ai client for TypeScript.

## Install

The package is published via [jsr.io](https://jsr.io/@evex/blackbox-ai).

```shell
deno add jsr:@evex/blackbox-ai # Deno
bunx jsr add --bun @evex/blackbox-ai # Bun
pnpm dlx jsr add --pnpm @evex/blackbox-ai # pnpm
yarn dlx jsr add --yarn @evex/blackbox-ai # Yarn
npx jsr add @evex/blackbox-ai # npm
```

## Usage

```ts
import { generate } from '@evex/blackbox-ai'

const stream = await generate({ model: 'deepseek-v3' }, [{
  role: 'user',
  content: 'Hi, who are you',
}])
for await (const chunk of stream) {
  console.log(chunk)
}
```
