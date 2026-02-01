// vitest.config.ts (root)
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        setupFiles: ["./test/sleeper/sleeper-mocks/vitest.setup.ts"],
        include: ['test/**/*.test.ts'],
    },
});
