declare module '@codegenie/serverless-express' {
  import type { Handler } from 'aws-lambda';
  import type { Express } from 'express';

  export interface ServerlessExpressOptions {
    app: Express;
    binarySettings?: unknown;
    resolutionMode?: 'PROMISE' | 'CONTEXT' | 'CALLBACK';
    respondWithErrors?: boolean;
  }

  const serverlessExpress: (
    options: ServerlessExpressOptions,
  ) => Handler<unknown, unknown>;
  export default serverlessExpress;
}
