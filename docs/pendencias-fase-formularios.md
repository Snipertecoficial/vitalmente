# Pendências para a fase de formulários

**Regra: não publicar o site antes da fase de formulários.** O espelho é estático, sem backend; os envios dependem do WordPress original.

## Páginas com envio via `admin-ajax.php` (30, mantido como no original)

As 20 páginas de formulário (tabela abaixo) mais 10 que carregam o mesmo endpoint na configuração do Elementor/tema. reCAPTCHA v3 (`recaptcha_v3`, chave do original) também depende de domínio/backend.

- /adi-r
- /anamnese-1
- /anamnese-2
- /avaliacao-comportamento
- /avaliacao-online
- /avaliacao
- /avaliacao_meta
- /experiencia-emocionais
- /flexibilidade-cognitiva
- /furo-de-orelha
- /homes
- / (home)
- /politica-de-privacidade
- /privacy-policy
- /psicoterapia
- /swyc
- /terapia-aba
- /teste-atencao
- /teste-gravidade-de-desesperanca
- /teste-gravidade-depressiva
- /teste-impulsividade
- /teste-memoria-operacional
- /teste-raciocinio
- /teste-tdah
- /teste-tea
- /teste-vitallmente-gravidade-ansiosa
- /teste-vitallmente-responsabilidade-social
- /torre-de-londres
- /vineland-3
- /vivencias-mocionais

## Formulários (conferência da Task 4)

`TOTAL_PERGUNTAS` só existe nos testes que o definem em JS (-). Todas as 20 páginas: 1 form, etapas inicializam igual ao original (`tests/steps.mjs`: 20 OK).

| Página | forms | scripts | TOTAL_PERGUNTAS | bytes |
|---|---|---|---|---|
| /teste-gravidade-depressiva/ | 1 | 1 | 21 | 25207 |
| /teste-gravidade-de-desesperanca/ | 1 | 1 | - | 19837 |
| /teste-vitallmente-gravidade-ansiosa/ | 1 | 1 | - | 19510 |
| /teste-impulsividade/ | 1 | 1 | - | 19848 |
| /teste-vitallmente-responsabilidade-social/ | 1 | 1 | - | 23628 |
| /teste-tea/ | 1 | 1 | - | 20222 |
| /teste-tdah/ | 1 | 1 | 18 | 22374 |
| /teste-memoria-operacional/ | 1 | 1 | - | 27082 |
| /teste-raciocinio/ | 1 | 1 | - | 49708 |
| /teste-atencao/ | 1 | 3 | - | 55898 |
| /anamnese-1/ | 1 | 1 | - | 30210 |
| /anamnese-2/ | 1 | 1 | - | 28390 |
| /vineland-3/ | 1 | 1 | - | 61986 |
| /experiencia-emocionais/ | 1 | 1 | - | 22546 |
| /vivencias-mocionais/ | 1 | 1 | - | 23410 |
| /torre-de-londres/ | 1 | 1 | - | 35484 |
| /flexibilidade-cognitiva/ | 1 | 2 | - | 35600 |
| /avaliacao-comportamento/ | 1 | 1 | - | 40266 |
| /adi-r/ | 1 | 1 | - | 40819 |
| /swyc/ | 1 | 1 | - | 42889 |

## Links já quebrados no original (Task 5)

Nenhum: `tests/check_links.py` reportou 0 avisos; nenhum `<a href>` foi alterado.

## Máscaras do teste visual (`tests/mask.txt`)

- `.ti-widget`: widget de terceiros (Trustindex, avaliações) que muda a cada carregamento.
- `iframe`: embeds de terceiros (Maps, GTM) que mudam a cada carregamento.

Sem máscaras adicionais além das iniciais do plano.

## Observações

- Teste de atenção (`/teste-atencao/`): monta as imagens das perguntas em JS a partir de `baseUrl`; foi reescrito para caminho relativo à raiz e as imagens foram espelhadas.
- Bugs do site original mantidos 1:1 (paridade): páginas mobile estouram na horizontal (renderizam com 403px num viewport de 390px, igual ao original).
