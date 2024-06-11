# opentelemetry-azure-function

## Installation

```bash
npm install opentelemetry-azure-function
```

## Usage

```typescript
import { initOpenTelemetryAzureFunctionsHooks } from 'opentelemetry-azure-function';

initOpenTelemetryAzureFunctionsHooks();
// your code

// or
import {
  registerTraceStartHook,
  registerTraceEndHook,
} from 'opentelemetry-azure-function';

registerTraceStartHook();
// your code
registerTraceEndHook();
```

---

## License

This project is licensed under the MIT License.

## Acknowledgements

This project uses Prettier, ESLint, AVA, NYC, Husky, Lint-staged, TypeDoc.
