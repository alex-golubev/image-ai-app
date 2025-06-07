# GitHub Actions Configuration

Этот проект использует GitHub Actions для автоматизации CI/CD процессов.

## Workflows

### 1. Tests (`test.yml`)

Запускается при:

- Push в ветки `main` и `develop`
- Pull Request в ветки `main` и `develop`

**Что выполняется:**

- Линтинг кода
- Проверка типов TypeScript
- Запуск Jest тестов с покрытием
- Загрузка отчета о покрытии в Codecov
- Комментирование покрытия в PR

**Matrix strategy:** Node.js 18.x и 20.x

### 2. CI (`ci.yml`)

Запускается при Pull Request в ветки `main` и `develop`

**Jobs:**

- **lint-and-type-check**: Быстрая проверка кода и типов
- **test-unit**: Юнит тесты с покрытием
- **test-e2e**: E2E тесты с Playwright

### 3. Deploy (`deploy.yml`)

Запускается при:

- Push в ветку `main`
- Успешном завершении workflow "Tests"

**Что выполняется:**

- Повторный запуск тестов
- Деплой на Vercel (Vercel собирает проект автоматически)
- Уведомление о статусе деплоя

### 4. Build Check (`build-check.yml`)

Запускается:

- По расписанию (ежедневно в 6:00 UTC)
- Вручную через GitHub UI
- При изменении конфигурационных файлов

**Что выполняется:**

- Проверка production сборки
- Smoke test production сервера
- Уведомление при ошибках сборки

## Необходимые Secrets

Для корректной работы workflows необходимо настроить следующие secrets в GitHub:

### Codecov (опционально)

```
CODECOV_TOKEN=your_codecov_token
```

### Vercel (для деплоя)

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
```

## Настройка Codecov

1. Зарегистрируйтесь на [codecov.io](https://codecov.io)
2. Подключите ваш GitHub репозиторий
3. Получите токен и добавьте его в GitHub Secrets

## Настройка Vercel

1. Установите Vercel CLI: `npm i -g vercel`
2. Войдите в аккаунт: `vercel login`
3. Получите токен: `vercel --token`
4. Получите org ID и project ID из настроек проекта в Vercel

## Локальная разработка

```bash
# Установка зависимостей
npm ci

# Запуск линтера
npm run lint

# Проверка типов
npm run type-check

# Запуск тестов
npm test

# Запуск тестов с покрытием
npm run test:coverage

# Запуск E2E тестов
npm run test:playwright
```

## Структура тестов

- **Unit тесты**: `*.spec.ts`, `*.spec.tsx`
- **E2E тесты**: `tests/` директория (Playwright)
- **Покрытие**: Генерируется в `coverage/` директории

## Статусы проверок

Все workflows должны пройти успешно для:

- Мержа Pull Request
- Деплоя в production

Статусы проверок отображаются в GitHub и блокируют мерж при неудаче.
