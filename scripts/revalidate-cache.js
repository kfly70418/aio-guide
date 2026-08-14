const SECRET = process.env.REVALIDATE_SECRET || 'dev-secret-123'

async function revalidate(path) {
  try {
    const response = await fetch('https://www.apixuan.com/api/revalidate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        secret: SECRET,
      }),
    })

    const data = await response.json()

    if (response.ok) {
      console.log(`✅ 成功刷新: ${path}`)
      console.log('   响应:', data)
    } else {
      console.log(`❌ 刷新失败: ${path}`)
      console.log('   错误:', data)
    }
  } catch (error) {
    console.error('请求失败:', error.message)
  }
}

// 刷新常用页面
async function revalidateAll() {
  console.log('开始刷新缓存...\n')

  await revalidate('/')
  await revalidate('/providers')
  await revalidate('/models')
  await revalidate('/articles')

  console.log('\n完成！')
}

revalidateAll()
