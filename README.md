# Bosque da Fantasia

Site estático em HTML, CSS e JavaScript com atmosfera élfica, inspiração celta e acabamento medieval, pensado para apresentar literatura fantástica a quem está começando.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie os arquivos deste projeto para a raiz do repositório.
3. No GitHub, abra `Settings`.
4. Entre em `Pages`.
5. Em `Build and deployment`, escolha:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main`
   - `Folder`: `/ (root)`
6. Salve.
7. Aguarde alguns instantes até o GitHub gerar o link público.

## Estrutura importante

- `index.html`: experiência principal do site, agora com home, autores, estante, busca e painel de compra em uma única página.
- `assets/js/index-page.js`: comportamento da página principal, com recomendações, busca, temas e integração do painel de compra.
- `assets/js/open-library-api.js`: camada de consulta ao acervo da Open Library.
- `assets/js/audio-player.js`: player de trilha sonora com múltiplas faixas.
- `.nojekyll`: evita processamento desnecessário do GitHub Pages.
- `CREDITOS-IMAGENS.md`: origem e licença das imagens e áudios usados.

## Observações

- O projeto funciona sem build e sem dependências externas de instalação.
- O acervo pesquisável usa a Open Library Search API.
- As capas dinâmicas usam a Open Library Covers API.
- O áudio ambiente e algumas imagens dependem de URLs externas, então o visitante precisa estar online para ver e ouvir tudo.
- Navegadores modernos normalmente exigem interação do usuário para liberar o som pela primeira vez.
