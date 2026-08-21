import puppeteer from 'puppeteer'

async function checkHomepage() {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()

  console.log('正在访问 http://localhost:3000...')
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 })

  // 获取页面标题
  const title = await page.title()
  console.log(`页面标题: ${title}\n`)

  // 查找所有服务商卡片
  const providers = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[class*="provider"]'))
    const names = []

    // 尝试多种选择器
    const h3s = document.querySelectorAll('h3')
    h3s.forEach(h3 => {
      const text = h3.textContent.trim()
      if (text && text.length < 50) {
        names.push(text)
      }
    })

    return names
  })

  console.log(`找到 ${providers.length} 个服务商：`)
  providers.forEach((name, i) => {
    console.log(`  ${i + 1}. ${name}`)
  })

  // 检查特定服务商
  const targetProviders = ['OpenOx', 'LinkAI', 'Micu', 'SSSAiCode', 'CCTQ', '78 Code']
  console.log('\n检查新增/更新的服务商：')
  targetProviders.forEach(name => {
    const found = providers.some(p => p.includes(name))
    console.log(`  ${found ? '✅' : '❌'} ${name}`)
  })

  // 截图
  await page.screenshot({ path: 'scripts/.cache/homepage.png', fullPage: true })
  console.log('\n📸 首页截图已保存到: scripts/.cache/homepage.png')

  await browser.close()
}

checkHomepage().catch(console.error)
