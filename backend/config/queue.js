const Bull = require('bull');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const notificationQueue = new Bull('notifications', {
  redis: {
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  }
});

notificationQueue.process(async (job) => {
  const { complaintId, status, userEmail } = job.data;

  if (!process.env.SMTP_USER || !userEmail) {
    console.log(`📧 [SKIP] No SMTP config for complaint ${complaintId}`);
    return;
  }

  await transporter.sendMail({
    from: `"Mardan Smart City" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: `Complaint ${complaintId} — Status Updated to ${status}`,
    html: `
      <h2>Mardan Smart City Complaint Portal</h2>
      <p>Your complaint <strong>${complaintId}</strong> status updated to <strong>${status}</strong>.</p>
    `,
  });

  console.log(`✅ Email sent to ${userEmail}`);
});

notificationQueue.on('completed', (job) => {
  console.log(`✅ Job ${job.id} done after ${job.attemptsMade} attempt(s)`);
});

notificationQueue.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed (attempt ${job.attemptsMade}/${job.opts.attempts}):`, err.message);
});

notificationQueue.on('stalled', (job) => {
  console.warn(`⚠️ Job ${job.id} stalled — will retry`);
});

module.exports = { notificationQueue };
