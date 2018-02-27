/*
 * @Author: Ben Briggs <benbriggs>
 * @Date:   2018-02-26T09:46:37+00:00
 * @Email:  ben.briggs@thedistance.co.uk
 * @Last modified by:   benbriggs
 * @Last modified time: 2018-02-27T09:23:15+00:00
 * @Copyright: The Distance
 */

import adapter from '.';

const createParseObject = props => ({
  get(key) {
    return props[key];
  },
});

const getMessageParameters = ({ message }) =>
  Promise.resolve(message)
    .then(JSON.parse)
    .then(result => {
      const { from, to, subject, text, html, messageId } = result;
      return { from, to, subject, text, html, messageId };
    });

test('should send email', () => {
  const { sendMail } = adapter({
    from: 'mailserver@example.com',
    transport: { jsonTransport: true },
  });

  return sendMail({
    to: 'client@example.com',
    subject: 'Test message',
    text: 'Hi there',
  })
    .then(getMessageParameters)
    .then(({ from, to, subject, text, messageId }) => {
      expect(from).toMatchSnapshot();
      expect(to).toMatchSnapshot();
      expect(subject).toMatchSnapshot();
      expect(text).toMatchSnapshot();
      expect(messageId).toEqual(expect.any(String));
    });
});

test('should send email with names', () => {
  const { sendMail } = adapter({
    from: 'Test App <mailserver@example.com>',
    transport: { jsonTransport: true },
  });

  return sendMail({
    to: 'Client <client@example.com>',
    subject: 'Test message',
    text: 'Hi there',
  })
    .then(getMessageParameters)
    .then(({ from, to }) => {
      expect(from).toMatchSnapshot();
      expect(to).toMatchSnapshot();
    });
})

test('should handle multiple email addresses', () => {
  const { sendMail } = adapter({
    from: 'mailserver@example.com',
    transport: { jsonTransport: true },
  });

  return sendMail({
    to: ['client@example.com', 'client2@example.com'],
    subject: 'Test message',
    text: 'Hi there',
  })
    .then(getMessageParameters)
    .then(({ from, to, subject, text, messageId }) => {
      expect(from).toMatchSnapshot();
      expect(to).toMatchSnapshot();
      expect(subject).toMatchSnapshot();
      expect(text).toMatchSnapshot();
      expect(messageId).toEqual(expect.any(String));
    });
});

test('should send password reset email', () => {
  const { sendPasswordResetEmail } = adapter({
    from: 'mailserver@example.com',
    transport: { jsonTransport: true },
  });

  return sendPasswordResetEmail({
    appName: 'TestApp',
    user: createParseObject({
      email: 'client@example.com',
    }),
    link: 'https://example.com/reset-password',
  })
    .then(getMessageParameters)
    .then(({ from, to, subject, text, html, messageId }) => {
      expect(from).toMatchSnapshot();
      expect(to).toMatchSnapshot();
      expect(subject).toMatchSnapshot();
      expect(text).toMatchSnapshot();
      expect(html).toMatchSnapshot();
      expect(messageId).toEqual(expect.any(String));
    });
});

test('should send verification email', () => {
  const { sendVerificationEmail } = adapter({
    from: 'mailserver@example.com',
    transport: { jsonTransport: true },
  });

  return sendVerificationEmail({
    appName: 'TestApp',
    user: createParseObject({
      username: 'client@example.com',
    }),
    link: 'https://example.com/confirm-account',
  })
    .then(getMessageParameters)
    .then(({ from, to, subject, text, html, messageId }) => {
      expect(from).toMatchSnapshot();
      expect(to).toMatchSnapshot();
      expect(subject).toMatchSnapshot();
      expect(text).toMatchSnapshot();
      expect(html).toMatchSnapshot();
      expect(messageId).toEqual(expect.any(String));
    });
});
