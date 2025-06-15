# Миграция с Neon Database на Supabase

Этот документ описывает процесс миграции проекта с Neon Database на Supabase.

## 🔄 Что изменилось

### Зависимости

- **Удалено**: `@neondatabase/serverless`
- **Добавлено**: `@supabase/supabase-js`, `postgres`, `@types/pg`

### Файлы конфигурации

- `src/db/index.ts` - обновлен для работы с Supabase
- `src/db/config.ts` - добавлены дополнительные опции
- Тесты обновлены для новой архитектуры

### Переменные окружения

Теперь требуются дополнительные переменные для Supabase:

```bash
# Database (обязательно)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Supabase (обязательно)
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"

# Опционально: для серверных операций
SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
```

## 🚀 Инструкции по миграции

### 1. Создание проекта в Supabase

1. Перейдите на [supabase.com](https://supabase.com)
2. Создайте новый проект
3. Дождитесь завершения настройки (обычно 2-3 минуты)

### 2. Получение учетных данных

В панели управления Supabase:

1. **Settings** → **Database**

   - Скопируйте **Connection string** для `DATABASE_URL`
   - Замените `[YOUR-PASSWORD]` на пароль базы данных

2. **Settings** → **API**
   - Скопируйте **Project URL** для `NEXT_PUBLIC_SUPABASE_URL`
   - Скопируйте **anon public** ключ для `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - (Опционально) Скопируйте **service_role** ключ для `SUPABASE_SERVICE_ROLE_KEY`

### 3. Обновление переменных окружения

Создайте или обновите файл `.env.local`:

```bash
# Database
DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.YOUR_PROJECT_REF.supabase.co:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_ACTUAL_ANON_KEY"

# Optional
SUPABASE_SERVICE_ROLE_KEY="YOUR_ACTUAL_SERVICE_ROLE_KEY"
```

### 4. Миграция данных (если необходимо)

Если у вас есть существующие данные в Neon:

1. **Экспорт из Neon**:

   ```bash
   pg_dump "YOUR_NEON_DATABASE_URL" > backup.sql
   ```

2. **Импорт в Supabase**:
   ```bash
   psql "YOUR_SUPABASE_DATABASE_URL" < backup.sql
   ```

### 5. Применение схемы базы данных

```bash
# Установка зависимостей
npm install

# Применение миграций
npm run drizzle:push
```

### 6. Настройка Vercel (для деплоя)

В настройках проекта Vercel добавьте переменные окружения:

- `DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (если используется)

## 🔧 Дополнительные возможности Supabase

После миграции вы получите доступ к:

### Аутентификация

```typescript
import { supabase } from '~/db';

// Регистрация
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
});

// Вход
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});
```

### Real-time подписки

```typescript
import { supabase } from '~/db';

// Подписка на изменения в таблице
const subscription = supabase
  .channel('users')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (payload) =>
    console.log('Change received!', payload),
  )
  .subscribe();
```

### Storage (файлы)

```typescript
import { supabase } from '~/db';

// Загрузка файла
const { data, error } = await supabase.storage.from('avatars').upload('user-avatar.png', file);
```

## 🧪 Тестирование

Все тесты обновлены для работы с новой архитектурой:

```bash
# Запуск тестов
npm test

# Тесты с покрытием
npm run test:coverage

# E2E тесты
npm run test:playwright
```

## 🔍 Устранение неполадок

### Ошибка подключения к базе данных

- Проверьте правильность `DATABASE_URL`
- Убедитесь, что пароль не содержит специальных символов (или экранируйте их)

### Ошибки Supabase клиента

- Проверьте `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Убедитесь, что переменные начинаются с `NEXT_PUBLIC_`

### Проблемы с миграциями

```bash
# Сброс и повторное применение
npm run drizzle:generate
npm run drizzle:push
```

## 📚 Полезные ссылки

- [Документация Supabase](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Drizzle ORM с PostgreSQL](https://orm.drizzle.team/docs/get-started-postgresql)
- [Миграция с других провайдеров](https://supabase.com/docs/guides/migrations)

## ✅ Чеклист миграции

- [ ] Создан проект в Supabase
- [ ] Получены все необходимые ключи
- [ ] Обновлен файл `.env.local`
- [ ] Установлены новые зависимости (`npm install`)
- [ ] Применены миграции базы данных (`npm run drizzle:push`)
- [ ] Проведено тестирование (`npm test`)
- [ ] Обновлены переменные окружения в Vercel
- [ ] Выполнен тестовый деплой
- [ ] (Опционально) Мигрированы данные из старой базы

После выполнения всех пунктов ваш проект будет полностью переведен на Supabase! 🎉
