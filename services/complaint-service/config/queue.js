const { Queue, Worker } = require('bullmq');
const nodemailer = require('nodemailer');

const connection = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

const worker = new Worker('notifications', async (job) => {
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
}, { connection });

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} done after ${job.attemptsMade} attempt(s)`);
});
worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});
worker.on('stalled', (jobId) => {
  console.warn(`⚠️ Job ${jobId} stalled — will retry`);
});

module.exports = { notificationQueue };
