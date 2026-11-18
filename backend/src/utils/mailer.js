import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter;

/** Jika SMTP_HOST kosong (development), isi email dicetak ke console. */
export async function sendMail({ to, subject, text }) {
  if (!env.SMTP_HOST) {
    if (!env.isProduction && env.NODE_ENV !== 'test') {
      console.log(`\n[mail:dev] Kepada: ${to}\nSubjek: ${subject}\n${text}\n`);
    }
    return { dev: true };
  }
  transporter ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transporter.sendMail({ from: env.SMTP_FROM, to, subject, text });
}
