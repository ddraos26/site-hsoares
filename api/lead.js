const REQUIRED_FIELDS = ["nome", "whatsapp", "produto"];
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX = 8;
const rateLimiter = new Map();

function sanitize(value) {
  return String(value ?? "").trim();
}

function normalizePhone(value) {
  return value.replace(/\D/g, "");
}

function isValidPhone(value) {
  const digits = normalizePhone(value);
  return digits.length >= 10 && digits.length <= 13;
}

function getClientIp(req) {
  const forwarded = sanitize(req.headers["x-forwarded-for"]);
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return sanitize(req.socket?.remoteAddress || "unknown");
}

function isRateLimited(ip) {
  const now = Date.now();
  const register = rateLimiter.get(ip);
  if (!register || now - register.start > RATE_WINDOW_MS) {
    rateLimiter.set(ip, { start: now, count: 1 });
    return false;
  }

  register.count += 1;
  rateLimiter.set(ip, register);
  return register.count > RATE_MAX;
}

function isAllowedOrigin(req) {
  const origin = sanitize(req.headers.origin);
  if (!origin) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (
      host === "hsoaresseguros.com.br" ||
      host === "www.hsoaresseguros.com.br" ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".vercel.app")
    ) {
      return true;
    }

    const extraOrigins = sanitize(process.env.ALLOWED_ORIGINS);
    if (!extraOrigins) {
      return false;
    }

    const allowedHosts = extraOrigins
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    return allowedHosts.includes(host);
  } catch {
    return false;
  }
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendEmail(payload) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY não configurada para envio de leads.");
  }

  const toEmail = process.env.LEAD_TO_EMAIL || "rodolfo@hsoaresseguros.com.br";
  const fromEmail = process.env.LEAD_FROM_EMAIL || "H Soares Seguros <onboarding@resend.dev>";

  const lines = [
    ["Nome", payload.nome],
    ["WhatsApp", payload.whatsapp],
    ["E-mail", payload.email || "Não informado"],
    ["Produto", payload.produto],
    ["Prazo", payload.prazo || "Não informado"],
    ["Cidade/UF", payload.cidade || "Não informado"],
    ["Observações", payload.observacoes || "Não informado"],
    ["Origem", payload.origem || "Site H Soares"],
    ["Página", payload.pagina || "Não informada"],
    ["Data", new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })],
  ];

  const htmlRows = lines
    .map(([label, value]) => `<tr><td style=\"padding:8px 10px;border:1px solid #d7e1f6;font-weight:700;background:#f4f8ff;\">${escapeHtml(label)}</td><td style=\"padding:8px 10px;border:1px solid #d7e1f6;\">${escapeHtml(value)}</td></tr>`)
    .join("");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: `Novo lead do site - ${payload.produto}`,
      html: `
        <div style=\"font-family:Segoe UI,Arial,sans-serif;color:#0f1420;\">
          <h2 style=\"margin:0 0 12px;color:#002c8f;\">Nova indicação recebida</h2>
          <p style=\"margin:0 0 16px;\">Lead captado pelo site da H Soares Seguros.</p>
          <table style=\"border-collapse:collapse;width:100%;max-width:700px;\">${htmlRows}</table>
        </div>
      `,
      text: lines.map(([label, value]) => `${label}: ${value}`).join("\n"),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Falha ao enviar e-mail com Resend: ${response.status} ${errorText}`);
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    if (!isAllowedOrigin(req)) {
      return res.status(403).json({ error: "Origem não autorizada." });
    }

    const clientIp = getClientIp(req);
    if (isRateLimited(clientIp)) {
      return res.status(429).json({ error: "Muitas tentativas. Tente novamente em instantes." });
    }

    const payload = {
      nome: sanitize(req.body?.nome),
      whatsapp: sanitize(req.body?.whatsapp),
      email: sanitize(req.body?.email),
      produto: sanitize(req.body?.produto),
      prazo: sanitize(req.body?.prazo),
      cidade: sanitize(req.body?.cidade),
      observacoes: sanitize(req.body?.observacoes),
      empresa_site: sanitize(req.body?.empresa_site),
      origem: sanitize(req.body?.origem),
      pagina: sanitize(req.body?.pagina),
    };

    if (payload.empresa_site) {
      return res.status(200).json({ ok: true });
    }

    const missing = REQUIRED_FIELDS.filter((field) => !payload[field]);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Campos obrigatórios ausentes: ${missing.join(", ")}` });
    }

    if (!isValidPhone(payload.whatsapp)) {
      return res.status(400).json({ error: "WhatsApp inválido." });
    }

    await sendEmail(payload);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Lead API error:", error);
    return res.status(500).json({ error: "Não foi possível enviar seu contato agora." });
  }
};
