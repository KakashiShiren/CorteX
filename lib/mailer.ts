import nodemailer from "nodemailer";

import { env, hasSmtpEnv } from "@/lib/env";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!hasSmtpEnv) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465,
      auth: {
        user: env.smtpUser,
        pass: env.smtpPass
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000
    });
  }

  return transporter;
}

export async function sendVerificationCodeEmail({
  email,
  code,
  name
}: {
  email: string;
  code: string;
  name?: string;
}) {
  const transport = getTransporter();
  const greeting = name?.trim() ? `Hi ${name.trim()},` : "Hi,";

  await transport.sendMail({
    from: env.smtpFromName ? `"${env.smtpFromName}" <${env.smtpFromEmail}>` : env.smtpFromEmail,
    to: email,
    subject: "Your Grove verification code",
    text: [
      greeting,
      "",
      `Your Grove verification code is ${code}.`,
      "It expires in 10 minutes.",
      "",
      "If you didn't request this, you can ignore this email."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;padding:24px;">
        <p>${greeting}</p>
        <p>Your Grove verification code is:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:0.4em;margin:16px 0;">${code}</p>
        <p>It expires in 10 minutes.</p>
        <p>If you didn't request this, you can ignore this email.</p>
      </div>
    `
  });
}

export async function sendMarketplaceOrderEmail({
  to,
  role,
  itemTitle,
  amount,
  buyerName,
  sellerName
}: {
  to: string;
  role: "buyer" | "seller";
  itemTitle: string;
  amount: number;
  buyerName: string;
  sellerName: string;
}) {
  const transport = getTransporter();
  const subject =
    role === "buyer"
      ? `Order confirmation - ${itemTitle} purchased`
      : `Grove marketplace sale - ${itemTitle}`;
  const headline =
    role === "buyer"
      ? `Your purchase of ${itemTitle} is complete.`
      : `${buyerName} purchased ${itemTitle}.`;
  const nextStep =
    role === "buyer"
      ? `Coordinate pickup or shipping with ${sellerName} in Grove Messages.`
      : `Coordinate pickup or shipping with ${buyerName} in Grove Messages.`;

  await transport.sendMail({
    from: env.smtpFromName ? `"${env.smtpFromName}" <${env.smtpFromEmail}>` : env.smtpFromEmail,
    to,
    subject,
    text: [
      headline,
      "",
      `Amount: $${amount.toFixed(2)}`,
      nextStep,
      "",
      "Thanks for keeping Grove's campus marketplace moving."
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;padding:24px;">
        <h2 style="margin:0 0 12px;">${headline}</h2>
        <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
        <p>${nextStep}</p>
        <p>Thanks for keeping Grove's campus marketplace moving.</p>
      </div>
    `
  });
}
