// server/index.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());            // allow all origins (or lock down to your domain)
app.use(express.json());    // parse JSON request bodies

const resend = new Resend(process.env.RESEND_API_KEY);

app.get('/', (req, res) => {
  res.send('Backend is live!');
});

app.post('/contact', async (req, res) => {
  const { name, email, phone, childName, /*…etc…*/ additional } = req.body;
  try {
    // 1) Notify you
    await resend.emails.send({
      from:    'Emelie Hallett <noreply@emeliehallett.com>',
      to:      'your@business.email',
      subject: 'New Party Enquiry',
      html:    `<h3>New Enquiry from ${name}</h3>…`,
    });

    // 2) Confirmation back to user
    await resend.emails.send({
      from:    'Emelie Hallett <noreply@emeliehallett.com>',
      to:      email,
      subject: 'Thanks for your enquiry!',
      html:    `<p>Hi ${name}, …</p>`,
    });

    return res.status(200).json({ message: 'Emails sent' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Send failure' });
  }
});

app.listen(PORT, () => console.log(`Listening on ${PORT}`));