# Testing Guide

This project uses Jest as the testing framework with React Testing Library for component testing and comprehensive mocking for tRPC and database operations.

## Available Scripts

- `npm test` - Run all tests once
- `npm run test:watch` - Run tests in watch mode (re-runs on file changes)
- `npm run test:coverage` - Run tests with coverage report

## Test Structure

Tests are co-located with their source files using the `.spec.ts` or `.spec.tsx` extension:

```
src/
├── api/
│   ├── init.spec.ts                    # tRPC initialization tests
│   ├── client.spec.tsx                 # tRPC client tests
│   └── modules/
│       ├── root.spec.ts                # Root router tests
│       └── user/
│           ├── user.schema.spec.ts     # Zod schema validation tests
│           ├── user.service.spec.ts    # Business logic tests
│           └── user.route.spec.ts      # tRPC route tests
├── app/
│   ├── page.spec.tsx                   # Main page component tests
│   ├── title.spec.tsx                  # Title component tests
│   └── layout.spec.tsx                 # Layout component tests
└── lib/
    └── trpc-errors.spec.ts             # Error handling utility tests
```

## Error Handling Architecture

The project uses a **direct tRPC error throwing approach** following tRPC documentation best practices:

### Key Components

1. **`src/lib/trpc-errors.ts`** - Centralized error handling utilities

   - `handleDatabaseError()` - Converts database errors to appropriate tRPC errors
   - Helper functions: `throwNotFound()`, `throwBadRequest()`, `throwConflict()`, etc.

2. **Service Layer** - Business logic throws `TRPCError` directly

   - No middleware for error handling
   - Database errors are caught and converted using `handleDatabaseError()`

3. **API Handler** - Uses `onError` callback for logging
   - Located in `src/app/api/trpc/[trpc]/route.ts`
   - Logs errors without transforming them

### Error Flow

```
Database Error → Service catches → handleDatabaseError() → TRPCError → Client
```

## Test Configuration

### Jest Setup (`jest.config.ts`)

- Uses Next.js Jest configuration
- TypeScript support with `ts-jest`
- JSdom environment for React components
- Path mapping for `~/` imports
- Transform ignore patterns for ES modules (SuperJSON, Neon)

### Global Test Setup (`jest.setup.ts`)

- Extends Jest matchers with `@testing-library/jest-dom`
- Mocks for SuperJSON, TextDecoder, and TextEncoder
- Global polyfills for Node.js environment

## Testing Patterns

### 1. Schema Testing (`user.schema.spec.ts`)

Tests Zod validation schemas:

```typescript
it('validates user creation data', () => {
  const validData = { name: 'John', email: 'john@example.com', password: 'pass123' };
  expect(() => createUserSchema.parse(validData)).not.toThrow();
});
```

### 2. Service Testing (`user.service.spec.ts`)

Tests business logic with mocked database:

```typescript
// Mock database operations
const mockInsert = {
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([mockUser]),
};
mockDb.insert.mockReturnValue(mockInsert);

// Test service function
const result = await createUser(userData);
expect(result).toEqual([mockUser]);
```

### 3. Route Testing (`user.route.spec.ts`)

Tests tRPC procedures using caller factory:

```typescript
const callerFactory = createCallerFactory(userRoute);
const context = await createTRPCContext();
const caller = callerFactory(context);

const result = await caller.createUser(userData);
expect(mockCreateUser).toHaveBeenCalledWith(userData);
```

### 4. Component Testing (`title.spec.tsx`)

Tests React components with tRPC mocking:

```typescript
// Mock tRPC client
const mockTrpc = {
  hello: { useQuery: jest.fn() }
};

// Test component rendering
render(<Title />);
expect(screen.getByText('Hello World')).toBeInTheDocument();
```

## Mocking Strategy

### Database Mocking

- Complete mock of Drizzle ORM database instance
- Mocked query builders with chainable methods
- Uses `any` types with ESLint disable for complex Drizzle types

### tRPC Mocking

- Service functions mocked at module level
- tRPC client mocked for React components
- Context creation mocked for route testing

### Environment Mocking

- SuperJSON mocked to avoid ES module issues
- TextDecoder/TextEncoder polyfills for Node.js
- Global setup in `jest.setup.ts`

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test user.service.spec.ts
```

## Test Coverage

Current coverage includes:

- **137 tests** across **10 test suites**
- Complete coverage for user module (schema, service, routes)
- Component testing for React components
- Error handling utility testing
- tRPC initialization and configuration testing

## Best Practices

1. **Co-locate tests** with source files
2. **Mock at the boundary** - mock database, not business logic
3. **Test behavior, not implementation** - focus on inputs/outputs
4. **Use descriptive test names** that explain the scenario
5. **Group related tests** using `describe` blocks
6. **Clean up mocks** in `beforeEach` hooks
7. **Use TypeScript** for better test reliability
8. **Follow AAA pattern** - Arrange, Act, Assert

## Error Testing

Error scenarios are thoroughly tested:

- Database constraint violations → `CONFLICT` errors
- Missing records → `NOT_FOUND` errors
- Invalid input → `BAD_REQUEST` errors
- Database failures → `INTERNAL_SERVER_ERROR` errors

Each error type includes both the error code and descriptive message testing.

## Configuration

- `jest.config.ts` - Main Jest configuration (TypeScript)
- `jest.setup.ts` - Test setup file (imports jest-dom matchers)

## Writing Tests

### Basic Component Test Example

```tsx
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Button from './Button';

describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Path Mapping

The project supports path mapping with `~/` prefix:

```tsx
import { MyComponent } from '~/components/MyComponent';
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory and include:

- HTML report: `coverage/lcov-report/index.html`
- Text summary in terminal
- LCOV format for CI/CD integration

## Debugging Tests

To debug tests in VS Code:

1. Set breakpoints in your test files
2. Run the "Debug Jest Tests" configuration
3. Or use `console.log()` for simple debugging
