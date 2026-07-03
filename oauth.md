# Sign in with Capibara (OAuth)

> Les deux grants OAuth réels de Capibara — client_credentials serveur-à-serveur et authorization_code + PKCE avec écran de consentement — séquences curl complètes.
> Catégorie : API & intégration · mis à jour le 2026-07-02 · plateforme v1

## Deux grants, deux usages

Capibara expose un fournisseur OAuth 2.0 maison (JWT HMAC-SHA256, sans
dépendance externe) avec **deux grants réellement fonctionnels** :

| Grant | Usage | Nécessite un utilisateur ? |
|---|---|---|
| `client_credentials` | Votre backend appelle l'API pour son propre compte (tâches de fond, synchronisation). | non |
| `authorization_code` + PKCE | « Se connecter avec Capibara » — un utilisateur autorise votre application à agir en son nom. | oui, avec écran de consentement |

Les deux grants émettent le même type de jeton : un JWT compact signé
HS256, valable **1 heure** (`expires_in: 3600`). Ce jeton est **opaque pour
vous** : vous pouvez le décoder pour en lire l'expiration, mais vous ne
pouvez pas vérifier sa signature (elle est scellée avec un secret serveur) —
utilisez-le tel quel comme `Authorization: Bearer <token>`, il n'y a ni
endpoint d'introspection ni JWKS public à ce stade.

**Débit limité** : `POST /api/oauth/token` accepte au plus **30 requêtes par
5 minutes par IP appelante** ; au-delà, `429` avec un en-tête
`Retry-After: 300`.

---

## Créer un client OAuth

Depuis `/dev/keys`, section « Clients OAuth » :

| Champ | Contrainte |
|---|---|
| Nom | 2 à 80 caractères — affiché à l'utilisateur sur l'écran de consentement. |
| URLs de redirection | jusqu'à 10, chacune une URL absolue valide. Doivent correspondre **exactement** à l'URL utilisée dans la requête d'autorisation. |
| Scopes | sous-ensemble de : `crm:read`, `crm:write`, `shop:read`, `shop:write`, `billing:read`, `site:read`, `media:read`. |

La création renvoie un `client_id` (`cid_…`) et un `client_secret`
(`csec_…`) affichés **une seule fois** — seul le hash du secret est
conservé côté serveur. Notez-les tout de suite dans votre gestionnaire de
secrets.

---

## Grant `client_credentials` (serveur-à-serveur)

```
POST https://capibara.fr/api/oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "cid_VOTRE_CLIENT_ID",
  "client_secret": "csec_VOTRE_CLIENT_SECRET",
  "scope": "crm:read shop:read"
}
```

Réponse (`200`) :

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "crm:read shop:read"
}
```

`scope` est optionnel dans la requête : si omis, le jeton reçoit tous les
scopes déjà accordés au client. S'il est fourni, seule l'**intersection**
entre les scopes demandés et ceux du client est accordée — demander un scope
que le client ne possède pas ne provoque pas d'erreur, il est simplement
absent du jeton final.

Le corps peut aussi être envoyé en `application/x-www-form-urlencoded`
(format historique OAuth) — les deux formats sont acceptés par l'endpoint.

---

## Grant `authorization_code` + PKCE (connexion utilisateur)

PKCE (`S256` uniquement — `plain` est refusé) est **obligatoire**, y
compris pour un client confidentiel : c'est la seule méthode de preuve de
possession acceptée par cet endpoint.

### 1. Générez un `code_verifier` et son `code_challenge`

```js
const crypto = require('node:crypto');

