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
    const apiKey = process.env.AGENT_ROUTER_TOKEN;
    if (!apiKey) {
      return res.status(500).json({ error: 'AGENT_ROUTER_TOKEN belum diset.' });
    }

    const model = String(req.body?.model || 'gpt-5').trim();
    const result = await callAgentRouter({
      prompt: 'Halo, jawab hanya dengan kata: OK',
      model,
      apiKey
    });

    return res.status(200).json({
      ok: result.jsonOk && result.status >= 200 && result.status < 300,
      agentRouterStatus: result.status,
      statusText: result.statusText,
      contentType: result.contentType,
      jsonOk: result.jsonOk,
      data: result.data,
      raw: result.raw
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Test crash: ' + (error?.message || String(error)),
      name: error?.name || 'Error'
    });
  }
}
