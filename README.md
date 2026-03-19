# Bosque da Fantasia

Site estático em HTML sobre literatura fantástica, pensado para iniciantes e pronto para ser publicado no GitHub Pages.

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
7. Aguarde alguns segundos até o GitHub gerar o link público.

## Estrutura importante

- `index.html`: página principal do site.
- `livros.html`: catálogo com busca por API e rotas temáticas.
- `compra.html`: rota placeholder para o futuro link de compra.
- `.nojekyll`: evita processamento desnecessário do GitHub Pages.
- `CREDITOS-IMAGENS.md`: origem e licença das imagens usadas.
- `assets/js/open-library-api.js`: camada de integração com o catálogo.
- `assets/js/books-page.js`: comportamento da página de livros.
- `assets/js/audio-player.js`: player compartilhado entre as páginas novas.

## Observações

- O site funciona como página estática, sem build e sem dependências.
- As imagens atuais são carregadas por URL a partir do Wikimedia Commons.
- A trilha sonora ambiente também é carregada por URL, oferece seleção entre faixas e precisa de interação do usuário para tocar na maioria dos navegadores.
- O catálogo usa a Open Library Search API para oferecer um acervo grande e pesquisável.
- Se você quiser deixar tudo funcionando até offline, o próximo passo é baixar essas imagens para uma pasta local do projeto e atualizar os caminhos no `index.html`.
