# MAX Chat Channel Plugin for OpenClaw

Плагин для подключения мессенджера MAX к OpenClaw.

## Требования

- Node.js 22+
- Токен бота MAX (получить на business.max.ru)

## Установка

1. Скопировать всё содержимое `dist/` в `/home/user/.openclaw/extensions/max/`
2. Добавить конфигурацию в `openclaw.json` (см. ниже)
3. Перезапустить OpenClaw: `openclaw gateway restart`

## Конфигурация

Добавить в `openclaw.json`:

```json
{
  "channels": {
    "max": {
      "token": "YOUR_MAX_BOT_TOKEN",
      "allowFrom": ["USER_ID_1", "USER_ID_2"],
      "dmPolicy": "allowlist"
    }
  }
}
```

## Структура dist/

```
dist/
├── index.js          # Точка входа плагина
├── setup-entry.js    # Онбординг
└── src/
    ├── channel.js    # Логика канала
    └── client.js     # MAX Bot API клиент
```

## Следующие шаги

1. Получить токен бота на business.max.ru
2. Добавить user_id нужных пользователей в `allowFrom`
3. Перезапустить gateway

## Функции

- ✅ Отправка/приём сообщений
- ✅ Webhook для обновлений
- ✅ allowFrom фильтрация по user_id

## Webhook vs Polling

**Webhook (рекомендуется):** работает в реальном времени, требует внешний URL.

**Polling:** если webhook невозможен. Ограничения с 11.05.2026:
- Максимум 2 RPS
- Таймаут 30 секунд
- Батч до 100 событий
- TTL событий 24 часа