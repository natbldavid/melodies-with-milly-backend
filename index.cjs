// server/index.cjs
require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const { Resend } = require('resend');

const app  = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

app.get('/', (req, res) => {
  res.send('Backend is live!');
});

app.post('/contact', async (req, res) => {
  const {
    name,
    email,
    phone,
    childName,
    childAge,
    character,
    package: pkg,
    numChildren,
    date,
    time,
    location,
    makeovers,
    parking,
    additional
  } = req.body;

  try {
    // Notify yourself of the new enquiry
    await resend.emails.send({
      from:    'Melodies With Milly <onboarding@resend.dev>',
      to:      'natbldavid@gmail.com',
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

    // return success (no user confirmation email)
    return res.status(200).json({ message: 'Enquiry received' });
  } catch (err) {
    console.error('Send failure:', err);
    return res.status(500).json({ error: 'Failed to send enquiry' });
  }
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));