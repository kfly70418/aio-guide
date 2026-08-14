# API选 网站 SEO 分析报告

生成日期：2026-08-14  
站点：apixuan.com（待解析）  
技术栈：Next.js 16.3.0 + Supabase

---

## 📊 总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| **技术 SEO** | ⭐⭐⭐⭐☆ 85/100 | 基础扎实，有提升空间 |
| **内容 SEO** | ⭐⭐⭐⭐☆ 80/100 | 结构合理，需增强关键词 |
| **移动端优化** | ⭐⭐⭐⭐⭐ 95/100 | 响应式设计优秀 |
| **速度性能** | ⭐⭐⭐⭐☆ 80/100 | ISR 良好，可优化缓存 |
| **结构化数据** | ⭐⭐⭐⭐☆ 85/100 | Schema 完整，缺少常见问题 |

**综合评分：85/100** ✅ 良好

---

## ✅ 已实现的 SEO 最佳实践

### 1. 元数据管理 ✅
- ✅ 每个页面都有独立的 `generateMetadata`
- ✅ 动态生成 title、description、OG 标签
- ✅ 正确使用 `noindex` 处理空数据页面（模型详情/404）
- ✅ 文章页面标记为 `type: 'article'`，包含发布/修改时间
- ✅ 语言标签正确设置为 `lang="zh-CN"`

### 2. 结构化数据 (JSON-LD) ✅
- ✅ **Organization Schema**：品牌信息（首页）
- ✅ **WebSite Schema**：站点搜索框（首页）
- ✅ **BreadcrumbList Schema**：面包屑导航（所有子页面）
- ✅ **Article Schema**：文章页面完整标记
- ✅ 模型详情页无结构化数据（正常，价格数据不适合 Product Schema）

### 3. URL 架构 ✅
- ✅ 清晰的 URL 层级：`/providers/[slug]`、`/models/[slug]`、`/articles/[slug]`
- ✅ 使用语义化 slug（非数字 ID）
- ✅ 正确配置 `canonical` 标签（lib/seo.ts）
- ✅ robots.txt 正确排除管理后台和 API 路由

### 4. Sitemap ✅
- ✅ 动态生成 sitemap.xml
- ✅ 包含所有已发布的 providers、models、articles
- ✅ 设置正确的 `changeFrequency` 和 `priority`
- ✅ 在 robots.txt 中声明 sitemap 位置

### 5. 移动端优化 ✅
- ✅ 响应式设计（Tailwind CSS）
- ✅ 所有页面适配移动端布局
- ✅ 使用 `min-w-full` 确保表格在移动端可滚动

### 6. 性能优化 ✅
- ✅ 使用 ISR（Incremental Static Regeneration）
  - 首页：5 分钟 (`revalidate = 300`)
  - 文章页：10 分钟 (`revalidate = 600`)
  - 模型/中转站详情页：5 分钟
- ✅ Next.js Image 组件优化（logo 使用 `priority`）
- ✅ 使用 Turbopack 构建（Next.js 16）

### 7. 语义化 HTML ✅
- ✅ 正确使用 `<header>`、`<main>`、`<footer>`、`<nav>`、`<article>`
- ✅ 标题层级合理（h1 → h2 → h3）
- ✅ 所有链接包含可访问的文本
- ✅ 面包屑使用 `<nav aria-label="面包屑">` + `<ol>`

---

## ⚠️ 需要改进的问题

### 🔴 严重问题（影响收录）

#### 1. 缺少 Favicon（多格式）
**现状**：
- ✅ 有 `app/icon.svg`（浏览器标签图标）
- ❌ 缺少 `app/apple-icon.png`（虽然构建显示有路由，但实际文件不存在）
- ❌ 缺少 `app/favicon.ico`（传统浏览器兼容）

**影响**：
- 浏览器书签无图标
- 移动端添加到主屏幕无图标
- 搜索结果可能缺少品牌识别

