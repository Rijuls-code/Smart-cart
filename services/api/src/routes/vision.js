import { Router } from 'express';
import fetch from 'node-fetch';
import { config } from '../config.js';
import { getSession } from '../dataStore.js';

const router = Router();

function toBase64(dataUrlOrBase64 = '') {
  if (!dataUrlOrBase64) return '';
  const parts = dataUrlOrBase64.split(',');
  return parts.length > 1 ? parts[1] : parts[0];
}

function normalizeResult(parsed, fallbackText) {
  const parsedRisk = parsed?.fraudRiskScore;
  const fraudRiskScore = typeof parsedRisk === 'number' ? Math.min(100, Math.max(0, parsedRisk)) : null;
  return {
    isMatch: parsed?.isMatch ?? false,
    missingFromBill: parsed?.missingFromBill ?? [],
    missingFromCart: parsed?.missingFromCart ?? [],
    quantityMismatch: parsed?.quantityMismatch ?? [],
    fraudRiskScore,
    reason: parsed?.reason || parsed?.notes || fallbackText || 'Model did not return expected JSON'
  };
}

async function callGeminiVision({ imageBase64, billedItems }) {
  if (!config.geminiApiKey) {
    const result = normalizeResult({ isMatch: false, reason: 'geminiApiKey not configured' });
    return { skipped: true, raw: null, result };
  }

  const url = `${config.geminiEndpoint}/${config.geminiModel}:generateContent?key=${config.geminiApiKey}`;
  const prompt = `You are an AI vision-based fraud detection system for a grocery self-checkout app.

You are given:
1) An image of a physical shopping cart or basket.
2) A JSON list of items that the user claims to have scanned and paid for (the digital bill).

Your task is to compare the physical items visible in the image with the billed items.

Steps:
1. Identify and list all recognizable grocery items in the image.
2. Normalize item names (e.g., "Amul Milk 1L" ≈ "Milk").
3. Estimate quantities for each detected item.
4. Compare detected physical items with billed items.
5. Detect:
   - Items present in cart but missing from bill.
   - Items present in bill but missing from cart.
   - Quantity mismatches (extra or fewer units).
6. Assess whether the cart and bill match.

Return STRICTLY in JSON format:

{
  "isMatch": true/false,
  "missingFromBill": ["item1", "item2"],
  "missingFromCart": ["item1", "item2"],
  "quantityMismatch": [
    {
      "item": "string",
      "billQty": number,
      "detectedQty": number
    }
  ],
  "fraudRiskScore": number,
  "reason": "one-line explanation"
}

Rules:
- fraudRiskScore must be between 0 and 100.
- If any unpaid item is detected in the cart, fraudRiskScore ≥ 70.
- If everything matches, fraudRiskScore ≤ 10.
- If detection confidence is low, mention it in the reason.
- Be conservative: only flag items you are reasonably confident about.
- Ignore items that are completely unrecognizable or heavily occluded.
- Do not include extra commentary outside the JSON.`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: imageBase64
            }
          },
          { text: `Billed items JSON:\n${JSON.stringify(billedItems || [], null, 2)}` }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 512
    }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini request failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (_err) {
    parsed = { reason: text || 'Model did not return JSON' };
  }
  const normalized = normalizeResult(parsed, text);
  return { raw: data, result: normalized };
}

router.post('/cart-check', async (req, res) => {
  try {
    const { cartImage, billedItems, sessionId } = req.body || {};
    if (!cartImage) return res.status(400).json({ error: 'cartImage required (base64 or data URL)' });

    const imageBase64 = toBase64(cartImage);
    let billed = Array.isArray(billedItems) ? billedItems : [];
    if (!billed.length && sessionId) {
      const session = getSession(sessionId);
      if (session?.items?.length) billed = session.items;
    }

    const response = await callGeminiVision({ imageBase64, billedItems: billed });
    return res.json({ ok: true, vision: response });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'vision check failed', detail: err.message });
  }
});

export default router;
