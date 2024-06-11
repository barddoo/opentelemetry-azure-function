import { app, InvocationContext, Timer } from '@azure/functions';

export async function timerTrigger(
  _myTimer: Timer,
  context: InvocationContext,
): Promise<void> {
  context.log('Timer function processed request.');
}

app.timer('my-timer', {
  schedule: '0 */5 * * * *',
  handler: timerTrigger,
});
