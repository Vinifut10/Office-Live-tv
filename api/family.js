module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  try {
    const headers = { "content-type": "application/json" };
    const session = req.headers["x-family-session"];
    if (session) headers["x-family-session"] = session;
    const upstream = await fetch("https://oikcupbvshhzorxkbxsk.supabase.co/functions/v1/family-api", {
      method: "POST",
      headers,
      body: typeof req.body === "string" ? req.body : JSON.stringify(req.body || {})
    });
    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    return res.send(body);
  } catch (e) {
    return res.status(502).json({ error: "Falha de conexão com o serviço." });
  }
};