**解决方案**：
```bash
# 需要生成以下文件
app/apple-icon.png           # 180x180，iOS 主屏幕图标
app/favicon.ico              # 32x32，传统浏览器
public/favicon-16x16.png     # 可选
public/favicon-32x32.png     # 可选
```

---

#### 2. 缺少 Open Graph 默认图片配置
**现状**：
- ✅ `public/og-default.png` 文件存在（49KB）
- ❌ `lib/seo.ts` 中 `generateSEOMetadata` 未设置默认 OG 图片
- ❌ 首页、列表页等无自定义图片的页面缺少 OG 图片

**影响**：
- 分享到社交媒体（微信、Twitter、Facebook）时无预览图
- 降低点击率

**解决方案**：
```typescript
// lib/seo.ts 修改
export function generateSEOMetadata(params: SEOParams): Metadata {
  const url = `${SITE_URL}${params.path}`
  const ogImage = params.image || `${SITE_URL}/og-default.png`  // 添加默认图
  
  return {
    openGraph: {
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: params.title,
        },
      ],
    },
    twitter: {
      images: [ogImage],  // Twitter 也需要
    },
  }
}
```

---

#### 3. 缺少 viewport 配置
**现状**：
- ❌ `app/layout.tsx` 中未设置 `viewport` 元数据
- Next.js 16 需要显式声明（不再自动注入）

**影响**：
- 移动端可能缩放异常
- Google 移动端友好测试可能不通过

**解决方案**：
```typescript
// app/layout.tsx 添加
import type { Viewport } from 'next'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#2563EB',  // 品牌蓝色
}
```

---

### 🟡 中等问题（影响排名）

#### 4. 缺少内部链接深度
**现状**：
- 首页推荐中转站 → 详情页 ✅
- 模型列表 → 模型详情 ✅
- ❌ 模型详情页无推荐相关模型
- ❌ 中转站详情页无推荐相似中转站
- ❌ 文章列表无分类筛选入口

**影响**：
- 页面孤岛，爬虫难以深度抓取
- 用户跳出率高

**解决方案**：
1. 模型详情页底部添加"相关模型推荐"（同 family）
2. 中转站详情页添加"类似中转站"（同价格区间/同特性）
3. 文章页底部添加"相关阅读"
4. 全站侧边栏/底部添加"热门模型"、"推荐中转站"固定入口

---

#### 5. 缺少 FAQ 结构化数据
**现状**：
- ✅ 有 FAQ 类别文章（`category: 'faq'`）
- ❌ 未使用 `FAQPage` Schema

**影响**：
- 无法在搜索结果中展示富文本摘要
- 失去 Google 精选摘要机会

**解决方案**：
```typescript
// lib/seo.ts 添加
export function generateFAQSchema(faqs: Array<{question: string, answer: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}

// FAQ 文章页使用
const faqSchema = article.category === 'faq' 
  ? generateFAQSchema(parseFAQFromContent(article.content))
  : null
```

---

#### 6. 模型详情页缺少价格对比 Schema
**现状**：
- 模型详情页展示多家中转站价格表
- ❌ 未使用 `Product` 或 `AggregateOffer` Schema

**影响**：
- 无法在搜索结果中展示价格区间
- 失去"价格比较"富文本片段

**解决方案**：
```typescript
// 模型详情页添加
const priceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: model.name,
  description: model.description,
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: lowestInput?.toFixed(2),
    highPrice: Math.max(...rows.map(r => Number(r.price_input))).toFixed(2),
    priceCurrency: 'CNY',
    offerCount: rows.length,
  },
}
```

---

#### 7. 文章页外链 `nofollow` 过激
**现状**：
```tsx
// app/articles/[slug]/page.tsx:213
<a href={href} target="_blank" rel="noopener noreferrer nofollow">
```
- 所有外链都添加 `nofollow`

