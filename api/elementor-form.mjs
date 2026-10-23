// Substitui o /wp-admin/admin-ajax.php do WordPress para o envio dos formulários Elementor.
// ponytail: fase fake — só devolve "sucesso", não envia nada; trocar por envio de e-mail na fase de formulários.

// Páginas cujo original não tem o popup 1494 ("Teste enviado com sucesso"): recebem a mensagem inline.
const SEM_POPUP = ['/teste-tea/', '/experiencia-emocionais/', '/adi-r/'];
const MENSAGEM = 'Teste enviado com sucesso. Em breve nossa equipe te enviara o resultado';
const WHATSAPP = '5511917738711'; // mesmo número de tools/mirror.py (TROCAS)
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

function campo(body, nome) {
  const m = body.match(new RegExp(`name="${nome}"\\r?\\n\\r?\\n([^\\r\\n]*)`));
  return m ? m[1] : '';
}

export function whatsappUrl(path) {
  const teste = TESTES[path] ? ` ${TESTES[path]}` : '';
  const texto = `Olá! Acabei de finalizar o teste${teste}.`;
  return `https://api.whatsapp.com/send?phone=${WHATSAPP}&text=${encodeURIComponent(texto)}`;
}

// Recebe o corpo multipart enviado pelo Elementor; devolve o JSON que o Elementor espera, ou null.
export function resposta(body) {
  if (campo(body, 'action') !== 'elementor_pro_forms_send_form') return null;
  let path = '/';
  try { path = new URL(campo(body, 'referrer')).pathname.replace(/\/?$/, '/'); } catch {}
  const data = { redirect_url: whatsappUrl(path) }; // o Elementor redireciona sozinho (handler form_destruct)
  if (SEM_POPUP.includes(path)) return { success: true, data: { message: MENSAGEM, data } };
  return { success: true, data: { message: '', data: { ...data, popup: { action: 'open', id: '1494' } } } };
}

export default async function handler(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;
  const out = req.method === 'POST' ? resposta(body) : null;
  if (!out) return res.status(400).send('0'); // igual ao WordPress para ação desconhecida
  res.status(200).json(out);
}
