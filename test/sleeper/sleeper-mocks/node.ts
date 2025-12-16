import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';
// https://vitest.dev/guide/mocking/requests.html
export const server = setupServer(...handlers);