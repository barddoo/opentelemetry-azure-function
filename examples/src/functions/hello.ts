import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import '../instrumentation';
import { initOpenTelemetryAzureHooks } from 'opentelemetry-azure-function';

initOpenTelemetryAzureHooks();

export async function hello(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const name = request.query.get('name') || (await request.text()) || 'world';

  return { body: `Hello, ${name}!` };
}

app.http('hello', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: hello,
});

export async function throwErrorFunction(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  throw new Error('This is an error');
}

app.http('throw-error', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: throwErrorFunction,
});
