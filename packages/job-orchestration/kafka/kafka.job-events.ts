import { sendJobEvent } from './kafka.producer';

export async function publishJobStart(topic: string, payload: any) {
  console.log(`(${Date.now()})[JOB-START] ${topic}`);
  await sendJobEvent(`${topic}-start`, {
    event: 'start',
    timestamp: Date.now(),
    payload,
  });
}

export async function publishJobEnd(topic: string, payload: any) {
  console.log(`(${Date.now()})[JOB-END] ${topic}`);
  await sendJobEvent(`${topic}-end`, {
    event: 'end',
    timestamp: Date.now(),
    payload,
  });
}
