# Collabryx Test Suite

## Test Structure

```
tests/
├── setup/                    # Test configuration
│   ├── setup.ts             # Global test setup
│   ├── mocks.ts             # Mock utilities  
│   └── fixtures.ts          # Test data
├── unit/                    # Unit tests
│   ├── hooks/               # Hook tests
│   ├── services/            # Service tests
│   └── utils/               # Utility tests
├── components/              # Component tests
│   ├── features/            # Feature components
│   └── shared/              # Shared components
├── integration/             # Integration tests
│   ├── api/                 # API tests
│   └── database/            # Database tests
└── e2e/                     # E2E tests
    ├── auth-flow.spec.ts    # Authentication
    └── onboarding-flow.spec.ts # Onboarding
```

## Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test tests/unit/hooks/use-posts.test.tsx
```

## Test Coverage Target

- **Target:** 70%+ coverage
- **Critical Paths:** Auth, Posts, Matches, Messaging
- **Priority:** Hooks > Services > Components > Utils

