# SDK @capibara-dev/sdk

> Le SDK TypeScript officiel : types du manifeste, client API, aides OAuth PKCE et vérification de signature des webhooks — zéro dépendance.
> Catégorie : Référence · mis à jour le 2026-07-02 · plateforme v1

## Statut : disponible (v0.1.0, tarball)

Le SDK est **téléchargeable dès maintenant** en tarball npm :

```bash
# Téléchargement direct
curl -O https://capibara.fr/dev-sdk/capibara-dev-sdk-0.1.0.tgz

# Installation dans votre projet
npm install ./capibara-dev-sdk-0.1.0.tgz
```

La publication sur le registre npm public (`npm i @capibara-dev/sdk`) suivra —
cette page sera mise à jour ; le tarball restera disponible. Zéro dépendance,
compatible Node ≥ 18, navigateurs et workers (`fetch` + WebCrypto).

---

## Ce qu'il contient

- **Types TypeScript du manifeste** (`AddonManifest`, `AddonCapability`,
  `AddonPermission`, `AddonPricing`…) — miroir du schéma Zod qui valide
  `add-on.json` côté plateforme, verrouillé par un test anti-dérive dans
  la CI de Capibara. La validation autoritaire reste celle du portail.
- **`CapibaraClient`** — client typé de l'[API publique](/dev/docs/api-publique) :
  `Bearer` clé API (`ck_live_…`) ou access token OAuth, erreurs typées
  `CapibaraApiError` (statut, corps, `retryAfterSeconds` sur 429), méthode
  `me()` et `request<T>(path)` générique pour les endpoints à venir.
- **Aides OAuth PKCE** — `generateCodeVerifier()`, `codeChallengeS256()`,
  `buildAuthorizeUrl()`, `exchangeAuthorizationCode()`,
  `clientCredentialsToken()` : le flux complet de
  [Sign in with Capibara](/dev/docs/oauth) sans réécrire la cryptographie.
- **`verifyWebhookSignature(rawBody, header, secret)`** — vérification
  HMAC-SHA256 en temps constant des [webhooks sortants](/dev/docs/webhooks)
  (en-tête `x-capibara-signature: sha256=<hex>`), à brancher dans votre
  endpoint de réception.

---

## Exemples

```ts
import { CapibaraClient } from '@capibara-dev/sdk';

const capibara = new CapibaraClient({ token: process.env.CAPIBARA_API_KEY! });
const me = await capibara.me();
console.log(me.developer.slug, me.scopes);
```

```ts
import { verifyWebhookSignature, WEBHOOK_SIGNATURE_HEADER } from '@capibara-dev/sdk';

// Dans votre handler HTTP — TOUJOURS vérifier sur le corps BRUT reçu,
// jamais sur un JSON re-sérialisé (la signature porte sur les octets).
const ok = await verifyWebhookSignature(rawBody, req.headers[WEBHOOK_SIGNATURE_HEADER], secret);
if (!ok) return res.status(401).end();
```

---

## Construire sans le SDK reste possible

Le SDK est un confort, pas un prérequis :

- L'éditeur du portail applique en direct le **même JSON Schema** que les
  types du SDK — vos manifestes sont validés à la même source de vérité.
- L'[API publique](/dev/docs/api-publique) s'appelle avec n'importe quel
  client HTTP (`fetch`, `curl`…).
- Le flux [OAuth PKCE](/dev/docs/oauth) est documenté avec des séquences
  `curl`/Node.js complètes.

Cette documentation (les pages du hub + les endpoints `llms.txt` décrits
dans [Utiliser cette doc avec votre IA](/dev/docs/llm)) est conçue pour
suffire, avec l'aide d'un assistant IA si vous le souhaitez, à construire un
add-on complet.
