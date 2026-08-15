require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const dioceseRoutes = require('./routes/dioceses');
const parishRoutes = require('./routes/parishes');
const eventRoutes = require('./routes/events');
const submissionRoutes = require('./routes/submissions');
const sponsorRoutes = require('./routes/sponsors');
const stripeRoutes = require('./routes/stripe');
const adminRoutes = require('./routes/admin');
const { startArchiveJob } = require('./jobs/archiveEvents');

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(cookieParser());

// Stripe webhook needs the raw body for signature verification, so it must
// be mounted before the global express.json() body parser.
app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/dioceses', dioceseRoutes);
app.use('/api/parishes', parishRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Parish Event Finder API listening on port ${PORT}`);
  startArchiveJob();
});
