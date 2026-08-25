# Levantamento de requisitos e funcionalidades

Este documento organiza o que o Bosque da Fantasia entrega hoje, o que cada funcionalidade faz por dentro e quais requisitos devem ser conferidos a cada nova implementacao.

## Visao do produto

O Bosque da Fantasia e uma experiencia web/PWA para orientar leitores iniciantes e curiosos em literatura fantastica. O site combina curadoria editorial, busca em acervo aberto, recomendacao por afinidade, glossario, favoritos locais, login e modo offline.

## Personas principais

- Leitor iniciante: quer descobrir por onde comecar sem se perder em catalogos longos.
- Leitor explorador: pesquisa autores, temas, criaturas e atmosferas para montar uma trilha propria.
- Administrador/editor: precisa manter dados editoriais, autores, temas, textos e links confiaveis.
- Operador tecnico: precisa publicar, validar e conectar backend/API sem quebrar o site estatico.

## Funcionalidades atuais

| Funcionalidade | Arquivos principais | O que faz | Requisitos centrais | Checagem minima |
| --- | --- | --- | --- | --- |
| Portal inicial | `index.html`, `app.js`, `fantasy-effects.js` | Apresenta proposta, secoes e jornada inicial. | Carregar sem backend, navegar por ancoras, manter responsividade. | Abrir desktop/mobile, testar links e console. |
| Autenticacao e conta | `account-api.js`, `account-panel.js`, `backend/lib/auth.mjs` | Login local por padrao e login remoto somente quando API for configurada. | Nao exigir API rodando, limpar sessao no logout, nao enviar token local como bearer. | Login local, cadastro local, logout e API opcional. |
| Acervo pesquisavel | `catalog-api.js`, `open-library-api.js`, `library-db.js` | Busca na Open Library, normaliza metadados e usa cache local. | Ter fallback offline, capa alternativa, paginacao e status de erro. | Buscar termo, carregar mais, simular falha de rede. |
| Filtros avancados | `app.js`, `site-data.js` | Filtra por clima, dificuldade e motivo central. | Mapear para `book.filters`, preservar estado, limpar filtros. | Ativar filtros, estado vazio, limpar. |
| Oraculo de afinidade | `recommendation-engine.js`, `app.js`, `site-data.js` | Calcula trilha de leitura por respostas. | Exigir todas as respostas, pontuar trilhas, iniciar busca sugerida. | Responder, resetar, explorar trilha. |
| Autores | `app.js`, `site-data.js` | Lista autores e ficha editorial do autor ativo. | Cada autor precisa de obras, legado, clima e porta de entrada. | Trocar autor e validar ficha. |
| Glossario | `app.js`, `site-data.js` | Busca termos de apoio e mostra contador. | Buscar por termo/definicao/tags, mostrar vazio util. | Buscar termo existente e inexistente. |
| Relicario | `app.js`, `catalog-api.js`, `library-db.js` | Salva favoritos no navegador. | Favoritos unicos, persistentes e sincronizados na UI. | Guardar/remover livro e recarregar. |
| Ficha de livro | `app.js`, `compra.html`, `assets/js/purchase-page.js` | Mostra capa, descricao, sinais editoriais e link de compra/leitura. | Atualizar ao selecionar livro, proteger link vazio, `alt` adequado. | Clicar livro, verificar ficha e botao. |
| PWA/offline | `pwa.js`, `sw.js`, `manifest.webmanifest` | Instala app, cacheia shell e mostra status de rede. | Nao interceptar `/api/`, versionar cache, funcionar em HTTPS. | Registrar SW, testar offline e status. |
| Audio ambiente | `audio-player.js` | Gera trilha elfica opcional em volume baixo no navegador. | Respeitar autoplay, persistir preferencia, nao depender de arquivo/API externa. | Alternar botao, recarregar e confirmar que pede toque para reativar. |
| Densidade visual global | `index.html` | Reduz altura dos cards e paineis sem remover conteudo. | Usar truncamento visual, grids responsivos, botoes acessiveis e leitura clara no mobile. | Conferir acervo, estante, glossario, autores, oraculo e ficha em desktop/mobile. |
| Navegacao mobile | `index.html`, `app.js` | Compacta o menu principal em telas pequenas. | Botao com `aria-expanded`, fechamento ao tocar em link e menu completo no desktop. | Abrir/fechar menu no celular e navegar para secoes. |
| Filtros mobile | `index.html`, `app.js` | Recolhe filtros no celular para reduzir rolagem inicial. | Manter filtros ativos visiveis, preservar limpar filtros e abrir no desktop. | Alternar painel, aplicar filtro e limpar filtros. |
| Backend legado/local | `backend/server.mjs`, `backend/lib/*.mjs` | API de auth, usuario, arquivos e Amazon. | Health JSON, CORS, hash de senha, payload limitado. | `/api/health`, cadastro, login, `/api/me`. |

## Modelo de requisito por nova funcionalidade

Use este bloco em toda implementacao nova.

```md
### Nome da funcionalidade

Problema:
- Qual dor ou oportunidade resolve?

Usuarios impactados:
- Quem usa ou opera?

Comportamento esperado:
- O que o usuario ve e faz?
- Quais estados existem: vazio, carregando, sucesso, erro, offline?

Funcionamento interno:
- Quais arquivos mudam?
- Quais dados entram, saem ou persistem?
- Usa API, IndexedDB, localStorage, cache, service worker ou arquivo editorial?

Requisitos funcionais:
- RF-001:
- RF-002:

Requisitos nao funcionais:
- Acessibilidade:
- Responsividade:
- Performance:
- Seguranca:
- Offline/degradacao:

Critérios de aceite:
- Dado que..., quando..., entao...

Plano de teste:
- Manual:
- Automatizado:
- Regressao:

Metodo em W:
- W1 Descoberta:
- W2 Desenho:
- W3 Implementacao:
- W4 Verificacao:
- W5 Aprendizado:
```

## Dependencias e riscos

- O login nao depende do backend por padrao. Autenticacao centralizada exige API publicada e configuracao explicita em `window.BOSQUE_API_BASE`.
- Open Library e Wikimedia sao fontes externas; falhas devem degradar para cache, curadoria local ou placeholder.
- Dados locais ficam por navegador; nao devem ser vendidos como conta sincronizada.
- Service worker pode servir cache antigo; sempre incrementar cache quando mudar shell essencial.
- Efeitos visuais podem prejudicar performance se crescerem sem limite; usar `prefers-reduced-motion`.
- Mobile deve usar experiencia visual leve por padrao: sem canvas animado, parallax, particulas, compasso fixo ou bibliotecas de motion nao essenciais.
- Uploads e Amazon dependem do backend; esconder ou degradar controles quando a API estiver indisponivel.
