// server/index.cjs

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Resend } = require('resend');
const fetch = require('node-fetch');

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

// ---------------------- CONTACT FORM ----------------------

app.post('/contact', async (req, res) => {
  const { Name, email, phone, message, recaptchaToken } = req.body;

  try {
    // 1. Verify reCAPTCHA
    const captchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    });

    const captchaJson = await captchaRes.json();
    if (!captchaJson.success || captchaJson.score < 0.5) {
      return res.status(403).json({ error: 'Failed reCAPTCHA verification' });
    }

    // 2. Send internal email
    await resend.emails.send({
      from: 'Emelie Hallett <noreply@emeliehallett.com>',
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

    // 3. Send confirmation to user
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

    res.status(200).json({ message: 'Contact emails sent successfully' });
  } catch (error) {
    console.error('Contact error:', error);
    res.status(500).json({ error: 'Contact email failed' });
  }
});

// ---------------------- TESTIMONIALS ----------------------

const testimonials = []; // In-memory store

app.get('/testimonials', (req, res) => {
  const approved = testimonials.filter(t => t.approved);
  res.json(approved);
});

app.post('/testimonials', async (req, res) => {
  const { name, location, review, rating, recaptchaToken } = req.body;

  try {
    // 1. Verify reCAPTCHA
    const captchaRes = await fetch(`https://www.google.com/recaptcha/api/siteverify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    });

    const captchaJson = await captchaRes.json();
    if (!captchaJson.success || captchaJson.score < 0.5) {
      return res.status(403).json({ error: 'Failed reCAPTCHA verification' });
    }

    // 2. Create new testimonial
    const newTestimonial = {
      text: review,
      author: `${name}${location ? `, ${location}` : ''}`,
      rating: Number(rating),
      createdAt: new Date().toISOString(),
      approved: process.env.AUTO_APPROVE === 'true',
    };

    testimonials.unshift(newTestimonial);

    // 3. Notify owner if moderation is on
    if (!newTestimonial.approved && process.env.OWNER_EMAIL) {
      await resend.emails.send({
        from: 'Emelie Hallett <noreply@emeliehallett.com>',
        to: process.env.OWNER_EMAIL,
        subject: 'New Testimonial Pending Approval',
        html: `
          <h2>New Testimonial</h2>
          <p><strong>Name:</strong> ${newTestimonial.author}</p>
          <p><strong>Rating:</strong> ${newTestimonial.rating}</p>
          <p><strong>Review:</strong> ${newTestimonial.text}</p>
        `,
      });
    }

    res.status(201).json(newTestimonial);
  } catch (error) {
    console.error('Testimonial error:', error);
    res.status(500).json({ error: 'Testimonial failed' });
  }
});

app.get('/', (req, res) => res.send('Backend is live!'));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));