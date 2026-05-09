async function callAgentRouter({ prompt, model, apiKey }) {
  const response = await fetch('https://agentrouter.org/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
      'Accept': 'application/json',
      'User-Agent': 'AgentRouter-Vercel-App/1.0'
    },
    body: JSON.stringify({
      model: model || 'gpt-5',
      messages: [
        { role: 'system', content: 'You are a helpful assistant. Reply in Indonesian.' },
        { role: 'user', content: prompt || 'Halo, jawab singkat.' }
      ]
    })
  });

  const raw = await response.text();
  let data = null;
  let jsonOk = true;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    jsonOk = false;
  }

  return {
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type'),
    jsonOk,
    data,
    raw: raw.slice(0, 3000)
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Use POST.' });
    }

    const apiKey = process.env.AGENT_ROUTER_TOKEN;
    if (!apiKey) {
      return res.status(500).json({ error: 'AGENT_ROUTER_TOKEN belum diset.' });
    }

    const prompt = String(req.body?.prompt || '').trim();
    const model = String(req.body?.model || 'gpt-5').trim();

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt kosong.' });
    }

    const result = await callAgentRouter({ prompt, model, apiKey });

    if (!result.jsonOk) {
      return res.status(502).json({
        error: 'AgentRouter tidak mengembalikan JSON.',
        hint: 'Cek raw. Biasanya token invalid, endpoint diblokir, model tidak tersedia, atau AgentRouter mengembalikan HTML error page.',
        agentRouterStatus: result.status,
        contentType: result.contentType,
        raw: result.raw
      });
    }

    if (result.status < 200 || result.status >= 300) {
      return res.status(result.status).json({
        error: result.data?.error?.message || result.data?.message || 'AgentRouter error',
        agentRouterStatus: result.status,
        detail: result.data
      });
    }

    return res.status(200).json({
      reply: result.data?.choices?.[0]?.message?.content || result.data?.choices?.[0]?.text || 'No response from AI',
      rawData: result.data
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Function crash: ' + (error?.message || String(error)),
      name: error?.name || 'Error'
    });
  }
}
