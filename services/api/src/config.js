import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  qrSecret: process.env.QR_SECRET || 'qr-secret',
  qrExpirySeconds: Number(process.env.QR_EXPIRY_SECONDS || 300),
  geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_API_KEY',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  geminiEndpoint: process.env.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1beta/models'
};