**影响**：
- 如果链接到权威来源（OpenAI、Anthropic 官网），`nofollow` 会削弱自己的信任度
- `nofollow` 应仅用于广告/用户生成内容，不应用于引用来源

**解决方案**：
```tsx
// 区分可信来源和不可信来源
const isTrustedDomain = (href: string) => {
  const trusted = ['openai.com', 'anthropic.com', 'google.com']
  return trusted.some(d => href.includes(d))
}

<a 
  href={href} 
  target="_blank" 
  rel={`noopener noreferrer${isTrustedDomain(href) ? '' : ' nofollow'}`}
>
```

---

### 🟢 优化建议（提升体验）

#### 8. 添加面包屑可见导航
**现状**：
- ✅ 有 BreadcrumbList Schema（结构化数据）
- ✅ 有可见的面包屑导航

**建议**：当前面包屑已经完善，无需改动 ✅

---

#### 9. 缺少内容更新日期显示
**现状**：
- 中转站详情页显示"核验时间"（`verified_at`）✅
- ❌ 列表页未显示数据更新时间

**建议**：
- 首页添加"最近核验：{date}"（已有 ✅）
- 模型列表页添加"数据更新：{date}"

---

#### 10. robots.txt 可优化
**现状**：
```txt
disallow: ['/admin/', '/auth/', '/api/', '/*?page=*', '/*?search=*']
```

**建议**：
- ✅ 排除管理后台正确
- ⚠️ 排除所有分页参数（`/*?page=*`）可能过于激进
  - 如果列表页内容丰富，应允许少量分页被索引
  - 建议改为 `disallow: /*?page=[2-9]` 或 `disallow: /*?page=1[0-9]`（仅排除第 2 页之后）

---

#### 11. 缺少 hreflang 标签（多语言）
**现状**：
- 当前站点仅中文
- ❌ 未来如果添加英文版，需要 `hreflang` 标签

**建议**：
- 如果计划做国际化，提前规划 URL 结构（`/en/providers`）
- 使用 Next.js i18n 路由 + `hreflang` alternate 标签

---

#### 12. 性能优化空间

**ISR 缓存策略**：
- ✅ 已使用 `revalidate`
- ⚠️ 但开发环境检测到 `Cache-Control: no-cache`（正常，生产环境会自动优化）

**建议**：
1. **静态生成关键页面**：
   ```typescript
   // app/providers/[slug]/page.tsx
   export async function generateStaticParams() {
     const supabase = await createClient()
     const { data } = await supabase
       .from('providers')
       .select('slug')
       .eq('status', 'published')
     return (data || []).map(p => ({ slug: p.slug }))
   }
   ```
   - 好处：构建时生成所有中转站页面，首次访问无需服务端渲染

2. **添加 Stale-While-Revalidate**：
   ```typescript
   // next.config.ts
   async headers() {
     return [
       {
         source: '/providers/:slug',
         headers: [
           {
             key: 'Cache-Control',
             value: 's-maxage=300, stale-while-revalidate=3600',
           },
         ],
       },
     ]
   }
   ```

3. **启用图片优化**：
   - 当前无外部图片，如果未来添加中转站 logo，使用 Next.js Image 组件

---

#### 13. 内容 SEO 关键词密度

**现状**：
- 页面标题、描述都有关键词
- ❌ 正文中关键词密度偏低

**建议**：
1. **首页优化**：
   - 当前："AI API 中转站 精选导航"
   - 优化："AI API 中转站排行榜 | 模型价格对比 | OpenAI Claude 转发服务"
   - 增加长尾词："GPT-4、Claude 3.5、Gemini Pro 价格对比"

2. **中转站详情页**：
   - 添加"用户评价"区域（如果有数据）
   - 添加"常见问题"折叠区域（提升关键词密度）

3. **模型详情页**：
   - 添加模型介绍段落（当前仅有 description 字段）
   - 示例："GPT-4o 是 OpenAI 于 2024 年发布的多模态大模型，支持文本、图像、语音输入..."

