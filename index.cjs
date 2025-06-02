// server/index.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Resend } = require('resend');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

app.post('/contact', async (req, res) => {
  const { Name, email, phone, message } = req.body;

  try {
    // 1. Send email to your company
    await resend.emails.send({
      from: 'Emelie Hallett <noreply@emeliehallett.com>', // Customize domain later
      to: 'maintenanceman@gmail.com',
      subject: 'New Contact Form Submission',
      html: `
        <h3>New Contact</h3>
        <p><strong>Name:</strong> ${Name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    });

    // 2. Send confirmation to the user
    await resend.emails.send({
      from: 'Emelie Hallett <noreply@emeliehallett.com>',
      to: email,
      subject: 'We’ve received your enquiry',
      html: `
        <p>Hi ${Name},</p>
        <p>Thank you for reaching out. We’ve received your enquiry and will respond within 30 working days.</p>
        <p>— Emelie Hallett Music</p>
      `,
    });

    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend is live!');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});