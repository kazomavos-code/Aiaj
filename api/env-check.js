export default function handler(req, res) {
  const token = process.env.AGENT_ROUTER_TOKEN || '';
  return res.status(200).json({
    ok: true,
    hasAgentRouterToken: Boolean(token),
    tokenLooksValid: token.startsWith('sk-'),
    tokenPrefix: token ? token.slice(0, 8) + '...' : null
  });
}
