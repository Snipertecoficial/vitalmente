// Substitui o /wp-admin/admin-ajax.php do WordPress para o envio dos formulários Elementor.
// Com RESEND_API_KEY definida, envia cada teste por e-mail para a clínica; sem ela, só simula o sucesso.

// Páginas cujo original não tem o popup 1494 ("Teste enviado com sucesso"): recebem a mensagem inline.
const SEM_POPUP = ['/teste-tea/', '/experiencia-emocionais/', '/adi-r/'];
const MENSAGEM = 'Teste enviado com sucesso. Em breve nossa equipe te enviara o resultado';
const ERRO = 'Não conseguimos enviar o teste agora. Tente de novo em instantes ou fale conosco pelo WhatsApp (11) 91773-8711.';
const WHATSAPP = '5511917738711'; // mesmo número de tools/mirror.py (TROCAS)
const DESTINO = 'vitallmenteclinica@gmail.com';
const REMETENTE = 'Site Vitallmente <onboarding@resend.dev>'; // trocar por endereço do domínio quando ele for verificado no Resend
const TESTES = {
  '/teste-gravidade-depressiva/': 'de Depressão (BDI-II)',
  '/teste-gravidade-de-desesperanca/': 'de Desesperança',
  '/teste-vitallmente-gravidade-ansiosa/': 'de Ansiedade',
  '/teste-impulsividade/': 'de Impulsividade (ESAVI)',
  '/teste-vitallmente-responsabilidade-social/': 'SRS-2',
  '/teste-tea/': 'SRS-2 infantil',
  '/teste-tdah/': 'de TDAH (ASRS)',
  '/teste-memoria-operacional/': 'de Memória Operacional (MVPT)',
  '/teste-raciocinio/': 'de Raciocínio (TRL)',
  '/teste-atencao/': 'de Atenção (AOL)',
  '/anamnese-1/': 'de Anamnese',
  '/anamnese-2/': 'de Anamnese',
  '/vineland-3/': 'Vineland-3',
  '/experiencia-emocionais/': 'BOLIE',
  '/vivencias-mocionais/': 'BOLIE QOE',
  '/torre-de-londres/': 'Torre de Londres',
  '/flexibilidade-cognitiva/': 'CPT-Flex',
  '/avaliacao-comportamento/': 'ADOS-2',
  '/adi-r/': 'ADI-R',
  '/swyc/': 'SWYC',
};
const ROTULOS = { name: 'Nome completo (paciente)', cpf: 'CPF (paciente)', cel: 'Celular (paciente ou responsável)', accept: 'Aceitou os termos de uso' };

// Corpo multipart do Elementor → { campo: valor } (campos repetidos são unidos por ", ").
export async function lerCampos(body, contentType) {
  const fd = await new Response(body, { headers: { 'content-type': contentType || '' } }).formData();
  const campos = {};
  for (let [k, v] of fd.entries()) {
    if (typeof v !== 'string') continue;
    v = v.replace(/\r\n/g, '\n'); // multipart converte quebras de linha em CRLF
    campos[k] = k in campos ? `${campos[k]}, ${v}` : v;
  }
  return campos;
}

function caminho(campos) {
  try { return new URL(campos.referrer).pathname.replace(/\/?$/, '/'); } catch { return '/'; }
}

export function whatsappUrl(path) {
  const teste = TESTES[path] ? ` ${TESTES[path]}` : '';
  return `https://api.whatsapp.com/send?phone=${WHATSAPP}&text=${encodeURIComponent(`Olá! Acabei de finalizar o teste${teste}.`)}`;
}

// JSON que o Elementor espera em caso de sucesso, ou null se não for envio de formulário.
export function resposta(campos) {
  if (campos.action !== 'elementor_pro_forms_send_form') return null;
  const path = caminho(campos);
  const data = { redirect_url: whatsappUrl(path) }; // o Elementor redireciona sozinho (handler form_destruct)
  if (SEM_POPUP.includes(path)) return { success: true, data: { message: MENSAGEM, data } };
  return { success: true, data: { message: '', data: { ...data, popup: { action: 'open', id: '1494' } } } };
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

export function montarEmail(campos) {
  const path = caminho(campos);
  const teste = TESTES[path] ? `Teste ${TESTES[path].replace(/^de /, '')}` : (campos.referer_title || path);
  const linhas = Object.entries(campos)
    .filter(([k]) => k.startsWith('form_fields['))
    .map(([k, v]) => { const id = k.slice(12, -1).replace(/\]\[.*$/, ''); return [ROTULOS[id] || id, v]; });
  linhas.push(['Página', campos.referrer || path], ['Enviado em', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })]);
  const nome = campos['form_fields[name]'] || 'sem nome';
  return {
    subject: `${teste} — ${nome}`,
    text: linhas.map(([k, v]) => `${k}:\n${v}`).join('\n\n'),
    html: `<h2>${esc(teste)}</h2><table cellpadding="6" border="1" style="border-collapse:collapse">${linhas
      .map(([k, v]) => `<tr><th align="left" valign="top">${esc(k)}</th><td style="white-space:pre-wrap">${esc(v)}</td></tr>`).join('')}</table>`,
  };
}

async function enviarEmail(email) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: REMETENTE, to: [DESTINO], ...email }),
  });
  if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
}

export default async function handler(req, res) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const campos = req.method === 'POST' ? await lerCampos(Buffer.concat(chunks), req.headers['content-type']).catch(() => ({})) : {};
  const out = resposta(campos);
  if (!out) return res.status(400).send('0'); // igual ao WordPress para ação desconhecida
  if (process.env.RESEND_API_KEY) {
    try {
      await enviarEmail(montarEmail(campos));
    } catch (e) {
      console.error('envio falhou', e); // o teste não pode sumir em silêncio
      return res.status(200).json({ success: false, data: { message: ERRO, errors: [], data: [] } });
    }
  } else {
    console.warn('RESEND_API_KEY ausente: envio só simulado');
  }
  res.status(200).json(out);
}
