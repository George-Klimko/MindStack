# Context7 MCP Setup для MindStack

## API-ключ
```
ctx7sk-00296044-62eb-4df2-94fe-4081d657422a
```

## Ручные запросы через curl

### Поиск библиотеки
```bash
curl -X GET "https://context7.com/api/v2/libs/search?libraryName=next.js&query=middleware+jwt" \
  -H "Authorization: Bearer ctx7sk-00296044-62eb-4df2-94fe-4081d657422a"
```

### Получение документации
```bash
curl -X GET "https://context7.com/api/v2/docs/query?libraryId=/vercel/next.js&query=middleware+authentication" \
  -H "Authorization: Bearer ctx7sk-00296044-62eb-4df2-94fe-4081d657422a"
```

## Настройка для Qwen Code Companion

Файл: `.vscode/settings.json`
```json
{
  "mcp": {
    "servers": {
      "context7": {
        "type": "http",
        "url": "https://mcp.context7.com/mcp",
        "headers": {
          "Authorization": "Bearer ctx7sk-00296044-62eb-4df2-94fe-4081d657422a"
        }
      }
    }
  }
}
```

## Доступные версии Next.js
- v16.1.6 (latest)
- v16.1.5
- v16.1.0
- v15.1.11
- v14.3.0-canary.87
- v13.5.11
