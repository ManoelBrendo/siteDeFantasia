# Bosque da Fantasia

Site estatico em HTML, CSS e JavaScript com atmosfera elfica, inspiracao celta e acabamento medieval, pensado para apresentar literatura fantastica a quem esta comecando.

## Publicar no GitHub Pages

1. Crie um repositorio no GitHub.
2. Envie os arquivos deste projeto para a raiz do repositorio.
3. No GitHub, abra `Settings`.
4. Entre em `Pages`.
5. Em `Build and deployment`, escolha:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
6. Salve.
7. Aguarde alguns instantes ate o GitHub gerar o link publico.

## Estrutura importante

- `index.html`: experiencia principal do site, com home, autores, estante, Oraculo de Afinidade, busca e painel de compra em uma unica pagina.
- `audio-player.js`: player de trilha sonora com multiplas faixas.
- `index-page.js`: orquestracao principal da pagina, renderizacao, busca, afinidade e painel de compra.
- `open-library-api.js`: consulta ao acervo da Open Library, cache local de buscas e estrategia de capas.
- `site-data.js`: dados fixos do projeto, como livros destacados, temas e trilhas.
- `recommendation-engine.js`: motor de recomendacao do Oraculo de Afinidade.
- `CREDITOS-IMAGENS.md`: origem e licenca das imagens e audios usados.
- `.nojekyll`: evita processamento desnecessario do GitHub Pages.

## Observacoes

- O projeto funciona sem build e sem dependencias externas de instalacao.
- O acervo pesquisavel usa a Open Library Search API.
- As consultas do acervo usam cache local temporario para acelerar pesquisas repetidas e aliviar o carregamento em aparelhos mais modestos.
- As capas dinamicas usam a Open Library Covers API e fallbacks com licenca aberta quando necessario.
- A pagina inclui dados estruturados `schema.org` para descrever o site e os livros em destaque de forma mais tecnica.
- O audio ambiente e algumas imagens dependem de URLs externas, entao o visitante precisa estar online para ver e ouvir tudo.
- Navegadores modernos normalmente exigem interacao do usuario para liberar o som pela primeira vez.
