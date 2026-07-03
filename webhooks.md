# Webhooks sortants

> Recevez les événements métier (commande, facture, contact…) des organisations qui utilisent votre app : configuration, signature HMAC, retries, idempotence.
> Catégorie : API & intégration · mis à jour le 2026-07-02 · plateforme v1

## Principe

Quand une organisation qui a **installé votre app** déclenche un événement
métier (commande passée, facture payée, devis accepté…), Capibara envoie un
`POST` JSON **signé** à l'URL que vous avez configurée. Vous n'interrogez
plus l'API en boucle : votre backend réagit en temps réel.

Configuration : portail développeur → votre app → onglet **Webhooks** →
« Ajouter un webhook ». Vous choisissez l'URL (HTTPS obligatoire) et les
événements souscrits. Le **secret** est affiché **une seule fois** à la
création — stockez-le immédiatement (variable d'environnement, jamais dans
le code : le scan de review le détecterait).

> 5 webhooks maximum par app. Les adresses IP littérales et les hôtes
> locaux/internes sont refusés.

## Format de livraison

```http
POST /votre/endpoint HTTP/1.1
Content-Type: application/json
User-Agent: Capibara-Webhooks/1.0
x-capibara-signature: sha256=3f5a…e2c1
x-capibara-event: invoice.paid
x-capibara-delivery: 018f3c2e-7b1a-4c5d-9e8f-2a6b4c8d0e1f
```

```json
{
  "id": "018f3c2e-7b1a-4c5d-9e8f-2a6b4c8d0e1f",
  "event": "invoice.paid",
  "occurredAt": "2026-07-02T14:32:05.120Z",
  "tenantId": "cm9x…",
  "data": { "invoiceId": "inv_…", "totalCents": 12050 }
}
```

- `id` (= `x-capibara-delivery`) est **stable à travers les retries** d'une
  même livraison : c'est votre clé d'**idempotence** — si vous l'avez déjà
  traité, répondez 2xx sans retraiter.
- `tenantId` identifie l'organisation émettrice (le même que dans l'API).
- `data` porte les champs métier de l'événement — aucun identifiant interne
  de compte plateforme n'est transmis.

## Vérifier la signature (obligatoire)

Chaque requête est signée **HMAC-SHA256** sur le **corps brut** avec votre
secret : en-tête `x-capibara-signature: sha256=<hex>`. Rejetez (401) toute
requête dont la signature ne correspond pas — sinon n'importe qui pouvant
deviner votre URL peut vous injecter de faux événements.

Avec [@capibara-dev/sdk](/dev/docs/sdk) :

```ts
import { verifyWebhookSignature, WEBHOOK_SIGNATURE_HEADER } from '@capibara-dev/sdk';

// ⚠️ TOUJOURS sur le corps BRUT reçu (string/octets), jamais sur un JSON
// re-sérialisé : la signature porte sur les octets exacts.
const ok = await verifyWebhookSignature(rawBody, req.headers[WEBHOOK_SIGNATURE_HEADER], process.env.CAPIBARA_WEBHOOK_SECRET!);
if (!ok) return res.status(401).end();
```

Sans SDK (Node.js) :

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(rawBody: string, header: string, secret: string): boolean {
  const m = /^sha256=([0-9a-f]{64})$/i.exec(header ?? '');
  if (!m) return false;
  const expected = Buffer.from(m[1], 'hex');
  const actual = createHmac('sha256', secret).update(rawBody, 'utf8').digest();
  return expected.length === actual.length && timingSafeEqual(actual, expected);
}
```

## Accusé de réception, retries, désactivation

- Répondez **2xx en moins de 10 secondes** pour accuser réception. Faites le
  traitement lourd en asynchrone chez vous (queue) — répondez d'abord.
- Toute autre réponse (ou timeout) déclenche des **retries à backoff
  croissant** : 1 min, 5 min, 15 min, 1 h, 3 h, 6 h, 12 h, 24 h.
- Après **8 échecs consécutifs**, la souscription est **désactivée
  automatiquement** et vous êtes prévenu par e-mail. Corrigez votre endpoint
  puis réactivez-la depuis l'onglet Webhooks (le compteur repart à zéro).
- Le bouton **Tester** envoie un ping signé (`"event": "ping"`) immédiat,
  sans pénaliser la souscription.

## Événements disponibles

| Événement | Émis quand… |
|---|---|
| `contact.created` | Un contact est créé (CRM, formulaire du site, import…). |
| `quote.created` / `quote.accepted` | Un devis est créé / accepté. |
| `opportunity.won` | Une opportunité CRM est gagnée. |
| `invoice.created` / `invoice.sent` / `invoice.paid` / `invoice.voided` | Cycle de vie d'une facture. |
| `order.placed` / `order.shipped` | Une commande boutique est passée / expédiée. |
| `product.created` / `product.updated` | Catalogue produit. |
| `stock.low` / `stock.movement.recorded` / `goods.received` | Stock et réceptions. |
| `booking.created` | Une réservation est prise (planning). |
| `employee.created` / `leave.requested` / `leave.approved` | RH. |
| `document.attached` | Un document est attaché à une fiche. |

> Vous ne recevez que les événements des organisations qui ont **installé
> votre app** (installation active) — jamais ceux du reste de la plateforme.

## Bonnes pratiques

- **Idempotence** : déduplicable par `id` (les retries renvoient le même).
- **Ordre non garanti** : datez vos traitements avec `occurredAt`, pas avec
  l'ordre d'arrivée.
- **Secret par webhook** : régénérez-le au moindre doute (l'ancien est
  invalidé immédiatement) et limitez sa diffusion à l'endpoint de réception.