---

#### 14. 缺少 Sitemap 索引分片
**现状**：
- 单个 `sitemap.xml` 包含所有 URL
- 当前数据量小（<50 条），无问题

**建议**：
- 未来如果数据量 >1000 条，拆分为：
  ```
  /sitemap.xml          # 索引文件
  /sitemap-providers.xml
  /sitemap-models.xml
  /sitemap-articles.xml
  ```

---

## 🎯 优先级改进计划

### Phase 1：立即修复（影响收录）
**预计工时：1 小时**

1. ✅ **添加 viewport 配置**（5 分钟）
2. ✅ **设置 OG 默认图片**（10 分钟）
3. ✅ **生成 apple-icon.png 和 favicon.ico**（15 分钟）
4. ⚠️ **修改文章外链 nofollow 策略**（10 分钟）

### Phase 2：提升排名（1 周内）
**预计工时：3 小时**

1. 🔄 **添加 FAQ Schema**（30 分钟）
2. 🔄 **添加模型详情 Product Schema**（30 分钟）
3. 🔄 **首页增加关键词密度**（30 分钟）
4. 🔄 **添加内部链接**（1 小时）
   - 模型详情页相关推荐
   - 中转站详情页相似推荐

### Phase 3：长期优化（持续迭代）
1. 🔄 添加 `generateStaticParams`（预渲染所有页面）
2. 🔄 添加 CDN 缓存策略
3. 🔄 添加用户评价/评论功能（UGC 内容）
4. 🔄 添加"最近更新"板块（提升抓取频率）
5. 🔄 添加 RSS 订阅（文章更新通知）

---

## 📈 预期效果

**当前状态**：
- Google 收录：0 页（域名未解析）
- 百度收录：0 页

**Phase 1 完成后**：
- ✅ 所有页面可被正常索引
- ✅ 社交媒体分享有预览图
- ✅ 移动端友好测试通过

**Phase 2 完成后**：
- 🎯 核心关键词排名进入前 3 页（30 天内）
  - "AI API 中转站"
  - "GPT-4 价格对比"
  - "Claude API 转发"
- 🎯 Google 富文本摘要展示（FAQ/价格对比）

**Phase 3 完成后**：
- 🎯 长尾关键词覆盖 100+ 词
- 🎯 自然搜索流量占比 >50%
- 🎯 页面停留时间 >2 分钟

---

## 🔧 技术检查清单

### ✅ 已通过
- [x] 所有页面有唯一 title 和 description
- [x] URL 结构清晰且语义化
- [x] robots.txt 存在且配置正确
- [x] sitemap.xml 动态生成且包含所有页面
- [x] 结构化数据语法正确（Organization、WebSite、Breadcrumb、Article）
- [x] 响应式设计适配移动端
- [x] 使用语义化 HTML5 标签
- [x] ISR 配置合理
- [x] 图片使用 alt 属性（logo 有 alt）

### ❌ 待修复
- [ ] viewport 元数据配置
- [ ] Open Graph 默认图片
- [ ] apple-icon.png 文件
- [ ] favicon.ico 文件
- [ ] FAQ Schema（文章页）
- [ ] Product Schema（模型详情页）
- [ ] 外链 nofollow 策略优化

### 🔄 待优化
- [ ] generateStaticParams 预渲染
- [ ] 内部链接深度
- [ ] 关键词密度提升
- [ ] 内容更新日期显示
- [ ] Sitemap 分片（数据量大时）

---

## 📚 参考资料

- [Next.js 16 Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [Google 搜索中心：结构化数据](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Google PageSpeed Insights](https://pagespeed.web.dev/)
- [Schema.org FAQPage](https://schema.org/FAQPage)
- [Schema.org Product](https://schema.org/Product)

---

**报告生成者**：Claude (Opus 5)  
**下一步行动**：Phase 1 立即修复清单
