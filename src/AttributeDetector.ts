import { HttpRequest } from '@azure/functions';
import {
  FAASTRIGGERVALUES_HTTP,
  SEMATTRS_FAAS_TRIGGER,
  SEMATTRS_HTTP_HOST,
  SEMATTRS_HTTP_METHOD,
  SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH,
  SEMATTRS_HTTP_URL,
  SEMATTRS_HTTP_USER_AGENT,
} from '@opentelemetry/semantic-conventions';

import { type AzureTriggerInput } from './types';

const cHttpHeadersToCapture = {
  'user-agent': SEMATTRS_HTTP_USER_AGENT,
  host: SEMATTRS_HTTP_HOST,
};

function captureHttpHeaders(req: HttpRequest): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const [headerName, semConvKey] of Object.entries(
    cHttpHeadersToCapture,
  )) {
    const headerValue = headerGetter(req, headerName);
    if (headerValue != null) {
      attrs[semConvKey] = headerValue;
    }
  }
  return attrs;
}

function headerGetter(req: any, headerName: string): any {
  if (req instanceof HttpRequest) {
    return req.headers.get(headerName);
  } else {
    return req.headers[headerName];
  }
}

export function getStartAttributes(
  req: AzureTriggerInput,
  triggerType: string,
): Record<string, string> {
  let attributes: Record<string, string>;
  if (
    triggerType == FAASTRIGGERVALUES_HTTP &&
    req != null &&
    req instanceof HttpRequest
  ) {
    attributes = Object.assign(
      {
        [SEMATTRS_FAAS_TRIGGER]: triggerType,
        [SEMATTRS_HTTP_METHOD]: req.method || 'GET',
        [SEMATTRS_HTTP_URL]: req.url,
        [SEMATTRS_HTTP_REQUEST_CONTENT_LENGTH]:
          req.headers.get('content-length') || '0',
      },
      captureHttpHeaders(req),
    );
  } else {
    attributes = {
      [SEMATTRS_FAAS_TRIGGER]: triggerType,
    };
  }

  return attributes;
}
