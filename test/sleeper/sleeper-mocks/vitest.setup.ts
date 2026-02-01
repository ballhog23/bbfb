// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './node';
// https://vitest.dev/guide/mocking/requests.html


// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Close server after all tests
afterAll(() => server.close());

// Reset handlers after each test for test isolation
afterEach(() => server.resetHandlers());
