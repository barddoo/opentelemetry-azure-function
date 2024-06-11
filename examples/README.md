# opentelemetry-azure-function usage examples

This directory contains examples of how to use the OpenTelemetry Azure Function instrumentation.

## Setup

Create a local.settings.json file in the root of the example directory with the following content:

```json
{
  "IsEncrypted": false,
  "Values": {
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "AzureWebJobsFeatureFlags": "EnableWorkerIndexing",
    "AzureWebJobsStorage": "useDevelopmentStorage=true"
  }
}
```

Run azurite locally:

```bash
npm install -g azurite
azurite
```

Run the functions with the following commands:

```bash
npm install
npm start
```

Curl the function:

```bash
curl http://localhost:7071/api/hello
curl http://localhost:7071/api/throw-error
```
