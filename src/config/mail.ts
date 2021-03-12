export default {
  smtp: {
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  },
  default: {
    from: 'Portal Lacrei <contato@portallacrei.com.br>',
  },
};