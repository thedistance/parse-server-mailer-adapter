/*
 * @Author: Ben Briggs <benbriggs>
 * @Date:   2018-02-23T16:54:27+00:00
 * @Email:  ben.briggs@thedistance.co.uk
 * @Last modified by:   benbriggs
 * @Last modified time: 2018-03-28T14:21:08+01:00
 * @Copyright: The Distance
 */

import path from 'path';
import Email from 'email-templates';
import nodemailer from 'nodemailer';
import pify from 'pify';

const arrayOf = what => (Array.isArray(what) ? what : [what]);
const curry1 = func => arg => func(arg);
const getEmailAddress = obj => obj.get('email') || obj.get('username');

/**
 * An adapter for Parse Server that abstracts the email sending mechanism away
 * to provide a consistent interface no matter which provider you are using.
 * Thanks primarily go to [Nodemailer](https://nodemailer.com) and
 * [email-templates](https://www.npmjs.com/package/email-templates) which
 * do the heavy lifting.
 *
 * @param {Object}  options
 * @param {String}  [options.engine=pug] The templating engine used; pass a file
 * extension to change this (e.g. `hbs`, `ejs`). Note that you will have to
 * install the template language as a dependency of your application if you use
 * this option.
 * @param {String}  options.from The email address to send from.
 * @param {Boolean} [options.send] Passed through to `email-templates`
 * and will deactivate email sending in development & test environments. Set to
 * `true` if you want to send emails when testing your application.
 * @param {String}  [options.templates=parse-server-mailer-adapter/templates]
 * Specify the base path for your templates here; see the `email-templates`
 * documentation for more details.
 * @param {Object}  options.transport This is passed straight through to
 * `nodemailer.createTransport`, so you may use any email sending methods.
 * @returns {Object<Function>} Exposes `sendMail`, `sendPasswordResetEmail` and
 * `sendVerificationEmail` for Parse's benefit. In addition, there are two
 * custom template methods; `sendTemplateEmail` allows you to specify a template
 * and an object of local template variables, whereas `sendCustomEmail` allows
 * you to pass global message variables (such as from address) as well as giving
 * you full control of the options for the send handler.
 * @example <caption>Using the AWS SES adapter</caption>
 * const ParseServer = require('parse-server').ParseServer;
 * const aws = require('aws-sdk');
 *
 * const SES = new aws.SES({ apiVersion: '2010-12-01' });
 *
 * const server = ParseServer({
 *   // ... other options
 *   emailAdapter: {
 *     module: 'parse-server-mailer-adapter',
 *     options: {
 *       from: 'noreply@example.com'
 *       transport: { SES }
 *     }
 *   }
 * })
 * @example <caption>Using the JSON adapter</caption>
 * const ParseServer = require('parse-server').ParseServer;
 *
 * const server = ParseServer({
 *   // ... other options
 *   emailAdapter: {
 *     module: 'parse-server-mailer-adapter',
 *     options: {
 *       from: 'noreply@example.com'
 *       transport: { jsonTransport: true }
 *     }
 *   }
 * })
 * @example <caption>Using the SMTP adapter</caption>
 * const ParseServer = require('parse-server').ParseServer;
 *
 * const server = ParseServer({
 *   // ... other options
 *   emailAdapter: {
 *     module: 'parse-server-mailer-adapter',
 *     options: {
 *       from: 'noreply@example.com'
 *       transport: {
 *         pool: true,
 *         host: 'smtp.example.com',
 *         port: 465,
 *         secure: true,
 *         auth: {
 *           user: 'user',
 *           pass: 'pass'
 *         }
 *       }
 *     }
 *   }
 * })
 */

const nodeMailerAdapter = ({
  engine,
  from,
  send,
  transport,
  templates = path.resolve(__dirname, '..', 'templates'),
}) => {
  const transporter = nodemailer.createTransport(transport);

  const _sendMail = curry1(pify(transporter.sendMail.bind(transporter)));

  const sendMail = ({ to, subject, text, html, attachments }) =>
    _sendMail({
      from,
      to: arrayOf(to),
      subject,
      text,
      html,
      attachments,
    });

  const sendCustomEmail = (messageOptions = {}) => localMessageOptions =>
    new Email({
      message: { from, ...messageOptions },
      transport: transporter,
      send,
      views: {
        root: templates,
        options: {
          extension: engine,
        },
      },
    }).send(localMessageOptions);

  const sendTemplateEmail = template => locals =>
    sendCustomEmail()({
      template,
      message: {
        to: getEmailAddress(locals.user),
      },
      locals,
    });

  const sendPasswordResetEmail = sendTemplateEmail('passwordReset');
  const sendVerificationEmail = sendTemplateEmail('verification');

  return {
    sendMail,
    sendCustomEmail,
    sendTemplateEmail,
    sendPasswordResetEmail,
    sendVerificationEmail,
  };
};

export default nodeMailerAdapter;
