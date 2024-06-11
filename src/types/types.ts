import { EventGridEvent, HttpRequest, Timer } from '@azure/functions';
import { Attributes, Tracer } from '@opentelemetry/api';
import {
  FAASTRIGGERVALUES_DATASOURCE,
  FAASTRIGGERVALUES_HTTP,
  FAASTRIGGERVALUES_OTHER,
  FAASTRIGGERVALUES_PUBSUB,
  FAASTRIGGERVALUES_TIMER,
} from '@opentelemetry/semantic-conventions';

export type ErrorHandlingFunction = (error: Error) => Attributes;

export type AzureTriggerType =
  | 'httpTrigger'
  | 'timerTrigger'
  | 'eventGridTrigger'
  | 'queueTrigger';

export type TriggerType =
  | typeof FAASTRIGGERVALUES_HTTP
  | typeof FAASTRIGGERVALUES_TIMER
  | typeof FAASTRIGGERVALUES_PUBSUB
  | typeof FAASTRIGGERVALUES_OTHER
  | typeof FAASTRIGGERVALUES_DATASOURCE;

export type AzureTriggerInput = HttpRequest | Timer | EventGridEvent | unknown;

export type TriggerData = {
  triggerType: TriggerType;
  req: AzureTriggerInput;
};

export type RequestAttributesHandler = (options: TriggerData) => Attributes;

export interface StartHookOptions {
  tracer?: Tracer;
  requestAttributesOnStartHook?: RequestAttributesHandler;
}

export interface EndHookOptions {
  errorHandler?: ErrorHandlingFunction;
  requestAttributesOnEndHook?: RequestAttributesHandler;
}

export interface OpenTelemetryAzureFunctionOptions
  extends StartHookOptions,
    EndHookOptions {}
