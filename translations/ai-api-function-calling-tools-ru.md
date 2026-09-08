# Function Calling в AI API: Schema, цикл выполнения и проверка безопасности (2026)

**Короткий ответ:** Function Calling не даёт модели права выполнять код. Модель лишь возвращает название инструмента и JSON-параметры, а реальное действие выполняет ваш сервер. Надёжная схема выглядит так: небольшой Schema → проверка аргументов → проверка прав и безопасное выполнение → возврат результата модели для финального ответа.

## 1. Как проходит вызов инструмента

1. Клиент отправляет вопрос и список доступных инструментов.
2. Модель решает, нужен ли инструмент, и возвращает его имя с аргументами.
3. Сервер проверяет имя, типы, права пользователя и диапазон операции.
4. Сервер выполняет действие: например, получает погоду или ищет заказ.
5. Результат передаётся обратно в сообщении `tool`, после чего модель формирует ответ пользователю.

Модель предлагает вызов, но не получает автоматически доступ к базе, файлам или платежам. Любое разрешение должно оставаться на серверной стороне.

## 2. Делайте Schema небольшой и строгой

```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Получить текущую погоду в городе. Использовать только при явном вопросе о погоде.",
    "parameters": {
      "type": "object",
      "properties": {
        "city": { "type": "string", "description": "Название города, например Shanghai" },
        "unit": { "type": "string", "enum": ["celsius", "fahrenheit"] }
      },
      "required": ["city"],
      "additionalProperties": false
    }
  }
}
```

Практические правила:

- Используйте устойчивые имена инструментов на английском.
- Обязательные поля указывайте в `required`, допустимые варианты — в `enum`.
- Передавайте модели только инструменты, нужные текущему диалогу.
- Не помещайте в описание Schema API Key, внутренние имена таблиц или административные endpoint.

## 3. Пример на Python для OpenAI-совместимого API

```python
import json
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ["AI_API_KEY"],
    base_url=os.environ["AI_BASE_URL"],
)

tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Получить текущую погоду в городе",
        "parameters": {
            "type": "object",
            "properties": {"city": {"type": "string"}},
            "required": ["city"],
            "additionalProperties": False,
        },
    },
}]

messages = [
    {"role": "system", "content": "Для актуальной погоды вызывай инструмент, не угадывай."},
    {"role": "user", "content": "Какая сейчас погода в Шанхае?"},
]

first = client.chat.completions.create(
    model=os.environ["AI_MODEL"], messages=messages,
    tools=tools, tool_choice="auto", temperature=0,
)
assistant = first.choices[0].message
messages.append(assistant.model_dump(exclude_none=True))

for call in assistant.tool_calls or []:
    if call.function.name != "get_weather":
        raise ValueError("Неизвестный инструмент")
    arguments = json.loads(call.function.arguments)
    city = arguments.get("city")
    if not isinstance(city, str) or not city.strip() or len(city) > 50:
        raise ValueError("Некорректный параметр city")

    # Здесь должен быть ваш проверенный погодный сервис.
    weather = {"city": city, "temperature": 24, "condition": "cloudy"}
    messages.append({
        "role": "tool",
        "tool_call_id": call.id,
        "content": json.dumps(weather, ensure_ascii=False),
    })

final = client.chat.completions.create(
    model=os.environ["AI_MODEL"], messages=messages, temperature=0,
)
print(final.choices[0].message.content)
```

Значения погоды здесь демонстрационные. В рабочем проекте используйте проверенный источник. `tool_call_id` должен полностью совпадать с идентификатором вызова модели.

## 4. Node.js и ограниченный цикл нескольких инструментов

