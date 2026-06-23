import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Sequence test files rather than running them concurrently.
    // Prevents mongodb-memory-server from racing on the binary download in CI
    // while keeping each file in its own VM context (avoids Mongoose model conflicts).
    fileParallelism: false,
  },
});
