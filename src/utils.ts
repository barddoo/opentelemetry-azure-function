import {
  HttpRequest,
  HttpResponse,
  PostInvocationContext,
} from '@azure/functions';
import {
  propagation,
  ROOT_CONTEXT,
  TextMapGetter,
  trace,
  Tracer,
} from '@opentelemetry/api';
import { FAASTRIGGERVALUES_HTTP } from '@opentelemetry/semantic-conventions';

export function extractContext(triggerType: string, req: any) {
  if (triggerType === FAASTRIGGERVALUES_HTTP && req != null) {
    if (req instanceof HttpRequest) {
      const headersTextMapGetter: TextMapGetter<typeof req.headers> = {
        get(carrier, key) {
          return carrier?.get(key) ?? undefined;
        },
        keys(carrier) {
          return Array.from(carrier.keys());
        },
      };
      return propagation.extract(
        ROOT_CONTEXT,
        req.headers,
        headersTextMapGetter,
      );
    }
    return propagation.extract(ROOT_CONTEXT, req.headers);
  }
  return ROOT_CONTEXT;
}

export function getStatus(context: PostInvocationContext) {
  let status: number;
  const res = context.result as HttpResponse;
  if (res != null) {
    status = res.status != null ? +res.status : 200;
  } else {
    status = 204;
  }
  return status;
}

let tracer: Tracer;

export function getTracer() {
  if (tracer == null) {
    tracer = trace.getTracer('opentelemetry-azure-functions');
  }
  return tracer;
}
