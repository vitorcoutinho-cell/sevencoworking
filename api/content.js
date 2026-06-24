const REPO     = process.env.GH_REPO;
const TOKEN    = process.env.GH_TOKEN;
const PASSWORD = process.env.ADMIN_PASSWORD;
const FILE     = 'content.json';

const ghHeaders = {
  Authorization: `token ${TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
  'Content-Type': 'application/json',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = `https://api.github.com/repos/${REPO}/contents/${FILE}`;

  if (req.method === 'GET') {
    // GET é público — não requer senha

    const r = await fetch(url, { headers: ghHeaders });
    if (!r.ok) return res.status(r.status).json({ error: 'Erro ao ler conteúdo' });
    const data = await r.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'));
    return res.status(200).json({ content, sha: data.sha });
  }

  if (req.method === 'PUT') {
    // PUT requer senha de admin
    const pass = req.headers['x-admin-password'];
    if (!pass || pass !== PASSWORD) {
      return res.status(401).json({ error: 'Senha incorreta.' });
    }
    const { content, sha } = req.body;
    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
    const r = await fetch(url, {
      method: 'PUT',
      headers: ghHeaders,
      body: JSON.stringify({ message: 'Admin: atualiza conteúdo do site', content: encoded, sha }),
    });
    if (!r.ok) {
      const err = await r.json();
      return res.status(r.status).json({ error: err.message });
    }
    const data = await r.json();
    return res.status(200).json({ sha: data.content.sha });
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
