import { GoogleGenAI } from '@google/genai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const {
      locationName,
      dayType,
      hour,
      waitMin,
      lowWait,
      highWait,
      crowdLevel,
      drivers,
      summaryText,
    } = req.body || {};

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });

    const prompt = `You are explaining a queue and visit forecast for the Waqtly app (prototype demonstration).
Location: ${locationName}
Day: ${dayType}
Target Time: ${hour}:00
Forecasted Wait: ${waitMin} minutes
Demand Sensitivity Range (15% lower/higher): ${lowWait} - ${highWait} minutes
Crowd Level: ${crowdLevel}
Contributing factors: ${Array.isArray(drivers) ? drivers.join(', ') : 'Standard schedule'}
Context: ${summaryText || ''}

Instructions:
1. Explain this specific forecast in 2 to 3 concise, calm, plain-language sentences to help the visitor plan their arrival.
2. Rely ONLY on the numbers and drivers provided above. Never invent extra numbers, fake sensors, or new statistics.
3. Keep the tone calm, trustworthy, and minimal.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.status(200).json({ explanation: response.text });
  } catch (err: any) {
    console.error('Gemini error:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate explanation' });
  }
}
