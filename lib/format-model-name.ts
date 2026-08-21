/**
 * 格式化模型名称为用户友好的显示格式
 */

/**
 * 将模型ID转换为用户友好的显示名称
 * 例如：
 * - claude-sonnet-4-20250514 → Claude Sonnet 4
 * - claude-opus-5 → Claude Opus 5
 * - gpt-4-turbo → GPT-4 Turbo
 * - gemini-3.5-flash → Gemini 3.5 Flash
 */
export function formatModelName(modelId: string): string {
  // 移除日期后缀（如 -20250514）
  let name = modelId.replace(/-\d{8}$/, '')

  // 处理 Claude 系列
  if (name.startsWith('claude-')) {
    name = name.replace(/^claude-/, '')

    // claude-sonnet-4 → Sonnet 4
    // claude-opus-5 → Opus 5
    // claude-haiku-4-5 → Haiku 4.5
    const parts = name.split('-')
    const model = parts[0] // sonnet, opus, haiku, fable
    const version = parts.slice(1).join('.') // 4, 5, 4.5

    return `Claude ${capitalize(model)} ${version}`
  }

  // 处理 GPT 系列
  if (name.startsWith('gpt-')) {
    // gpt-4-turbo → GPT-4 Turbo
    // gpt-4o → GPT-4o
    // gpt-3.5-turbo → GPT-3.5 Turbo
    name = name.replace(/^gpt-/, 'GPT-')
    name = name.replace(/-/g, ' ')
    return name.split(' ').map((word, i) => {
      if (i === 0) return word // GPT-4, GPT-3.5
      return capitalize(word)
    }).join(' ')
  }

  // 处理 Gemini 系列
  if (name.startsWith('gemini-')) {
    // gemini-3.5-flash → Gemini 3.5 Flash
    // gemini-3.1-pro → Gemini 3.1 Pro
    name = name.replace(/^gemini-/, 'Gemini ')
    name = name.replace(/-/g, ' ')
    return name.split(' ').map((word, i) => {
      if (i === 0 || i === 1) return word // Gemini 3.5
      return capitalize(word)
    }).join(' ')
  }

  // 处理 Grok 系列
  if (name.startsWith('grok-')) {
    // grok-4.5 → Grok 4.5
    return name.replace(/^grok-/, 'Grok ')
  }

  // 其他模型：首字母大写，将 - 替换为空格
  return name.split('-').map(capitalize).join(' ')
}

/**
 * 首字母大写
 */
function capitalize(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * 获取模型的短名称（用于按钮等小空间）
 * 例如：
 * - Claude Sonnet 4 → Sonnet 4
 * - GPT-4 Turbo → GPT-4o
 */
export function getShortModelName(modelId: string): string {
  const fullName = formatModelName(modelId)

  // Claude Sonnet 4 → Sonnet 4
  if (fullName.startsWith('Claude ')) {
    return fullName.replace('Claude ', '')
  }

  // GPT-4 Turbo → GPT-4 Turbo (保持原样)
  // Gemini 3.5 Flash → Gemini 3.5 Flash (保持原样)

  return fullName
}
