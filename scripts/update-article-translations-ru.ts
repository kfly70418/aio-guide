/**
 * 手动更新教程文章的俄语翻译
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 手动翻译映射表 - 教程类文章
const articleTranslations: Record<string, { title: string; summary: string }> = {
  'api-key-leaked-emergency-response': {
    title: 'Что делать после утечки API Key? Экстренный контроль ущерба в 5 шагов (тест 2026)',
    summary: 'Первые шаги после обнаружения утечки API Key: 1 минута — отозвать ключ, проверить журнал вызовов, связаться с платформой. Настоящие кейсы в помощь: предотвращение потерь, блокировка несанкционированных вызовов, предотвращение утечки конфиденциальной информации.',
  },
  'api-call-failed-troubleshooting': {
    title: 'Что делать при сбое вызова API? 5 шагов быстрой диагностики проблемы (2026)',
    summary: 'API вызов не работает? Последовательно проверьте: 90% проблем уже решено — Base URL, ключ, конфигурация клиента, сетевое подключение, лимиты квот.',
  },
  'choose-ai-model-by-task-type': {
    title: 'Как выбрать AI модель? Выбор по типу задачи экономит деньги (сравнение 2026)',
    summary: 'Не стоит слепо выбирать одну модель для всех задач. Напишите код — используйте Claude, переведите — Gemini, обычные задачи — GPT-4o-mini. Выбор правильной модели может сэкономить один-два уровня стоимости.',
  },
  'how-much-to-recharge-first-time': {
    title: 'Сколько пополнить в первый раз? Руководство по планированию квоты API (2026)',
    summary: 'Первое пополнение API - сколько подходит? Исходя из частоты использования и бюджета, рекомендуется поэтапное пополнение, избегая больших сумм или менее чем минимальное пополнение.',
  },
  'how-to-test-api-connection': {
    title: 'Как проверить работоспособность API? 3 метода валидации конфигурации (тест 2026)',
    summary: 'Настройте API и не знаете, работает ли она? Используйте онлайн-инструменты, пользовательские клиенты, портальные панели для проверки — трёхстороннее тестирование подтверждает правильность Base URL, API Key и прав настройки.',
  },
  'official-api-vs-relay-service': {
    title: 'Официальный API vs Ретрансляционный API: различия, сравнение цен и методы выбора (тест 2026)',
    summary: 'Три Быка (36niu.com) — это сервис-посредник AI API с поддержкой Claude и GPT, с ценами от низких до премиум-класса, пополнение от ¥7, поддержка WeChat. Занимает 9-е место в независимом рейтинге, отличная стабильность.',
  },
  'beginner-api-troubleshooting': {
    title: 'Руководство по устранению сбоев подключения API: 6 шагов определения проблемы + решение распространённых ошибок (тест 2026)',
    summary: 'Проходит проверку моделей, отличная стабильность, есть бюджетные тарифы, полное руководство по ценам, поддержка выставления счетов.',
  },
  'ai-api-beginner-basics': {
    title: 'Что такое AI API? Руководство для начинающих с нуля (иллюстрированная версия 2026)',
    summary: 'Руководство по началу работы с AI API для новичков, понятное объяснение концепций, часто используемые термины (Base URL, Model ID, Token), примеры конфигурации + распространённые ошибки.',
  },
  'base-url-model-id-token-explained': {
    title: 'Что такое Base URL/Model ID/Token? Примеры конфигурации + распространённые ошибки (обязательно к прочтению для новичков 2026)',
    summary: 'Новичкам в API обязательно к прочтению: что такое Base URL/Model ID/Token, примеры конфигурации, подробное объяснение распространённых ошибок.',
  },
  'first-api-account-checklist': {
    title: 'Полное руководство по первой регистрации API: контрольный список из 4 этапов + руководство по избежанию ошибок (2026)',
    summary: 'Первая регистрация API - полный контрольный список: тестирование перед пополнением, мастер-класс по мелким пополнениям для проверки, создание Key с ограничениями прав, 4 этапа проверки из 32 пунктов. Содержит примеры реальных ошибок, методы проверки онлайн и офлайн. Новичкам 2026-08...',
  },
}

async function updateArticleTranslations() {
  console.log('📝 开始更新教程文章俄语翻译\n')
  console.log('─'.repeat(60))

  let successCount = 0
  let failCount = 0

  for (const [slug, translation] of Object.entries(articleTranslations)) {
    console.log(`翻译: ${slug}`)

    try {
      // 获取文章ID
      const { data: article } = await supabase
        .from('articles')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!article) {
        console.log(`  ⚠️  文章不存在，跳过`)
        continue
      }

      // 保存翻译
      const translations = [
        {
          resource_type: 'article',
          resource_id: article.id,
          locale: 'ru',
          field: 'title',
          value: translation.title,
        },
        {
          resource_type: 'article',
          resource_id: article.id,
          locale: 'ru',
          field: 'summary',
          value: translation.summary,
        },
      ]

      const { error: insertError } = await supabase
        .from('translations')
        .upsert(translations, {
          onConflict: 'resource_type,resource_id,locale,field',
        })

      if (insertError) {
        console.error('  ❌ 保存失败:', insertError.message)
        failCount++
      } else {
        console.log(`  ✅ 标题: ${translation.title.substring(0, 50)}...`)
        console.log(`  ✅ 摘要: ${translation.summary.substring(0, 50)}...`)
        successCount++
      }
    } catch (error: any) {
      console.error(`  ❌ 更新失败:`, error.message)
      failCount++
    }
  }

  console.log('\n' + '─'.repeat(60))
  console.log(`✅ 更新完成`)
  console.log(`📊 成功: ${successCount}，失败: ${failCount}`)
}

if (require.main === module) {
  updateArticleTranslations().catch(console.error)
}