```js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_BASE_URL,
});

const tools = [{
  type: "function",
  function: {
    name: "get_weather",
    description: "Получить текущую погоду в городе",
    parameters: {
      type: "object",
      properties: { city: { type: "string" } },
      required: ["city"],
      additionalProperties: false,
    },
  },
}];

const messages = [
  { role: "system", content: "Для актуальной погоды вызывай инструмент, не угадывай." },
  { role: "user", content: "Какая сейчас погода в Шанхае?" },
];

for (let round = 0; round < 3; round += 1) {
  const response = await client.chat.completions.create({
    model: process.env.AI_MODEL, messages, tools,
    tool_choice: "auto", temperature: 0,
  });
  const message = response.choices?.[0]?.message;
  if (!message) throw new Error("Модель не вернула сообщение");
  messages.push(message);
  if (!message.tool_calls?.length) {
    console.log(message.content ?? "");
    break;
  }

  for (const call of message.tool_calls) {
    if (call.function.name !== "get_weather") throw new Error("Неизвестный инструмент");
    const args = JSON.parse(call.function.arguments);
    if (typeof args.city !== "string" || args.city.length > 50) {
      throw new Error("Некорректный параметр city");
    }
    const result = { city: args.city, temperature: 24, condition: "cloudy" };
    messages.push({
      role: "tool", tool_call_id: call.id, content: JSON.stringify(result),
    });
  }
}
```

Всегда задавайте максимальное число раундов. Неограниченный Agent способен бесконечно вызывать инструменты, увеличивая расходы или повторяя запись. Операции с побочными эффектами выполняйте последовательно и запрашивайте подтверждение пользователя.

## 5. Четыре уровня защиты

### Проверка аргументов

Сначала разберите JSON, затем проверьте типы, длину, перечисления и диапазоны. Даже при `additionalProperties: false` повторяйте проверку на сервере: некоторые совместимые endpoint не применяют Schema строго.

### Проверка прав

Функция инструмента должна получать личность текущего пользователя из серверной сессии и заново проверять права. Нельзя доверять переданным моделью `user_id`, роли или номеру счёта.

### Ограничение операции

Ограничьте поиск, пагинацию и временной диапазон, задайте тайм-аут и бюджет на запрос. Чтение и запись лучше разделить. Удаление, возврат средств и отправка сообщений по умолчанию требуют подтверждения.

### Логи и маскирование

Записывайте имя инструмента, длительность, результат и request ID, но не API Key, полный ввод пользователя и чувствительные аргументы. Внутренний stack trace не должен попадать в ответ модели.

## 6. Частые ошибки

- **`tools is not supported`**: модель или маршрут не поддерживает инструменты. Выберите совместимую модель либо вернитесь к обычному JSON.
- **Несовпадение `tool_call_id`**: результат использует не исходный ID или сообщения отправлены в неверном порядке.
- **Ошибка разбора аргументов**: упростите Schema, сохраните обезличенный фрагмент ответа и добавьте один повтор или ручной сценарий.
- **Модель не вызывает инструмент**: проверьте `description`, значение `tool_choice` и действительно ли вопрос требует актуальных данных.
- **Слишком много раундов**: задайте лимит, тайм-аут и бюджет, а инструменту возвращайте ясный результат завершения.

Ошибки 429, тайм-ауты и сбои SSE диагностируются отдельно: используйте [руководство по ошибкам API](/ru/articles/api-call-failed-troubleshooting), [обработку лимитов](/ru/articles/fix-api-429-error) и [отладку SSE](/ru/articles/debug-ai-api-streaming-sse).

## 7. Чек-лист перед запуском

- [ ] Проверена поддержка `tools` у модели и провайдера
- [ ] У каждого инструмента есть обязательные поля, перечисления и лимиты длины
- [ ] Сервер заново проверяет права текущего пользователя
- [ ] Для цикла заданы число раундов, тайм-аут и лимит расходов
- [ ] Удаление, возврат средств и другие опасные действия требуют подтверждения
- [ ] Протестированы `tool_call_id`, порядок сообщений и ветки ошибок
- [ ] Логи обезличены, внутренние ошибки не раскрываются
- [ ] Подготовлен запасной режим без инструментов

**Итог:** Function Calling — это контролируемый протокол, а не разрешение модели запускать код. Модель предлагает вызов, сервер проверяет и выполняет его, затем результат возвращается модели. Такой подход сохраняет стабильность при смене модели или OpenAI-совместимого маршрута.

Полезные материалы:

- [Как добиться стабильного JSON-ответа от AI API](/ru/articles/stable-json-output-ai-api)
- [Вызов OpenAI-совместимого API через curl, Python и Node.js](/ru/articles/openai-compatible-api-curl-python-nodejs)
- [Что делать при тайм-ауте AI API](/ru/articles/fix-api-timeout)

**Дата обновления:** 8 сентября 2026 года
