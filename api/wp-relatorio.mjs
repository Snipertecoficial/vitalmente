// Recebe do WordPress oficial (www.vitallmente.com.br) cada teste enviado e manda o mesmo relatório
// clínico do site novo para a clínica. Chamado pelo código em wp-content/novamira-sandbox/vitallmente-relatorio.php.
import { createHash, timingSafeEqual } from 'node:crypto';
import { montarEmail, NOMES_TESTE } from './_relatorio.mjs';
import { enviarEmail } from './elementor-form.mjs';

// Só a impressão (SHA-256) da chave fica no código público; a chave fica no servidor do WordPress.
const CHAVE_SHA256 = '49771f1c38f1985c26643c9d3b754d9fc1e95f4553d14ec3b18f8d672452e663';
const FIGURAS = 'https://vitalmente-gilt.vercel.app'; // onde as figuras das tarefas estão hospedadas

const confere = chave => {
  const a = createHash('sha256').update(String(chave || '')).digest();
  return timingSafeEqual(a, Buffer.from(CHAVE_SHA256, 'hex'));
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, erro: 'use POST' });
  const { chave, path, campos } = req.body || {};
  if (!confere(chave)) return res.status(403).json({ ok: false, erro: 'chave inválida' });
  if (!NOMES_TESTE[path] || !campos || typeof campos !== 'object') return res.status(400).json({ ok: false, erro: 'teste desconhecido' });
  try {
    await enviarEmail(montarEmail(campos, path, FIGURAS));
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('relatório do WordPress não enviado', e);
    res.status(502).json({ ok: false, erro: 'falha ao enviar o e-mail' });
  }
}
