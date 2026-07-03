# API publique

> Authentification Bearer (clé API ou jeton OAuth), l'endpoint /api/public/v1/me, les quotas et les conventions d'erreur de l'API publique Capibara.
> Catégorie : API & intégration · mis à jour le 2026-07-02 · plateforme v1

## Base et authentification

L'API publique est servie sur le domaine principal de l'application :

```
https://capibara.fr/api/public/v1/…
```

Un seul mécanisme d'authentification, deux porteurs possibles dans l'en-tête
`Authorization` :

```
Authorization: Bearer <clé API ck_live_… OU jeton d'accès OAuth>
```

- **Clé API** (`ck_live_…`) — générée depuis `/dev/keys`, section « Clés
  API ». C'est le chemin le plus simple pour un add-on hybride : la clé ne
  change pas tant que vous ne la révoquez pas.
- **Jeton d'accès OAuth** — obtenu via l'un des deux grants décrits dans
  [Sign in with Capibara (OAuth)](/dev/docs/oauth). Valable 1 heure ; à
  renouveler en refaisant le flux (il n'y a pas de `refresh_token` à ce
  stade).

Aucune requête n'aboutit sans l'un des deux : une absence ou une valeur
invalide renvoie `401` avec un en-tête `WWW-Authenticate: Bearer`.

---

## `GET /api/public/v1/me`

Le seul endpoint de la surface publique aujourd'hui — il sert de test
d'authentification et d'identité :

```
GET https://capibara.fr/api/public/v1/me
Authorization: Bearer ck_live_VOTRE_CLE
```

Réponse (`200`) :

```json
{
  "developer": {
    "slug": "studio-forge",
    "displayName": "Studio Forge",
    "partner": false
  },
  "scopes": ["crm:read", "shop:read"],
  "auth": "api_key"
}
```

`auth` vaut `"api_key"` ou `"oauth"` selon le porteur utilisé — utile pour
distinguer vos deux modes d'intégration dans vos propres journaux. `scopes`
reflète exactement ceux de la clé (ou du jeton) utilisé, pas l'ensemble des
scopes possibles.

> Cet endpoint ne coûte pas de quota différent des autres : il compte comme
> n'importe quel appel dans la limite ci-dessous. Utilisez-le pour vérifier
> qu'une intégration est bien configurée avant de construire dessus, pas en
> polling répété.

---

## Scopes disponibles

Le même vocabulaire de scopes s'applique aux clés API et aux clients OAuth :

| Scope | Donne accès à |
|---|---|
| `crm:read` | Lecture des données CRM (contacts, sociétés, opportunités). |
| `crm:write` | Écriture dans le CRM. |
| `shop:read` | Lecture du catalogue et des commandes boutique. |
| `shop:write` | Écriture dans la boutique. |
| `billing:read` | Lecture des factures et devis. |
| `site:read` | Lecture du contenu du site (pages, blocs publiés). |
| `media:read` | Lecture de la médiathèque. |

> **En extension continue.** Cette liste est volontairement resserrée
> aujourd'hui. La surface complète (écriture facturation, projets, support…)
> s'ouvre au rythme de la publication du [SDK `@capibara-dev/sdk`](/dev/docs/sdk),
> qui figera les types et les endpoints par ressource plutôt que de les
> découvrir un par un.

---

## Quotas

**120 requêtes par minute**, par identifiant authentifié — pas par adresse
IP. L'identifiant est votre clé API (ou votre compte développeur, si vous
appelez via OAuth) : plusieurs backends utilisant la même clé partagent le
même quota, et à l'inverse, une même IP appelant pour plusieurs devs ne les
fait pas se gêner entre eux.

Au-delà du quota :

```
HTTP/1.1 429 Too Many Requests
Retry-After: 60
Content-Type: application/json

{ "error": "rate_limited" }
```

Attendez le délai indiqué par `Retry-After` (en secondes) avant de
réessayer — un retry immédiat en boucle prolonge votre propre exclusion sans
bénéfice.

---

## Conventions d'erreur

Toutes les erreurs de l'API publique suivent la même forme : un statut HTTP
adapté et un corps JSON `{ "error": "<code>" }`.

| HTTP | `error` | Sens |
|---|---|---|
| 401 | `unauthorized` | en-tête `Authorization` absent, mal formé, ou clé/jeton invalide. |
| 403 | `forbidden` | authentification valide mais scope insuffisant pour l'action demandée. |
| 404 | `not_found` | ressource absente ou hors de portée du compte authentifié. |
| 429 | `rate_limited` | quota dépassé (voir ci-dessus). |

Construisez votre gestion d'erreurs sur ce contrat plutôt que sur le message
d'erreur (qui peut évoluer) : le champ `error` est la valeur stable.

---

## Et pour le reste de la plateforme ?

Si votre add-on a besoin d'une ressource qui n'est pas encore exposée
publiquement, décrivez le besoin depuis `/dev/support` — la priorité des
prochains endpoints suit les demandes réelles des développeurs du portail,
et sera documentée ici au fur et à mesure de sa sortie.
