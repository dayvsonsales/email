import { Request, Response } from 'express';
import * as yup from 'yup';
import CreateWelcomeEmailJob from '@services/CreateWelcomeEmailJob';

const playerValidation = yup.object().shape({
  name: yup.string().required(),
  email: yup.string().email().required(),
});

export default class EmailController {
  async createWelcomeEmail(request: Request, response: Response) {
    await playerValidation.validate(request.body, {
      stripUnknown: true,
      abortEarly: true,
    });

    const { name, email } = request.body;

    const welcomeEmail = new CreateWelcomeEmailJob();

    const { queue, id, data, options, status } = await welcomeEmail.execute({
      name,
      email,
    });

    return response
      .status(200)
      .json({ key: queue.name, id, data, options, status });
  }
}
