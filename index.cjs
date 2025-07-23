// server/index.cjs
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const fetch     = require('node-fetch');        // if Node<18
const { Resend } = require('resend');

const app  = express();
const PORT = process.env.PORT || 5000;

const allowed = [
  process.env.FRONTEND_URL,          // e.g. "https://username.github.io"
  'http://localhost:5173',           // vite’s default dev URL
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (incomingOrigin, callback) => {
      // allow requests with no origin (e.g. curl, mobile apps)
      if (!incomingOrigin) return callback(null, true);
      if (allowed.includes(incomingOrigin)) return callback(null, true);
      callback(new Error(`CORS blocked for ${incomingOrigin}`));
    }
  })
);
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

app.get('/', (req, res) => {
  res.send('Backend is live!');
});

app.post('/contact', async (req, res) => {
  const {
    name, email, phone,
    childName, childAge,
    character, package: pkg,
    numChildren, date, time,
    location, makeovers, parking,
    additional, recaptchaToken
  } = req.body;

  // 1) verify reCAPTCHA v3
  if (!recaptchaToken) {
    return res.status(400).json({ error: 'Missing reCAPTCHA token' });
  }
  try {
    const verifyUrl = new URL(
      'https://www.google.com/recaptcha/api/siteverify'
    );
    verifyUrl.searchParams.append('secret', process.env.RECAPTCHA_SECRET);
    verifyUrl.searchParams.append('response', recaptchaToken);

    const captchaRes = await fetch(verifyUrl.toString(), { method: 'POST' });
    const captchaJson = await captchaRes.json();

    if (!captchaJson.success || captchaJson.score < 0.5) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }
  } catch (err) {
    console.error('reCAPTCHA error:', err);
    return res.status(500).json({ error: 'reCAPTCHA check error' });
  }

  // 2) send the enquiry email
  try {
    await resend.emails.send({
      from:    `Enquiry Bot <${process.env.RECEIVE_EMAIL}>`,
      to:      process.env.RECEIVE_EMAIL,
      subject: 'New Party Enquiry',
      html: `
        <h3>Enquiry from ${name}</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Child:</strong> ${childName} (${childAge})</p>
        <p><strong>Character:</strong> ${character}</p>
        <p><strong>Package:</strong> ${pkg}</p>
        <p><strong>Date/Time:</strong> ${date} at ${time}</p>
        <p><strong>Location:</strong> ${location}</p>
        <p><strong>Makeovers:</strong> ${makeovers}</p>
        <p><strong>Parking:</strong> ${parking}</p>
        <p><strong>Additional:</strong> ${additional}</p>
      `,
    });

    return res.status(200).json({ message: 'Enquiry received' });
  } catch (err) {
    console.error('Email send failure:', err);
    return res.status(500).json({ error: 'Failed to send enquiry' });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});