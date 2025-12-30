/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { RequestMethod } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Handler } from 'aws-lambda';
import express from 'express';
import serverlessExpress from '@codegenie/serverless-express';
import { AppModule } from './app.module';

let cachedHandler: Handler<unknown, unknown> | undefined;

async function createHandler(): Promise<Handler<unknown, unknown>> {
  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.setGlobalPrefix('api', {
    exclude: [{ path: '', method: RequestMethod.GET }],
  });
  app.enableCors({
    origin: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.init();

  return serverlessExpress({
    app: expressApp,
  });
}

export const handler: Handler<unknown, unknown> = async (
  event,
  context,
  callback,
) => {
  context.callbackWaitsForEmptyEventLoop = false;
  cachedHandler ??= await createHandler();
  return cachedHandler(event, context, callback);
};
