import {
  HttpRequest,
  HttpResponse,
  PostInvocationContext,
  PreInvocationContext,
} from '@azure/functions';
import {
  propagation,
  ROOT_CONTEXT,
  TextMapGetter,
  trace,
  Tracer,
} from '@opentelemetry/api';
import {
  FAASTRIGGERVALUES_HTTP,
  FAASTRIGGERVALUES_OTHER,
  FAASTRIGGERVALUES_PUBSUB,
  FAASTRIGGERVALUES_TIMER,
} from '@opentelemetry/semantic-conventions';

import type { AzureTriggerType, TriggerData, TriggerType } from './types';

export function extractContext(options: TriggerData) {
  const req = options.req;
  const triggerType = options.triggerType;
  if (
    triggerType === FAASTRIGGERVALUES_HTTP &&
    req != null &&
    req instanceof HttpRequest
  ) {
    const headersTextMapGetter: TextMapGetter<typeof req.headers> = {
      get(carrier, key) {
        return carrier?.get(key) ?? undefined;
      },
      keys(carrier) {
        return Array.from(carrier.keys());
      },
    };
    return propagation.extract(ROOT_CONTEXT, req.headers, headersTextMapGetter);
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

export function getTriggerData(
  context: PreInvocationContext | PostInvocationContext,
): TriggerData {
  const triggerType = context.invocationContext.options.trigger
    .type as AzureTriggerType;

  const triggerTypeMapping: Record<AzureTriggerType, TriggerType> = {
    httpTrigger: FAASTRIGGERVALUES_HTTP,
    timerTrigger: FAASTRIGGERVALUES_TIMER,
    eventGridTrigger: FAASTRIGGERVALUES_PUBSUB,
    queueTrigger: FAASTRIGGERVALUES_OTHER,
  };
  return {
    triggerType: triggerTypeMapping[triggerType] ?? FAASTRIGGERVALUES_OTHER,
    req: context.inputs[0],
  };
}
