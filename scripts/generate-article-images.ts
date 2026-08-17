import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import https from 'https';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const images = [
  {
    filename: 'api-key-leaked-timeline.png',
    alt: 'API Key 泄露紧急止损时间线',
    prompt: 'A clean, modern timeline infographic showing emergency response steps. Dark navy blue background with bright cyan accents. Five time nodes arranged horizontally: 1 min (key with X icon), 3 min (line chart icon), 5 min (headset support icon), 10 min (circular arrows icon), 30 min (shield checkmark icon). Minimalist flat design, professional tech style, geometric shapes, no text labels in the image.'
  },
  {
    filename: 'api-usage-normal-vs-abnormal.png',
    alt: '正常消费 vs 异常消费对比曲线图',
    prompt: 'A simple line chart visualization comparing normal vs abnormal API consumption patterns. Dark background with two distinct lines: smooth green line staying flat around bottom (normal usage pattern), and sharp red spike shooting upward in the middle (abnormal usage spike). Time axis showing 24-hour period with spike occurring at 3-9 AM section. Clean data visualization style with grid lines, minimalist design.'
  },
  {
    filename: 'api-key-replacement-checklist.png',
    alt: 'API Key 更换检查清单',
    prompt: 'A modern checklist interface design showing 5 items with empty checkboxes. Dark navy theme background with bright cyan checkbox outlines. Items represented by clean icons: document/file icon, git branch icon, cloud server icon, web browser icon, people/team icon. Minimalist UI design, flat style, even spacing, no text labels needed.'
  },
  {
    filename: 'secure-vs-insecure-storage.png',
    alt: '安全密钥存储 vs 不安全存储对比',
    prompt: 'A split comparison infographic with clear divide down the middle. Left side (green theme): password manager vault icon, encrypted lock icon, shield with checkmark. Right side (red theme): browser bookmark icon, messaging app icon, document file icon, code repository icon - all with red X marks overlaid. Dark background, simple geometric icons, clear visual contrast between safe and unsafe practices.'
  },
  {
    filename: 'api-key-leak-sources-pie-chart.png',
    alt: 'API Key 泄露途径统计饼图',
    prompt: 'A clean pie chart showing 4 segments with different sizes. Largest segment 65% with git/code branch icon, second segment 20% with share/link icon, third segment 10% with bug/virus icon, smallest segment 5% with cloud service icon. Dark background with segments in cyan, blue, purple, and coral colors. Modern data visualization style with slight spacing between segments.'
  }
];

async function downloadImage(url: string, filepath: string) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(filepath);
      });
    }).on('error', reject);
  });
}

async function generateImages() {
  const outputDir = path.join(process.cwd(), 'public', 'images', 'articles');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    console.log(`\n[${i + 1}/${images.length}] 正在生成: ${image.filename}`);
    console.log(`提示词: ${image.prompt.substring(0, 100)}...`);

    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: image.prompt,
        n: 1,
        size: "1792x1024",
        quality: "standard",
        style: "natural"
      });

      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        console.error(`❌ 未获取到图片 URL`);
        continue;
      }

      const filepath = path.join(outputDir, image.filename);
      await downloadImage(imageUrl, filepath);
      console.log(`✅ 已保存: ${filepath}`);
      
      // 等待 5 秒避免触发速率限制
      if (i < images.length - 1) {
        console.log('等待 5 秒...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (error: any) {
      console.error(`❌ 生成失败: ${error.message}`);
    }
  }

  console.log('\n✅ 所有图片生成完成！');
}

generateImages();
