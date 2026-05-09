export default function handler(req, res) {
  return res.status(200).json({
    ok: true,
    hasAgentRouterToken: Boolean(process.env.AGENT_ROUTER_TOKEN),
    tokenPrefix: process.env.AGENT_ROUTER_TOKEN
      ? process.env.AGENT_ROUTER_TOKEN.slice(0, 6) + '...'
      : null
  });
}
