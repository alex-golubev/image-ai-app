# Локальная разработка с Supabase

Этот проект настроен для работы с локальным Supabase в Docker контейнерах. Это позволяет разрабатывать приложение без подключения к интернету и без затрат на облачные ресурсы.

## 🐳 Предварительные требования

1. **Docker Desktop** - обязательно должен быть установлен и запущен

   - Скачать: https://docs.docker.com/desktop/
   - После установки запустите Docker Desktop

2. **Node.js** (уже установлен)
3. **Supabase CLI** (уже установлен как dev зависимость)

## 🚀 Быстрый старт

### 1. Запустите Docker Desktop

Убедитесь, что Docker Desktop запущен на вашем компьютере.

### 2. Запустите локальный Supabase

```bash
npx supabase start
```

При первом запуске Docker загрузит все необходимые образы (это может занять несколько минут).

### 3. Получите локальные учетные данные

После успешного запуска вы увидите что-то вроде:

```
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
     GraphQL URL: http://127.0.0.1:54321/graphql/v1
  S3 Storage URL: http://127.0.0.1:54321/storage/v1/s3
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
   Inbucket URL: http://127.0.0.1:54324
      JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
       anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   S3 Access Key: 625729a08b95bf1b7ff351a663f3a23c
   S3 Secret Key: 850181e4652dd023b7a98c58ae0d2d34bd4
      S3 Region: local
```

### 4. Создайте файл .env.local для локальной разработки

```bash
# Локальная разработка с Supabase
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ваш-anon-key-из-вывода-выше]"

# Для Drizzle ORM (используем локальную БД)
POSTGRES_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

# Опционально: для серверных операций
SUPABASE_SERVICE_ROLE_KEY="[ваш-service-role-key-из-вывода-выше]"
```

### 5. Примените схему базы данных

```bash
# Сбросить БД и применить миграции с seed данными
npm run supabase:reset

# Или создать новую миграцию
npm run supabase:migration your_migration_name
```

### 6. Запустите ваше приложение

```bash
npm run dev
```

## 🔧 Доступные сервисы

После запуска `npx supabase start` у вас будут доступны:

- **Supabase Studio**: http://127.0.0.1:54323 - веб-интерфейс для управления БД
- **API**: http://127.0.0.1:54321 - REST API
- **Database**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Inbucket**: http://127.0.0.1:54324 - для тестирования email

## 📊 Управление базой данных

### Применение миграций

```bash
# Применить изменения схемы к локальной БД
npm run drizzle:push

# Сгенерировать миграции
npm run drizzle:generate
```

### Сброс базы данных

```bash
# Сбросить БД к начальному состоянию
npx supabase db reset
```

### Создание seed данных

Создайте файл `supabase/seed.sql` для начальных данных:

```sql
-- Пример seed данных
INSERT INTO users (name, email, password) VALUES
('Test User', 'test@example.com', '$2b$10$...');
```

## 🔄 Синхронизация с продакшеном

### Получение схемы из продакшена

```bash
# Подключиться к удаленному проекту
npx supabase link --project-ref [your-project-ref]

# Получить схему из продакшена
npx supabase db pull
```

### Применение локальных изменений к продакшену

```bash
# Сгенерировать миграции
npm run drizzle:generate

# Применить к продакшену (осторожно!)
npm run drizzle:push
```

## 🛠️ Полезные команды

```bash
# Запустить Supabase
npx supabase start

# Остановить Supabase
npx supabase stop

# Посмотреть статус сервисов
npx supabase status

# Посмотреть логи
npx supabase logs

# Открыть Supabase Studio
npx supabase studio

# Сгенерировать TypeScript типы
npx supabase gen types typescript --local > src/types/supabase.ts
```

## 🧪 Тестирование

Для тестов используйте локальную БД:

```bash
# Запустить тесты с локальной БД
POSTGRES_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" npm test
```

## 🔍 Отладка

### Проблемы с Docker

```bash
# Проверить, запущен ли Docker
docker ps

# Перезапустить Docker Desktop
# Затем повторить: npx supabase start
```

### Проблемы с портами

Если порты заняты, измените их в `supabase/config.toml`:

```toml
[api]
port = 54321  # Измените на свободный порт

[db]
port = 54322  # Измените на свободный порт

[studio]
port = 54323  # Измените на свободный порт
```

### Очистка данных

```bash
# Полная очистка (удалит все данные!)
npx supabase stop
docker system prune -a
npx supabase start
```

## 📝 Переменные окружения

### Для локальной разработки (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[local-anon-key]"
POSTGRES_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

### Для продакшена (.env.production)

```bash
NEXT_PUBLIC_SUPABASE_URL="https://[your-project-ref].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[production-anon-key]"
POSTGRES_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

## 🎯 Преимущества локальной разработки

1. **Быстрая разработка** - нет задержек сети
2. **Работа офлайн** - не нужен интернет
3. **Бесплатно** - не тратите квоту облачного проекта
4. **Безопасность** - данные остаются локально
5. **Легкое тестирование** - можно экспериментировать без страха

## 🔗 Полезные ссылки

- [Документация Supabase CLI](https://supabase.com/docs/guides/local-development)
- [Конфигурация Supabase](https://supabase.com/docs/guides/local-development/cli/config)
- [Docker Desktop](https://docs.docker.com/desktop/)
- [Drizzle ORM](https://orm.drizzle.team/)

---

**Примечание**: Всегда запускайте Docker Desktop перед использованием `npx supabase start`!
