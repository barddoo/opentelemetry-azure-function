import { app } from '@azure/functions';
import {
  context,
  Span,
  SpanKind,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import {
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
import {
  EndHookOptions,
  ErrorHandlingFunction,
  OpenTelemetryAzureFunctionOptions,
  RequestAttributesHandler,
  StartHookOptions,
} from './types';
import { extractContext, getStatus, getTracer, getTriggerData } from './utils';

const spanSymbol = Symbol('Az Span');
let endHookRegistered = false;

const defaultErrorHandler: ErrorHandlingFunction = (error) => {
  return {
    [SEMATTRS_EXCEPTION_TYPE]: error?.name ?? error?.constructor?.name,
    [SEMATTRS_EXCEPTION_MESSAGE]: error.message,
    [SEMATTRS_EXCEPTION_STACKTRACE]: error.stack,
    [SEMATTRS_EXCEPTION_ESCAPED]: error?.toString(),
  };
};

const defaultRequestAttributesOnStartHook: RequestAttributesHandler = (
  options,
) => getStartAttributes(options.req, options.triggerType);

export function registerTraceStartHook(options?: StartHookOptions): void {
  const tracer = options?.tracer ?? getTracer();
  const requestAttributesOnStartHook =
    options?.requestAttributesOnStartHook ??
    defaultRequestAttributesOnStartHook;

  app.hook.preInvocation((azContext) => {
    if (!endHookRegistered) {
      return;
    }
    const resourceAttributes = detectResource(
      azContext.invocationContext.functionName,
    );
    const triggerData = getTriggerData(azContext);
    const parentCtx = extractContext(triggerData);
    const span = tracer.startSpan(
      azContext.invocationContext.functionName,
      {
        kind: SpanKind.SERVER,
        attributes: {
          ...resourceAttributes,
          ...requestAttributesOnStartHook(triggerData),
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
    azContext.hookData[spanSymbol] = span;
  });
}

function registerTraceEndHook(options?: EndHookOptions): void {
  const errorHandler = options?.errorHandler ?? defaultErrorHandler;
  const requestAttributesOnEndHook = options?.requestAttributesOnEndHook;
  app.hook.postInvocation((context) => {
    // @ts-ignore
    const span: Span = context.hookData[spanSymbol];
    if (span != null) {
      if (requestAttributesOnEndHook != null) {
        const triggerData = getTriggerData(context);
        span.setAttributes(requestAttributesOnEndHook(triggerData));
      }

      if (context.invocationContext.options.trigger.type === 'httpTrigger') {
        const status = getStatus(context);
        span.setAttribute(SEMATTRS_HTTP_STATUS_CODE, status);
      }
      if (context.error != null) {
        const error = context.error as any;
        span.setAttributes(errorHandler(error));
        span.setStatus({ code: SpanStatusCode.ERROR });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      span.end();
    }
  });
  endHookRegistered = true;
}

export function initOpenTelemetryAzureHooks(
  options?: OpenTelemetryAzureFunctionOptions,
): void {
  const tracer = options?.tracer ?? getTracer();
  const errorHandler = options?.errorHandler ?? defaultErrorHandler;

  registerTraceStartHook({ tracer });
  registerTraceEndHook({ errorHandler });
}
