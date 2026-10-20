// Substitui o /wp-admin/admin-ajax.php do WordPress para o envio dos formulários Elementor.
// ponytail: fase fake — só devolve "sucesso", não envia nada; trocar por envio de e-mail na fase de formulários.

// Páginas cujo original não tem o popup 1494 ("Teste enviado com sucesso"): recebem a mensagem inline.
const SEM_POPUP = ['/teste-tea/', '/experiencia-emocionais/', '/adi-r/'];
const MENSAGEM = 'Teste enviado com sucesso. Em breve nossa equipe te enviara o resultado';

function campo(body, nome) {
  const m = body.match(new RegExp(`name="${nome}"\\r?\\n\\r?\\n([^\\r\\n]*)`));
  return m ? m[1] : '';
}

// Recebe o corpo multipart enviado pelo Elementor; devolve o JSON que o Elementor espera, ou null.
export function resposta(body) {
  if (campo(body, 'action') !== 'elementor_pro_forms_send_form') return null;
  let path = '/';
  try { path = new URL(campo(body, 'referrer')).pathname.replace(/\/?$/, '/'); } catch {}
  return SEM_POPUP.includes(path)
    ? { success: true, data: { message: MENSAGEM, data: {} } }
    : { success: true, data: { message: '', data: { popup: { action: 'open', id: '1494' } } } };
}

export default async function handler(req, res) {
  let body = '';
  for await (const chunk of req) body += chunk;
  const out = req.method === 'POST' ? resposta(body) : null;
  if (!out) return res.status(400).send('0'); // igual ao WordPress para ação desconhecida
  res.status(200).json(out);
}
