import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { Handler } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';

const execFileAsync = promisify(execFile);

const ensureDatabaseExists = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const url = new URL(databaseUrl);
  const targetDbName = url.pathname.replace(/^\//, '');
  if (!targetDbName) {
    return;
  }

  if (!/^[A-Za-z0-9_]+$/.test(targetDbName)) {
    throw new Error(
      'DATABASE_URL database name contains unsupported characters',
    );
  }

  const adminUrl = new URL(databaseUrl);
  adminUrl.pathname = '/postgres';
  adminUrl.search = '';
  adminUrl.hash = '';

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: adminUrl.toString(),
      },
    },
  });

  try {
    const found = await prisma.$queryRaw<
      Array<{
        datname: string;
      }>
    >`SELECT datname FROM pg_database WHERE datname = ${targetDbName}`;

    if (found.length > 0) {
      return;
    }

    const quotedDbName = `"${targetDbName}"`;
    await prisma.$executeRawUnsafe(`CREATE DATABASE ${quotedDbName}`);
  } finally {
    await prisma.$disconnect();
  }
};

export const handler: Handler = async () => {
  await ensureDatabaseExists();

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
