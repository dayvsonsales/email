import Bee from 'bee-queue';

import cacheConfig from '@config/cache';

import WelcomeMailJob from './jobs/WelcomeMailJob';

const jobs = [WelcomeMailJob];

interface QueueItem {
  bee: Bee;
  handle: any;
}

class Queue {
  private queues: { [key: string]: QueueItem };

  constructor() {
    this.queues = {};

    this.init();
  }

  init(): void {
    jobs.forEach(({ key, handle }) => {
      this.queues[key] = {
        bee: new Bee(key, {
          activateDelayedJobs: true,
          redis: cacheConfig.redis,
        }),
        handle,
      };
    });
  }

  async add(key: string, data: any): Promise<Bee.Job<any>> {
    return this.queues[key].bee
      .createJob(data)
      .retries(10)
      .backoff('exponential', 1000)
      .save();
  }

  processQueue(): void {
    jobs.forEach(job => {
      const { bee, handle } = this.queues[job.key];

      bee
        .on('failed', this.handleFailure)
        .on('succeeded', result =>
          console.log(
            `Job ${result.queue.name} id: ${
              result.id
            } sent with ${JSON.stringify(result.data)} ${result.status}`,
          ),
        )
        .on('retrying', (job, result) => console.log(job, result))
        .process(handle);
    });
  }

  handleFailure(job: Bee.Job<any>, err: Error): void {
    console.log(`Queue ${job.queue.name}: FAILED`, err);
  }
}

export default new Queue();
