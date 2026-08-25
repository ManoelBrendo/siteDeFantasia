# Bosque da Fantasia API

Backend opcional para conta centralizada, arquivos e integracao Amazon. O site funciona com login local mesmo sem este processo rodando.

## Banco de dados local

As contas e os registros de arquivos ficam em `backend/data/bosque-db.json`.
O arquivo usa colecoes separadas para `users` e `files`, mantendo os dados em um unico banco local.
Para zerar as contas criadas, deixe `users` como uma lista vazia.

## Rodar

```bash
npm run api
```

Servidor:

```text
http://127.0.0.1:4180
```

## Frontend com API centralizada

Quando quiser usar conta centralizada, publique este backend em um host separado e informe a base da API antes de carregar `account-api.js`:

```html
<script>
  window.BOSQUE_API_BASE = "https://sua-api.example.com";
</script>
```

Sem essa configuracao, o frontend usa conta local salva apenas no navegador do usuario.

## Rotas

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/files`
- `POST /api/files`
- `GET /api/files/:id`
- `GET /api/amazon/search?q=tolkien`

## Amazon

As chaves devem ficar em variaveis de ambiente. Copie `.env.example` como referencia.

A PA-API exige assinatura AWS SigV4. Este backend ja assina `SearchItems` quando `AMAZON_ACCESS_KEY`, `AMAZON_SECRET_KEY` e `AMAZON_PARTNER_TAG` estiverem definidos.

Como a documentacao atual indica depreciacao da PA-API e migracao para Creators API, a integracao foi isolada em `lib/amazon.mjs` para troca futura sem mexer no frontend.
