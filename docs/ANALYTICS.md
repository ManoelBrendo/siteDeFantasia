# Analytics

O front registra eventos em `window.dataLayer` e dispara o evento `bosque:analytics`.
O carregador opcional fica em `analytics.js` e não solicita serviços externos quando a configuração está vazia.

## Google Analytics 4

Configure o bloco `window.BOSQUE_ANALYTICS` no `index.html`:

```html
<script>
    window.BOSQUE_ANALYTICS = { provider: "ga4", id: "G-XXXXXXX" };
</script>
```

Os eventos do Bosque serão enviados automaticamente para o GA4.

## Plausible

Para Plausible, configure:

```html
<script>
    window.BOSQUE_ANALYTICS = { provider: "plausible", domain: "seudominio.com" };
</script>
```

O adaptador envia os mesmos eventos usando `plausible()` quando essa função estiver disponível.

## Eventos principais

- `onboarding_impression`
- `onboarding_primary_click`
- `onboarding_closed`
- `tour_step_view`
- `tour_completed`
- `tour_skipped`
- `search_executed`
- `filter_applied`
- `favorite_toggled`

## Produção

Defina `BOSQUE_JWT_SECRET` com um valor secreto e `BOSQUE_CORS_ORIGIN` com a origem pública do front antes de iniciar a API. O backend recusa o segredo padrão quando `NODE_ENV=production`.
