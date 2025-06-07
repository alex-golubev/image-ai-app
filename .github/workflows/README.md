# GitHub Actions Workflows

## 📋 Обзор

Проект использует 4 основных workflow для автоматизации CI/CD:

| Workflow        | Триггер                        | Назначение                                 |
| --------------- | ------------------------------ | ------------------------------------------ |
| **Tests**       | Push/PR → main, develop        | Полное тестирование на Node.js 18.x и 20.x |
| **CI**          | PR → main, develop             | Быстрые проверки для Pull Request          |
| **Deploy**      | Push → main (после Tests)      | Автоматический деплой в production         |
| **Build Check** | Schedule/Manual/Config changes | Периодическая проверка сборки              |

## 🚀 Workflows

### 1. Tests (`test.yml`)

```yaml
Triggers: push/PR → main, develop
Matrix: Node.js 18.x, 20.x
Steps: ✅ Checkout code
  ✅ Setup Node.js
  ✅ Install dependencies
  ✅ Run linter
  ✅ Run type check
  ✅ Run tests with coverage
  ✅ Upload coverage to Codecov
  ✅ Comment coverage on PR
```

### 2. CI (`ci.yml`)

```yaml
Triggers: PR → main, develop
Jobs: 📝 lint-and-type-check
  🧪 test-unit
  🎭 test-e2e (Playwright)
```

### 3. Deploy (`deploy.yml`)

```yaml
Triggers: push → main, workflow_run → Tests
Steps: ✅ Run tests before deploy
  ✅ Deploy to Vercel (Vercel собирает автоматически)
  ✅ Notify deployment status
```

### 4. Build Check (`build-check.yml`)

```yaml
Triggers: schedule (daily), manual, config changes
Steps: ✅ Test production build
  ✅ Smoke test production server
  ✅ Notify if build fails
```

## 📊 Текущее покрытие тестами

```
Test Suites: 8 passed, 8 total
Tests:       94 passed, 94 total

Coverage Summary:
- Statements: 39.25%
- Branches:   6.66%
- Functions:  62.16%
- Lines:      38.34%

Полное покрытие (100%):
✅ User module (route, service, schema)
✅ Root API module
✅ App components (layout, page, title)
```

## 🔧 Локальные команды

```bash
# Проверки качества кода
npm run lint           # ESLint
npm run type-check     # TypeScript

# Тестирование
npm test              # Jest unit tests
npm run test:coverage # Jest with coverage
npm run test:playwright # E2E tests

# Сборка
npm run build         # Production build
npm run dev           # Development server
```

## 🛡️ Защита веток

Рекомендуется настроить branch protection rules:

- Обязательные PR для main/develop
- Обязательное прохождение всех checks
- Code review requirement
- Автоматическое удаление merged веток

См. подробности в `branch-protection.md`

## 🔑 Необходимые Secrets

```bash
# Codecov (опционально)
CODECOV_TOKEN

# Vercel (для деплоя)
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## 📈 Статус

- ✅ Jest тестирование настроено
- ✅ TypeScript проверки работают
- ✅ ESLint настроен
- ✅ Codecov интеграция готова
- ✅ Vercel деплой настроен
- ✅ E2E тесты с Playwright
- ✅ Matrix testing (Node.js 18.x, 20.x)
