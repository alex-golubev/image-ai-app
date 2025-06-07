# Branch Protection Rules

Для обеспечения качества кода рекомендуется настроить следующие правила защиты веток в GitHub.

## Настройка для ветки `main`

1. Перейдите в Settings → Branches
2. Нажмите "Add rule"
3. Укажите Branch name pattern: `main`
4. Включите следующие опции:

### Require a pull request before merging

- ✅ Require a pull request before merging
- ✅ Require approvals: 1
- ✅ Dismiss stale PR approvals when new commits are pushed
- ✅ Require review from code owners (если есть CODEOWNERS файл)

### Require status checks to pass before merging

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

**Required status checks:**

- `test (18.x)` - Tests workflow Node.js 18.x
- `test (20.x)` - Tests workflow Node.js 20.x
- `lint-and-type-check` - CI workflow lint and type check
- `test-unit` - CI workflow unit tests
- `test-e2e` - CI workflow E2E tests

### Additional restrictions

- ✅ Restrict pushes that create files larger than 100 MB
- ✅ Require linear history (опционально)
- ✅ Include administrators

## Настройка для ветки `develop`

Аналогичные настройки, но можно сделать менее строгими:

1. Branch name pattern: `develop`
2. Require a pull request before merging: ✅
3. Require approvals: 1
4. Require status checks: ✅

**Required status checks для develop:**

- `test-unit` - Основные unit тесты
- `lint-and-type-check` - Линтинг и проверка типов

## Автоматическое удаление веток

В Settings → General → Pull Requests:

- ✅ Automatically delete head branches

## CODEOWNERS файл (опционально)

Создайте файл `.github/CODEOWNERS`:

```
# Global owners
* @your-username

# API routes
/src/api/ @backend-team

# Frontend components
/src/app/ @frontend-team

# Tests
*.spec.ts @qa-team
*.spec.tsx @qa-team

# GitHub workflows
/.github/ @devops-team

# Configuration files
package.json @senior-developers
tsconfig.json @senior-developers
jest.config.ts @senior-developers
```

## Результат

После настройки:

- Невозможно прямой push в `main` и `develop`
- Все изменения проходят через Pull Request
- Обязательная проверка всех тестов и линтера
- Обязательный code review
- Автоматическое удаление merged веток
