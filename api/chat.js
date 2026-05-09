export const config = {
  maxDuration: 30
};

export default async function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    const apiKey = process.env.AGENT_ROUTER_TOKEN;

    if (!apiKey) {
      return res.status(500).json({
        error: 'AGENT_ROUTER_TOKEN belum diset di Vercel Environment Variables.'
      });
    }

    let body = req.body;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Body request kosong atau invalid.' });
    }

    const prompt = String(body.prompt || '').trim();
    const model = String(body.model || 'gpt-4o-mini').trim();

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt kosong.' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    let response;
    try {
      response = await fetch('https://agentrouter.org/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant. Reply in Indonesian unless the user asks otherwise.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7
        })
      });
    } finally {
      clearTimeout(timeout);
    }

    const raw = await response.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      return res.status(502).json({
        error: 'AgentRouter tidak mengembalikan JSON.',
        status: response.status,
        raw: raw.slice(0, 500)
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || data?.message || 'AgentRouter API error',
        status: response.status,
        detail: data
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      data?.choices?.[0]?.text ||
      data?.message ||
      'No response from AI';

    return res.status(200).json({
      reply,
      usage: data?.usage || null
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Function error: ' + (error?.message || String(error)),
      name: error?.name || 'Error'
    });
  }
  }
