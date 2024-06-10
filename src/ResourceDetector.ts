import { Span } from '@opentelemetry/api';
import {
  CLOUDPLATFORMVALUES_AZURE_FUNCTIONS,
  CLOUDPROVIDERVALUES_AZURE,
  SEMRESATTRS_CLOUD_PLATFORM,
  SEMRESATTRS_CLOUD_PROVIDER,
  SEMRESATTRS_CLOUD_REGION,
  SEMRESATTRS_FAAS_ID,
  SEMRESATTRS_FAAS_NAME,
} from '@opentelemetry/semantic-conventions';

const ownerNamePattern = /([^+]+)\+(.+)-([^-]+)webspace(?:-[^-]+)?/;

export function detectResource(functionName: string): Record<string, string> {
  const res: Record<string, string> = {
    [SEMRESATTRS_CLOUD_PROVIDER]: CLOUDPROVIDERVALUES_AZURE,
    [SEMRESATTRS_CLOUD_PLATFORM]: CLOUDPLATFORMVALUES_AZURE_FUNCTIONS,
  };
  const functionAppName = process.env.WEBSITE_SITE_NAME;
  res[SEMRESATTRS_FAAS_NAME] =
    functionAppName != null
      ? `${functionAppName}/${functionName}`
      : functionName;

  const ownerName = process.env.WEBSITE_OWNER_NAME;
  let resourceGroup = process.env.WEBSITE_RESOURCE_GROUP;
  let regionName = process.env.REGION_NAME;
  let subscriptionId: string | null = null;
  if (ownerName != null) {
    const exec = ownerNamePattern.exec(ownerName);
    if (exec != null) {
      subscriptionId = exec[1];
      if (resourceGroup == null) {
        resourceGroup = exec[2];
      }
      if (regionName == null) {
        regionName = exec[3];
      }
    }
  }
  if (regionName != null) {
    res[SEMRESATTRS_CLOUD_REGION] = regionName;
    if (
      resourceGroup != null &&
      subscriptionId != null &&
      functionAppName != null &&
      functionName != null
    ) {
      res[SEMRESATTRS_FAAS_ID] =
        `/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/providers/Microsoft.Web/sites/${functionAppName}/functions/${functionName}`;
    }
  }

  return res;
}

const propagatedResourceAttributesKey = Symbol(
  'Propagated Resource Attributes',
);

export function setPropagatedResourceAttributes(
  span: Span,
  resourceAttributes: Record<string, string>,
) {
  if (span.isRecording() && resourceAttributes != null) {
    // @ts-ignore
    span[propagatedResourceAttributesKey] = resourceAttributes;
  }
}
