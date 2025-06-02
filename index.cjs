const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Resend } = require('resend');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Routes
app.get('/', (req, res) => {
  res.send('Backend is live!');
});

app.post('/contact', async (req, res) => {
  const { Name, email, phone, message } = req.body;

  try {
    // Send email to you (business owner)
    await resend.emails.send({
      from: 'Nat David <natbldavid@gmail.com>',
      to: 'natbldavid@gmail.com', // your receiving email
      subject: 'New Contact Form Submission',
      html: `
        <h2>New Message from ${Name}</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
        <p><strong>Message:</strong><br/>${message}</p>
      `,
    });

    // Send auto-reply to the user
    await resend.emails.send({
      from: 'Nat David <natbldavid@gmail.com>',
      to: email,
      subject: 'We’ve received your enquiry',
      html: `
        <p>Hi ${Name},</p>
        <p>Thank you for contacting Emelie Hallett Music. We’ve received your message and will get back to you within 30 working days.</p>
        <p>Warm regards,<br/>Emelie Hallett Music Team</p>
      `,
    });

    res.status(200).json({ message: 'Emails sent successfully' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
