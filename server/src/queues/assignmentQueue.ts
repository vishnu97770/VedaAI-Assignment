import { Queue } from 'bullmq';

const assignmentQueue = new Queue('assignment-generation', {
  connection: {
    host: 'helpful-seahorse-137994.upstash.io',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    tls: {},
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

assignmentQueue.on('error', (err) => {
  console.error('Queue error:', err);
});

export const addAssignmentJob = async (assignmentId: string, data: object) => {
  const job = await assignmentQueue.add('generate', {
    assignmentId,
    ...data,
  });
  console.log(`Job added to queue: ${job.id}`);
  return job;
};

export default assignmentQueue;