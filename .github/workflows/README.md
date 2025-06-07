# GitHub Actions Workflows

This project uses an optimized CI/CD system with minimal workflow files for maximum efficiency.

## 📋 Workflow Structure

### 🚀 [`ci.yml`](./ci.yml) - Main CI/CD Pipeline

**Triggers:**

- `push` to `main`, `develop` branches
- `pull_request` to `main`, `develop` branches

**Jobs:**

#### 1. **Lint and Type Check**

- Code linting with ESLint
- TypeScript type checking
- Fast code quality validation

#### 2. **Unit Tests**

- Jest unit test execution
- Coverage report generation
- Coverage upload to Codecov
- Automatic coverage comments on PRs

#### 3. **E2E Tests**

- Playwright end-to-end testing
- Timeout: 60 minutes
- DATABASE_URL support from secrets
- Automatic report uploads on failures

**Node.js version:** `22.x`

---

### 🏗️ [`build-check.yml`](./build-check.yml) - Production Build Validation

**Triggers:**

- `schedule` - daily at 6:00 UTC
- `workflow_dispatch` - manual trigger
- `push` to `main` branch when build files change

**Purpose:**

- Next.js production build validation
- Production server smoke testing
- Early detection of dependency issues
- Configuration validation

**Node.js version:** `22.x`

## 🔧 Setup

### Required Secrets

Add the following secrets in repository settings:

```bash
CODECOV_TOKEN=your_codecov_token
DATABASE_URL=your_database_url_for_e2e_tests
```

### Environment Variables

- `DATABASE_URL` - used for E2E tests
- `GITHUB_TOKEN` - automatically provided by GitHub

## 📊 Coverage Reports

- **Codecov Integration**: Automatic coverage report uploads
- **PR Comments**: Automatic coverage change comments
- **Threshold**: Configured in fail-safe mode (doesn't block CI on Codecov errors)

## 🎯 Optimization

### What was optimized:

1. **Removed duplication**: Combined 4 workflows into 2
2. **Matrix testing**: Removed redundant testing on multiple Node.js versions
3. **Playwright**: Integrated into main CI instead of separate workflow
4. **Caching**: Using npm cache to speed up dependency installation

### Benefits:

- ⚡ **Faster**: Fewer parallel jobs
- 💰 **Cost-effective**: Fewer GitHub Actions minutes
- 🔧 **Simpler**: Easier to maintain and configure
- 📈 **More reliable**: Fewer failure points

## 🚦 Check Status

### On Pull Request:

- ✅ Lint and Type Check
- ✅ Unit Tests + Coverage
- ✅ E2E Tests
- 📊 Coverage Report Comment

### On Push to main/develop:

- ✅ All checks from PR
- 🏗️ Build Check (when build files change)

### Scheduled:

- 🏗️ Daily Build Check (6:00 UTC)

## 📝 Local Development Commands

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Unit tests
npm test

# Unit tests with coverage
npm test -- --coverage

# E2E tests
npm run test:playwright

# Build
npm run build

# Production start
npm start
```

## 🔍 Troubleshooting

### E2E Tests Failed

1. Check `DATABASE_URL` in secrets
2. Ensure all Playwright dependencies are installed
3. Check logs in Playwright report artifacts

### Build Check Failed

1. Check changes in `package.json` or configuration files
2. Ensure all dependencies are compatible
3. Check TypeScript errors

### Coverage Upload Failed

1. Check `CODECOV_TOKEN` in secrets
2. Coverage upload is configured in fail-safe mode and won't block CI

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright Testing](https://playwright.dev/)
- [Codecov Integration](https://docs.codecov.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

## 🔄 Updates

When adding new checks or changing project structure, update the corresponding workflow files and this README.

---

**Last updated:** Node.js 22.x, optimized workflow structure
