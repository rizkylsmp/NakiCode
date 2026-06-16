import { Queue, Worker, type JobsOptions } from 'bullmq';
import { config } from './config';
import {
  sendPasswordResetOtpEmail,
  sendVerificationOtpEmail,
} from './email';

type VerificationEmailJob = {
  type: 'verification';
  payload: {
    email: string;
    username: string;
    otp: string;
  };
};

type PasswordResetEmailJob = {
  type: 'password-reset';
  payload: {
    email: string;
    username: string;
    otp: string;
  };
};

export type EmailJob = VerificationEmailJob | PasswordResetEmailJob;

let emailQueue: Queue<EmailJob, void, string> | null = null;
let emailWorker: Worker<EmailJob, void, string> | null = null;

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5_000,
  },
  removeOnComplete: true,
  removeOnFail: 100,
};

export function initializeEmailQueue() {
  if (!config.queue.redisUrl || emailQueue || emailWorker) {
    return;
  }

  const connection = createRedisConnectionOptions(config.queue.redisUrl);

  emailQueue = new Queue<EmailJob, void, string>(config.queue.emailQueueName, {
    connection,
    defaultJobOptions,
  });

  emailWorker = new Worker<EmailJob, void, string>(
    config.queue.emailQueueName,
    async (job) => {
      await processEmailJob(job.data);
    },
    {
      connection,
      concurrency: 3,
    },
  );

  emailWorker.on('failed', (job, error) => {
    console.error(
      `Email queue job failed: ${job?.name ?? 'unknown'} - ${error.message}`,
    );
  });
}

export async function enqueueEmail(job: EmailJob) {
  if (emailQueue) {
    await emailQueue.add(job.type, job, defaultJobOptions);
    return;
  }

  setImmediate(() => {
    void processEmailJob(job).catch((error) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Async email fallback failed: ${message}`);
    });
  });
}

async function processEmailJob(job: EmailJob) {
  if (job.type === 'verification') {
    await sendVerificationOtpEmail(job.payload);
    return;
  }

  await sendPasswordResetOtpEmail(job.payload);
}

function createRedisConnectionOptions(redisUrl: string) {
  const parsedUrl = new URL(redisUrl);

  return {
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 6379),
    username: parsedUrl.username ? decodeURIComponent(parsedUrl.username) : undefined,
    password: parsedUrl.password ? decodeURIComponent(parsedUrl.password) : undefined,
    db: parsedUrl.pathname ? Number(parsedUrl.pathname.replace('/', '') || 0) : 0,
    maxRetriesPerRequest: null,
  };
}
