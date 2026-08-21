/**
 * 测试哪个 baseURL 可用
 */
require('dotenv').config({ path: '.env.local' })
const OpenAI = require('openai').default

const testUrls = [
  'https://api.openai.com/v1',
  'https://api.api666666.org/v1',
  'https://api.openai-hk.com/v1',
  'https://api.chatanywhere.tech/v1',
  'https://api.gptsapi.net/v1',
]

async function testUrl(baseURL) {
  console.log(`\n测试: ${baseURL}`)
  try {
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: baseURL,
      timeout: 10000,
    })

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: '你好' }],
      max_tokens: 10,
    })

    console.log(`✅ 成功: ${response.choices[0].message.content}`)
    return baseURL
  } catch (error) {
    console.log(`❌ 失败: ${error.message}`)
    return null
  }
}

async function main() {
  console.log('🔍 测试 API 连通性...\n')

  for (const url of testUrls) {
    const result = await testUrl(url)
    if (result) {
      console.log(`\n\n🎉 找到可用的 baseURL: ${result}`)
      return result
    }
  }

  console.log('\n\n❌ 所有 baseURL 都不可用')
}

main().catch(console.error)