const codeVerifier = crypto.randomBytes(32).toString('base64url');
const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
```

Conservez `codeVerifier` en mémoire côté serveur (associé à la session de
l'utilisateur qui démarre le flux) — vous en aurez besoin à l'étape 4.

### 2. Redirigez l'utilisateur vers l'autorisation

```
GET https://capibara.fr/api/oauth/authorize
  ?response_type=code
  &client_id=cid_VOTRE_CLIENT_ID
  &redirect_uri=https%3A%2F%2Fmon-app.example%2Foauth%2Fcallback
  &scope=crm%3Aread%20shop%3Aread
  &state=UN_JETON_ANTI_CSRF_ALEATOIRE
  &code_challenge=LE_CODE_CHALLENGE_CALCULE
  &code_challenge_method=S256
```

Validations effectuées par cet endpoint avant de continuer : `response_type`
doit valoir `code`, `client_id`/`redirect_uri`/`code_challenge` sont
requis, `code_challenge_method` doit être `S256`, le client doit exister et
`redirect_uri` doit correspondre **exactement** à l'une de ses URLs
enregistrées. Les scopes accordés sont réduits à l'intersection avec ceux du
client, silencieusement (pas d'erreur si vous en demandez un de trop).

Si tout est valide, l'utilisateur est redirigé vers l'écran de consentement
Capibara (`/oauth/consent`) — connecté d'abord si nécessaire.

### 3. L'utilisateur autorise (ou refuse)

L'écran de consentement affiche le nom de votre application, votre nom de
développeur, et la liste des scopes demandés en clair (ex. `crm:read`). Deux
issues :

- **Refus** → redirection vers `redirect_uri?error=access_denied&state=…`.
- **Acceptation** → un code d'autorisation à usage unique est généré (valable
  **10 minutes**), et l'utilisateur est redirigé vers :
  `redirect_uri?code=UN_CODE&state=…`

### 4. Échangez le code contre un jeton

```
POST https://capibara.fr/api/oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "LE_CODE_RECU_SUR_VOTRE_REDIRECT_URI",
  "client_id": "cid_VOTRE_CLIENT_ID",
  "redirect_uri": "https://mon-app.example/oauth/callback",
  "code_verifier": "LE_CODE_VERIFIER_DE_L_ETAPE_1"
}
```

Réponse (`200`) — identique en forme à celle du grant `client_credentials` :

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "crm:read shop:read"
}
```

> **Note.** Cet échange ne demande **pas** `client_secret` : la preuve de
> possession repose uniquement sur `code_verifier` (PKCE), ce qui permet à
> ce même grant de fonctionner pour une application qui ne peut pas garder un
> secret confidentiel (mobile, SPA). Le code est vérifié sur `client_id`,
> `redirect_uri` (doit correspondre exactement à celui de l'étape 2) et
> `code_verifier` (son empreinte SHA-256 doit correspondre au
> `code_challenge` envoyé à l'étape 2) ; il est **consommé** au premier
> échange réussi — le réutiliser renvoie `invalid_grant`.

---

## Erreurs standard renvoyées

| HTTP | `error` | Quand |
|---|---|---|
| 400 | `invalid_request` | paramètre requis manquant (ex. `code_challenge`, `client_secret`). |
| 400 | `invalid_client` | `client_id`/`client_secret` incorrects, ou client inconnu. |
| 400 | `invalid_grant` | code d'autorisation expiré, déjà consommé, ou ne correspondant pas au `client_id`/`redirect_uri`/`code_verifier` fournis. |
| 400 | `unsupported_response_type` | `response_type` ≠ `code` sur `/api/oauth/authorize`. |
| 400 | `unsupported_grant_type` | `grant_type` ni `client_credentials` ni `authorization_code`. |
| 400 | `access_denied` (en paramètre de redirection, pas de code HTTP) | l'utilisateur a refusé le consentement. |
| 429 | `rate_limited` | plus de 30 requêtes/5 min sur `/api/oauth/token` depuis la même IP. En-tête `Retry-After` fourni. |

---

## Utiliser le jeton obtenu

Quel que soit le grant, le jeton s'utilise identiquement contre l'[API
publique](/dev/docs/api-publique) :

```
GET https://capibara.fr/api/public/v1/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.…
```
