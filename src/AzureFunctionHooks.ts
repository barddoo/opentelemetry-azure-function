import { app, PreInvocationContext } from '@azure/functions';
import {
  context,
  Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import {
  FAASTRIGGERVALUES_HTTP,
  FAASTRIGGERVALUES_OTHER,
  SEMATTRS_EXCEPTION_ESCAPED,
  SEMATTRS_EXCEPTION_MESSAGE,
  SEMATTRS_EXCEPTION_STACKTRACE,
  SEMATTRS_EXCEPTION_TYPE,
  SEMATTRS_HTTP_STATUS_CODE,
} from '@opentelemetry/semantic-conventions';

import { getStartAttributes } from './AttributeDetector';
import {
  detectResource,
  setPropagatedResourceAttributes,
} from './ResourceDetector';
import { extractContext, getStatus, getTracer } from './utils';

const cDtSpanSymbol = Symbol('Dt Span');
let endHookRegistered = false;

function getTriggerData(context: PreInvocationContext) {
  if (context.invocationContext.options.trigger.type === 'httpTrigger') {
    return { triggerType: FAASTRIGGERVALUES_HTTP, req: context.inputs[0] };
  } else {
    return { triggerType: FAASTRIGGERVALUES_OTHER, req: undefined };
  }
}

export function registerTraceStartHook() {
  app.hook.preInvocation((azContext) => {
    if (!endHookRegistered) {
      return;
    }
    const resourceAttributes = detectResource(
      azContext.invocationContext.functionName,
    );
    const { triggerType, req } = getTriggerData(azContext);
    const parentCtx = extractContext(triggerType, req);
    const span = getTracer().startSpan(
      azContext.invocationContext.functionName,
      {
        kind: SpanKind.SERVER,
        attributes: {
          ...resourceAttributes,
          ...getStartAttributes(triggerType, req),
        },
      },
      parentCtx,
    );
    setPropagatedResourceAttributes(span, resourceAttributes);

    azContext.functionHandler = context.bind(
      trace.setSpan(parentCtx, span),
      azContext.functionHandler,
    );
    // @ts-ignore
    azContext.hookData[cDtSpanSymbol] = span;
  });
}

function registerTraceEndHook() {
  app.hook.postInvocation((context) => {
    // @ts-ignore
    const span: Span = context.hookData[cDtSpanSymbol];
    if (span != null) {
      if (context.invocationContext.options.trigger.type === 'httpTrigger') {
        const status = getStatus(context);
        span.setAttribute(SEMATTRS_HTTP_STATUS_CODE, status);
      }
      if (context.error != null) {
        const error = context.error as any;
        span.setAttributes({
          [SEMATTRS_EXCEPTION_TYPE]: error?.name ?? error?.constructor?.name,
          [SEMATTRS_EXCEPTION_MESSAGE]: error.message,
          [SEMATTRS_EXCEPTION_STACKTRACE]: error.stack,
          [SEMATTRS_EXCEPTION_ESCAPED]: error?.toString(),
        });
        span.setStatus({ code: SpanStatusCode.ERROR });
      }
      span.end();
    }
  });
  endHookRegistered = true;
}

export function initOpentelemetryHooks() {
  registerTraceStartHook();
  registerTraceEndHook();
}
