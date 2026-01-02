import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Handler } from 'aws-lambda';

const execFileAsync = promisify(execFile);

export const handler: Handler = async () => {
  const prismaCliEntrypoint = 'node_modules/prisma/build/index.js';

  const result = await execFileAsync(
    process.execPath,
    [
      prismaCliEntrypoint,
      'migrate',
      'deploy',
      '--schema',
      'prisma/schema.prisma',
    ],
    {
      env: process.env,
      timeout: 15 * 60 * 1000,
      maxBuffer: 10 * 1024 * 1024,
    },
  );

  return {
    ok: true,
    stdout: result.stdout,
    stderr: result.stderr,
  };
};
