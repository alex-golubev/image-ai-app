# 🚀 Тестирование API через Postman

## 📋 Быстрый старт

### 1. Запуск сервера

```bash
npm run dev
```

Сервер запустится на `http://localhost:3000`

### 2. Импорт коллекции в Postman

1. Откройте Postman
2. Нажмите **Import** в левом верхнем углу
3. Выберите файл `postman-collection.json` из корня проекта
4. Коллекция **"Image AI App - tRPC API"** появится в вашем workspace

## 📁 Структура коллекции

### 🔹 **Users** - Основные операции

- **Create User** - Создание пользователя
- **Get All Users** - Получение всех пользователей
- **Get User By ID** - Получение пользователя по ID
- **Authenticate User - Success** - Успешная аутентификация
- **Authenticate User - Wrong Password** - Неудачная аутентификация
- **Update User** - Обновление пользователя
- **Delete User** - Удаление пользователя

### 🔹 **Validation Tests** - Тесты валидации

- **Create User - Invalid Email** - Неправильный email
- **Create User - Weak Password** - Слабый пароль
- **Get User - Invalid UUID** - Неправильный UUID

### 🔹 **Rate Limiting Tests** - Тесты ограничений

- **Multiple Failed Auth Attempts** - Тест блокировки после 5 неудачных попыток

## 🎯 Рекомендуемый порядок тестирования

### Шаг 1: Создание пользователя

1. Запустите **"Create User"**
2. ✅ Пользователь создается, ID автоматически сохраняется в переменную `{{userId}}`

### Шаг 2: Получение данных

1. Запустите **"Get All Users"** - увидите всех пользователей
2. Запустите **"Get User By ID"** - получите конкретного пользователя

### Шаг 3: Аутентификация

1. Запустите **"Authenticate User - Success"** - успешный вход
2. Запустите **"Authenticate User - Wrong Password"** - ошибка аутентификации

### Шаг 4: Обновление и удаление

1. Запустите **"Update User"** - обновление данных
2. Запустите **"Delete User"** - удаление пользователя

## 🔧 Переменные коллекции

Коллекция использует переменные для удобства:

- `{{baseUrl}}` = `http://localhost:3000`
- `{{userId}}` = автоматически сохраняется после создания пользователя

## 📡 Формат запросов tRPC

**Важно!** Все tRPC мутации требуют обертывания данных в объект `json`:

### ✅ Правильно (для мутаций):

```json
{
  "json": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### ❌ Неправильно:

```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Для queries без параметров:

```json
{}
```

## 📊 Автоматические тесты

Каждый запрос содержит автоматические тесты:

### ✅ Проверки успешных операций:

- Статус код 200
- Наличие обязательных полей
- Корректность типов данных

### ❌ Проверки ошибок:

- Валидация входных данных
- Обработка неправильных UUID
- Rate limiting

## 🛡️ Тестирование безопасности

### Rate Limiting

1. Откройте **"Multiple Failed Auth Attempts"**
2. Запустите 6 раз подряд
3. Первые 5 попыток: `UNAUTHORIZED`
4. 6-я попытка: `TOO_MANY_REQUESTS`

### Валидация паролей

Пароль должен содержать:

- ✅ Минимум 8 символов
- ✅ Заглавную букву (A-Z)
- ✅ Строчную букву (a-z)
- ✅ Цифру (0-9)
- ✅ Специальный символ

## 📝 Примеры запросов

### Создание пользователя

```json
{
  "json": {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }
}
```

### Аутентификация

```json
{
  "json": {
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }
}
```

### Обновление пользователя

```json
{
  "json": {
    "id": "{{userId}}",
    "name": "Jane Doe Updated",
    "email": "jane.updated@example.com"
  }
}
```

## 🔍 Примеры ответов

### Успешное создание

```json
{
  "result": {
    "data": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "avatar": null
      }
    ]
  }
}
```

### Ошибка валидации

```json
{
  "error": {
    "message": "Validation error",
    "code": -32600,
    "data": {
      "code": "BAD_REQUEST",
      "httpStatus": 400,
      "path": "user.createUser"
    }
  }
}
```

### Rate Limiting

```json
{
  "error": {
    "message": "Too many failed login attempts. Please try again in 15 minutes.",
    "code": -32600,
    "data": {
      "code": "TOO_MANY_REQUESTS",
      "httpStatus": 429
    }
  }
}
```

## 🚨 Troubleshooting

### Сервер не отвечает

- Убедитесь, что `npm run dev` запущен
- Проверьте, что сервер доступен на `http://localhost:3000`

### Ошибки базы данных

- Убедитесь, что база данных настроена (файл `.env.local`)
- Проверьте подключение к Neon Database

### Переменная userId пустая

- Сначала запустите **"Create User"**
- ID автоматически сохранится для других запросов

## 🎉 Готово!

Теперь вы можете полноценно тестировать API через Postman с автоматическими проверками и удобными переменными!
