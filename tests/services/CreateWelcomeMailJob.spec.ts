import Queue from '../../src/queue/Queue';
import CreateWelcomeEmailJob from '../../src/services/CreateWelcomeEmailJob';

jest.mock('nodemailer-express-handlebars');
jest.mock('bee-queue', () => {
  return jest.fn().mockImplementation(() => {
    return {
      createJob: () => {
        return {
          retries: () => {
            return {
              backoff: () => {
                return {
                  save: () => {},
                };
              },
            };
          },
        };
      },
    };
  });
});

describe('Welcome mail test', () => {
  it('should be able to add to a queue', async done => {
    const queueSpy = jest.spyOn(Queue, 'add');

    const createWelcomeMailJob = new CreateWelcomeEmailJob();

    await createWelcomeMailJob.execute({
      name: 'Hello',
      email: 'hello@hello.com',
    });

    expect(queueSpy).toHaveBeenCalled();

    done();
  });
});
