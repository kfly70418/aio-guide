/**
 * 使用 Claude 翻译文章详情内容（不生成配图）
 * 配图后续可以手动上传或使用其他服务
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Article {
  id: string
  slug: string
  title: string
  content: string
}

// 手动翻译的文章内容（由 Claude 完成）
const translations: Record<string, string> = {
  'api-call-failed-troubleshooting': `API не работает? Не спешите писать в поддержку — пройдите эти 5 шагов, большинство проблем решается быстро.

## Шаг 1: Проверьте сетевое подключение

### Проверка связи

**Метод 1: ping домена провайдера**

\`\`\`bash
ping api.example.com
\`\`\`

**Норма**: показывает задержку, например \`time=20ms\`
**Проблема**: "Превышен интервал ожидания" или "Узел недоступен"

**Метод 2: через браузер**

Откройте сайт провайдера в браузере и проверьте доступность.

---

### Типичные сетевые проблемы

**Проблема 1: Ошибка разрешения DNS**

Сообщение об ошибке: \`getaddrinfo ENOTFOUND\` или \`Name or service not known\`

**Причины**:
- Опечатка в домене
- Проблемы с DNS-сервером
- Сетевая блокировка

**Решение**:
1. Проверьте правильность написания домена
2. Попробуйте другую сеть (мобильный интернет)
3. Смените DNS-сервер (8.8.8.8 или 114.114.114.114)

---

**Проблема 2: Тайм-аут подключения**

Сообщение об ошибке: \`Connection timeout\` или \`ETIMEDOUT\`

**Причины**:
- Служба провайдера недоступна
- Проблемы с сетью
- Блокировка файрволом

**Решение**:
1. Проверьте статус на странице провайдера
2. Попробуйте другую сеть
3. Проверьте настройки файрвола/антивируса

---

## Шаг 2: Проверьте конфигурацию API

### Проверка базовых параметров

Проверьте эти три ключевых параметра:

| Параметр | Описание | Пример | Типичные ошибки |
|---------|---------|-------|-------------|
| **Base URL** | Адрес API | \`https://api.example.com/v1\` | Отсутствует \`/v1\`, лишний слеш |
| **API Key** | Ключ авторизации | \`sk-abc123...\` | Пробелы, неполный ключ |
| **Model** | Название модели | \`gpt-4\` | Неподдерживаемая модель |

---

### Как проверить правильность конфигурации

**Метод 1: curl тест**

\`\`\`bash
curl https://api.example.com/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hi"}]
  }'
\`\`\`

**Успешный ответ**: JSON с полем \`choices\`
**Ошибка**: сообщение об ошибке с кодом

**Метод 2: Проверка через веб-консоль провайдера**

Большинство провайдеров предоставляют тестовую консоль.

---

## Шаг 3: Проверьте баланс и квоты

### Проверка остатка

**Способы проверки**:
1. Панель управления провайдера
2. API запрос (если поддерживается)
3. Email-уведомления о балансе

### Типичные проблемы с балансом

**Проблема 1: Недостаточно средств**

Сообщение об ошибке: \`Insufficient credits\` или \`402 Payment Required\`

**Решение**: Пополните баланс

**Проблема 2: Превышен лимит**

Сообщение об ошибке: \`Rate limit exceeded\` или \`429 Too Many Requests\`

**Решение**:
- Подождите до сброса лимита
- Обновите тарифный план
- Оптимизируйте частоту запросов

---

## Шаг 4: Проверьте код

### Распространенные ошибки в коде

**Ошибка 1: Неправильные заголовки**

❌ **Неправильно**:
\`\`\`python
headers = {
    "Authorization": "YOUR_API_KEY"  # Отсутствует "Bearer"
}
\`\`\`

✅ **Правильно**:
\`\`\`python
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}
\`\`\`

**Ошибка 2: Неверная структура запроса**

❌ **Неправильно**:
\`\`\`json
{
  "prompt": "Hello"  // Старый формат
}
\`\`\`

✅ **Правильно**:
\`\`\`json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "user", "content": "Hello"}
  ]
}
\`\`\`

---

## Шаг 5: Проверьте логи ошибок

### Интерпретация распространенных кодов ошибок

| Код | Значение | Причина | Решение |
|-----|---------|--------|---------|
| **401** | Unauthorized | Неверный API Key | Проверьте ключ |
| **403** | Forbidden | Нет прав | Проверьте права ключа |
| **404** | Not Found | Неверный URL | Проверьте Base URL |
| **429** | Too Many Requests | Лимит запросов | Снизьте частоту |
| **500** | Server Error | Ошибка сервера | Подождите или свяжитесь с поддержкой |
| **503** | Service Unavailable | Техобслуживание | Подождите |

---

## Чек-лист быстрой диагностики

Распечатайте и держите под рукой:

- [ ] **Сеть**: ping работает?
- [ ] **URL**: Base URL правильный?
- [ ] **Key**: API Key скопирован полностью?
- [ ] **Модель**: Модель поддерживается?
- [ ] **Баланс**: Достаточно средств?
- [ ] **Лимит**: Не превышена квота?
- [ ] **Код**: Заголовки корректны?
- [ ] **Логи**: Что показывает ошибка?

---

## Когда обращаться в поддержку

Свяжитесь с поддержкой, если:

1. ✅ Прошли все 5 шагов
2. ✅ Проблема повторяется
3. ✅ Есть логи ошибок

**Что указать в обращении**:
- Код ошибки
- Время возникновения
- Используемая модель
- Логи запросов (без API Key!)

---

## Резюме

🎯 **Большинство проблем решается за 5 минут**:
1. Проверьте сеть
2. Проверьте конфигурацию
3. Проверьте баланс
4. Проверьте код
5. Изучите логи

💡 **Совет**: добавьте эту страницу в закладки — пригодится при следующей проблеме.`,

  // 其他14篇文章的翻译会在下一个chunk继续...
}

async function saveTranslation(articleId: string, content: string) {
  const { error } = await supabase
    .from('translations')
    .upsert({
      resource_type: 'article',
      resource_id: articleId,
      locale: 'ru',
      field: 'content',
      value: content,
    }, {
      onConflict: 'resource_type,resource_id,locale,field',
    })

  return !error
}

async function main() {
  console.log('📝 导入文章详情翻译\n')

  const { data: articles } = await supabase
    .from('articles')
    .select('id, slug, title')
    .eq('status', 'published')
    .eq('category', 'tutorial')

  if (!articles) {
    console.error('❌ 获取文章失败')
    return
  }

  let successCount = 0

  for (const article of articles) {
    if (translations[article.slug]) {
      const success = await saveTranslation(article.id, translations[article.slug])
      if (success) {
        console.log(`✅ ${article.title}`)
        successCount++
      } else {
        console.log(`❌ ${article.title}`)
      }
    } else {
      console.log(`⏭️  ${article.title} (翻译未准备)`)
    }
  }

  console.log(`\n📊 完成: ${successCount}/${articles.length}`)
}

if (require.main === module) {
  main().catch(console.error)
}
