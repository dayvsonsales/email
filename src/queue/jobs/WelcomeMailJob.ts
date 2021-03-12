import SMTPProvider from '@providers/impl/SMTPProvider';

class WelcomeMail {
  constructor() {}

  get key() {
    return 'WelcomeMail';
  }

  async handle({ data }: any) {
    const { user } = data;

    const URL = process.env.CONFIRM_WELCOME_URL || 'https://system/welcome';

    const mailProvider = new SMTPProvider();

    await mailProvider.sendMail({
      to: `${user.name} <${user.email}>`,
      subject: 'Welcome',
      template: 'welcome',
      context: {
        name: user.name,
        link: URL,
      },
    });
  }
}

export default new WelcomeMail();
