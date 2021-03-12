import nodemailer, { SentMessageInfo } from 'nodemailer';
import { resolve } from 'path';
import exphbs from 'express-handlebars';

import mailConfig from '@config/mail';
import Mail from 'nodemailer/lib/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import IMailProvider from '@providers/MailProvider/IMailProvider';

///<reference path="../../@types/nodemailer.d.ts" />
import nodemailerhbs from 'nodemailer-express-handlebars';

class SMTPProvider implements IMailProvider {
  private transporter: Mail;

  constructor() {
    const { host, port, secure, auth } = mailConfig.smtp;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: auth.user ? auth : null,
    } as SMTPTransport.Options);

    this.configureTemplates();
  }

  configureTemplates() {
    const viewPath = resolve(
      __dirname,
      '..',
      '..',
      '..',
      'resources',
      'mail',
      'templates',
    );

    this.transporter.use(
      'compile',
      nodemailerhbs({
        viewEngine: exphbs.create({
          extname: '.hbs',
          defaultLayout: undefined,
        }),
        viewPath,
        extName: '.hbs',
        defaultLayout: false,
      }),
    );
  }

  sendMail(message: any): Promise<SentMessageInfo> {
    return this.transporter.sendMail({
      ...mailConfig.default,
      ...message,
    });
  }
}

export default SMTPProvider;
