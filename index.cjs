// server/index.cjs
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');
const { Resend } = require('resend');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Allowlisted frontend origins
const allowedOrigins = [
  'http://localhost:5174',
  'https://emeliehallettmusic.co.uk',
];

// ✅ CORS middleware (must go early)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
}));

// ✅ Handle preflight requests
app.options('*', cors());

app.use(express.json());

// ✅ Verify reCAPTCHA v3 token
async function verifyCaptcha(token) {
  const secret = process.env.RECAPTCHA_SECRET;
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`,
  });
  const json = await res.json();
  return json.success && json.score > 0.5;
}

// ✅ Contact endpoint
app.post('/contact', async (req, res) => {
  const { Name, email, phone, message, captcha } = req.body;
  if (!await verifyCaptcha(captcha)) {
    return res.status(400).json({ error: 'reCAPTCHA failed' });
  }

  try {
    await resend.emails.send({
      from: 'Emelie Hallett Music <noreply@emeliehallett.com>',
      to: process.env.RECEIVE_EMAIL,
      subject: 'New Contact Form Submission',
      html: `<h3>From: ${Name}</h3><p>Email: ${email}</p><p>Phone: ${phone}</p><p>${message}</p>`,
    });

    await resend.emails.send({
      from: 'Emelie Hallett Music <noreply@emeliehallett.com>',
      to: email,
      subject: 'Thanks for contacting us',
      html: `<p>Hi ${Name}, thank you for your enquiry. We will respond within 30 working days.</p>`,
    });

    res.json({ message: 'Contact emails sent.' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Send failed' });
  }
});

// ✅ Testimonials endpoint (moderation)
app.post('/testimonials', async (req, res) => {
  const { name, location, review, rating, captcha } = req.body;
  if (!await verifyCaptcha(captcha)) {
    return res.status(400).json({ error: 'reCAPTCHA failed' });
  }

  const reviewHtml = `<p><strong>${name}</strong> (${location}) rated ${rating} ★<br>${review}</p>`;

  try {
    await resend.emails.send({
      from: 'Emelie Hallett Music <noreply@emeliehallett.com>',
      to: process.env.RECEIVE_EMAIL,
      subject: 'New Testimonial Needs Approval',
      html: `${reviewHtml}<p>Approve by visiting: <a href="${process.env.FRONTEND_URL}/approve?name=${encodeURIComponent(name)}&loc=${encodeURIComponent(location)}&rev=${encodeURIComponent(review)}&rating=${rating}">Approve</a></p>`
    });

    res.json({ message: 'Testimonial submitted for approval.' });
  } catch (err) {
    console.error('Testimonial error:', err);
    res.status(500).json({ error: 'Submission failed' });
  }
});

// ✅ Root route
app.get('/', (req, res) => res.send('Server live!'));

// ✅ Start server
app.listen(PORT, () => console.log(`Listening on ${PORT}`));