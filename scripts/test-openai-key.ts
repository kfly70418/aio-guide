import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testKey() {
  console.log('Testing OpenAI API Key...');
  console.log(`Key prefix: ${process.env.OPENAI_API_KEY?.substring(0, 20)}...`);
  
  try {
    const response = await openai.models.list();
    console.log('✅ API Key 有效！');
    console.log(`可用模型数量: ${response.data.length}`);
  } catch (error: any) {
    console.error('❌ API Key 测试失败:');
    console.error(`错误信息: ${error.message}`);
    console.error(`状态码: ${error.status}`);
  }
}

testKey();
