import BeeQueue from 'bee-queue';
import UserData from '../dtos/UserData';
import Queue from '../queue/Queue';

class CreateWelcomeEmailJob {
  constructor() {}

  async execute({ name, email }: UserData): Promise<BeeQueue.Job<any>> {
    return await Queue.add('WelcomeMail', {
      user: {
        name,
        email,
      },
    });
  }
}

export default CreateWelcomeEmailJob;
