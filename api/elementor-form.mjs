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
const COR = '#5E4352'; // --e-global-color-primary do site
const PACIENTE = ['name', 'cpf', 'cel', 'accept'];

// "total_respondidas" → "Total respondidas"; true/false → Sim/Não
const rotulo = k => (k.charAt(0).toUpperCase() + k.slice(1)).replace(/_/g, ' ');
const valor = v => (v === true ? 'Sim' : v === false ? 'Não' : v === null || v === '' ? '—' : String(v));
const ehObjeto = v => v && typeof v === 'object';
const json = v => { try { const o = JSON.parse(v); return ehObjeto(o) ? o : null; } catch { return null; } };

const linha = (k, v, destaque) =>
  `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;color:#7A7A7A;width:40%;vertical-align:top">${esc(k)}</td>` +
  `<td style="padding:8px 12px;border-bottom:1px solid #eee;color:#343536;${destaque ? 'font-weight:bold;' : ''}white-space:pre-wrap">${esc(v)}</td></tr>`;
const tabela = rows => `<table width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;font-size:14px">${rows.join('')}</table>`;
const secao = (titulo, corpo) =>
  `<h3 style="margin:28px 0 8px;font-size:15px;color:${COR};text-transform:uppercase;letter-spacing:.5px">${esc(titulo)}</h3>${corpo}`;

// Resultado em JSON: campos simples viram o resumo (em destaque); objetos aninhados viram tabelas próprias.
function resultadoHtml(obj) {
  const simples = Object.entries(obj).filter(([, v]) => !ehObjeto(v));
  const blocos = Object.entries(obj).filter(([kk, v]) => ehObjeto(v) && !/^\d+$/.test(kk));
  const numerados = Object.entries(obj).filter(([kk, v]) => ehObjeto(v) && /^\d+$/.test(kk)); // ex.: linhas do teste de atenção
  let html = simples.length ? secao('Resumo do resultado', tabela(simples.map(([k, v]) => linha(rotulo(k), valor(v), true)))) : '';
  if (numerados.length) html += secao('Detalhamento', tabela(numerados.map(([kk, v]) =>
    linha(`Item ${kk}`, Object.entries(v).map(([a, b]) => `${rotulo(a)}: ${ehObjeto(b) ? Object.entries(b).map(([x, y]) => `${rotulo(x)} ${valor(y)}`).join(', ') : valor(b)}`).join(' · ')))));
  for (const [k, v] of blocos) {
    const rows = Object.entries(v).map(([kk, vv]) =>
      linha(rotulo(kk), ehObjeto(vv) ? Object.entries(vv).map(([a, b]) => `${rotulo(a)}: ${valor(b)}`).join(' · ') : valor(vv)));
    html += secao(rotulo(k), tabela(rows.length ? rows : [linha('—', 'sem respostas')]));
  }
  return html;
}

// Mesmo conteúdo das tabelas, em texto simples (versão sem HTML do e-mail).
function textoResultado(obj, nivel = 0) {
  return Object.entries(obj).map(([k, v]) => ehObjeto(v)
    ? `${'  '.repeat(nivel)}${/^\d+$/.test(k) ? `Item ${k}` : rotulo(k)}:\n${textoResultado(v, nivel + 1)}`
    : `${'  '.repeat(nivel)}${rotulo(k)}: ${valor(v)}`).join('\n');
}

export function montarEmail(campos) {
  const path = caminho(campos);
  const teste = TESTES[path] ? `Teste ${TESTES[path].replace(/^de /, '')}` : (campos.referer_title || path);
  const nome = campos['form_fields[name]'] || 'Paciente sem nome';
  const quando = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short' });
  const fields = Object.entries(campos).filter(([k]) => k.startsWith('form_fields[')).map(([k, v]) => [k.slice(12, -1).replace(/\]\[.*$/, ''), v]);
  const pac = PACIENTE.filter(id => fields.some(([f]) => f === id))
    .map(id => { const v = fields.find(([f]) => f === id)[1]; return [ROTULOS[id], id === 'accept' ? (v ? 'Sim' : 'Não') : v]; });
  const outros = fields.filter(([f]) => !PACIENTE.includes(f) && fields.find(([g]) => g === f)[1] !== '');

  let resultado = '';
  for (const [id, v] of outros) {
    const o = json(v);
    if (o) resultado += resultadoHtml(o);
    else resultado += secao(rotulo(id), tabela([linha(rotulo(id), v)]));
  }
  if (!resultado) resultado = secao('Resultado', `<p style="color:#7A7A7A">Nenhum resultado foi preenchido neste envio.</p>`);

  const html = `<!doctype html><html><body style="margin:0;background:#f4f1f3;font-family:Arial,Helvetica,sans-serif">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1f3;padding:24px 0"><tr><td align="center">
<table width="640" cellspacing="0" cellpadding="0" style="max-width:640px;width:100%;background:#fff;border-radius:8px;overflow:hidden">
<tr><td style="background:${COR};padding:24px 28px;color:#fff">
<div style="font-family:Georgia,serif;font-size:26px">Vitallmente</div>
<div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.85">Clínica de Saúde Mental</div></td></tr>
<tr><td style="padding:24px 28px">
<div style="font-size:12px;color:#7A7A7A;text-transform:uppercase;letter-spacing:1px">Novo teste recebido · ${esc(quando)}</div>
<h1 style="margin:6px 0 0;font-size:22px;color:#343536">${esc(teste)}</h1>
<div style="font-size:16px;color:${COR};margin-top:4px">${esc(nome)}</div>
${secao('Dados do paciente', tabela(pac.map(([k, v]) => linha(k, v))))}
${resultado}
</td></tr>
<tr><td style="padding:16px 28px;background:#faf8f9;color:#7A7A7A;font-size:12px">Enviado automaticamente pelo site · <a href="${esc(campos.referrer || '')}" style="color:${COR}">${esc(path)}</a><br>Conteúdo confidencial: dados de saúde do paciente.</td></tr>
</table></td></tr></table></body></html>`;

  const text = [`${teste} — ${nome}`, `Recebido em ${quando}`, '', ...pac.map(([k, v]) => `${k}: ${v}`), '',
    ...outros.map(([id, v]) => (json(v) ? textoResultado(json(v)) : `${rotulo(id)}: ${v}`)), '', `Página: ${campos.referrer || path}`].join('\n');
  return { subject: `[Vitallmente] ${teste} — ${nome}`, html, text };
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
  res.setHeader('x-envio', process.env.RESEND_API_KEY ? 'email' : 'simulado'); // conferência do modo em produção
  res.status(200).json(out);
}
