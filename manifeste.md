# Référence du manifeste add-on.json

> Chaque champ du manifeste add-on.json : type, contrainte exacte, règles de tarification croisées, erreurs de validation typiques et 3 manifestes complets.
> Catégorie : Référence · mis à jour le 2026-07-02 · plateforme v1

## Le fichier add-on.json

`add-on.json` est l'unique fichier de configuration d'un add-on Capibara. Il
est validé par un schéma **strict** : tout champ de premier niveau qui n'est
pas listé ci-dessous est **refusé** (pas ignoré silencieusement — la
validation échoue avec la liste des clés inconnues). Ce document reflète
exactement le validateur serveur ; le portail utilise le même schéma pour la
complétion et la validation en direct dans l'éditeur de code.

### Champs de premier niveau

| Champ | Type | Obligatoire | Contrainte |
|---|---|---|---|
| `key` | string | oui | `^[a-z0-9](?:[a-z0-9-]{1,48}[a-z0-9])?$` — kebab-case, 3 à 50 caractères en pratique (imposé à la création du projet). **Immuable** : doit rester identique à la `key` du projet sur toute nouvelle version. |
| `name` | string | oui | 2 à 80 caractères. |
| `version` | string | oui | semver strict `MAJOR.MINOR.PATCH`, avec suffixe de pré-version optionnel (`1.2.0`, `2.0.0-beta.1`). |
| `author` | objet | oui | cf. [author](#author). |
| `compatibility` | objet | oui | cf. [compatibility](#compatibility). |
| `permissions` | string[] | non (défaut `[]`) | format `resource:action` — cf. [Permissions et consentement du tenant](/dev/docs/permissions). |
| `capabilities` | string[] | non (défaut `[]`) | sous-ensemble de la liste blanche — cf. [Capabilities et quotas d'exécution](/dev/docs/capabilities). |
| `contributes` | objet | non | points d'extension déclaratifs — cf. [contributes](#contributes). |
| `pricing` | objet | oui | cf. [pricing](#pricing). |
| `i18n` | objet | oui | cf. [i18n](#i18n). |
| `support` | objet | non | cf. [support](#support). |

---

### `author`

| Champ | Type | Obligatoire | Contrainte |
|---|---|---|---|
| `author.name` | string | oui | 1 à 80 caractères. Nom affiché. |
| `author.devAccountSlug` | string | oui | 1 à 40 caractères. **Doit être exactement** le slug de votre compte développeur (celui de `developer.capibara.fr/@<slug>`) — sinon le serveur refuse l'enregistrement avec le message `author.devAccountSlug doit être "<votre-slug>"`. |

---

### `compatibility`

| Champ | Type | Obligatoire | Contrainte |
|---|---|---|---|
| `compatibility.colibri` | string | oui | non vide — plage de version de plateforme requise (ex. `">=1.0"`). |
| `compatibility.modules` | string[] | non (défaut `[]`) | clés des modules qui doivent être **actifs chez le tenant** pour que l'add-on ait un sens (ex. `["crm"]`, `["billing-fr"]`). N'active rien tout seul : c'est une condition affichée/vérifiée, pas une activation automatique. |

> **Note de nommage.** Le champ s'appelle `compatibility.colibri` (et non
> `capibara`) : c'est un vestige du nom du moteur technique interne de la
> plateforme. Il désigne bien la version de **Capibara** — écrivez-le tel
> quel dans votre manifeste, la clé ne change pas.

---

### `permissions`

Tableau de chaînes au format `resource:action`, validées par
`^[a-z][a-z0-9-]*:(read|write|delete|admin)$`. Documentation complète —
ressources disponibles, consentement du tenant, bonnes pratiques — dans
[Permissions et consentement du tenant](/dev/docs/permissions).

---

### `capabilities`

Tableau de chaînes, chacune soit dans la liste blanche fixe (`storage.tenant.ro`,
`storage.tenant.rw`, `ui.block`, `ui.menu`, `ui.widget`, `ui.settings`,
`ai.tool`, `events.subscribe`), soit de la forme `http.fetch:<domaine>` avec
un domaine pleinement qualifié (`^http\.fetch:[a-z0-9.-]+\.[a-z]{2,}$`, ex.
`http.fetch:api.example.com`). Détail de chaque capability et des quotas
associés dans [Capabilities et quotas d'exécution](/dev/docs/capabilities).

---

### `contributes`

Points d'extension, tous optionnels. Deux familles :

**Typées et MONTÉES dès l'installation (mode hybride)** — votre page HTTPS
est embarquée côté tenant dans une iframe isolée, avec un jeton de contexte
signé `?capibara_token=<jwt>` que votre backend résout via
`GET /api/public/v1/embed-context` (cf. [API publique](/dev/docs/api-publique)) :

`contributes.menuEntries` (max 5, capability `ui.menu` requise) — chaque
entrée apparaît dans la navigation du tenant et ouvre votre page :

| Champ | Type | Règle |
|---|---|---|
| `key` | string | kebab-case, unique dans l'add-on, IMMUABLE (devient le segment d'URL `/apps/<add-on>/<key>`). |
| `label` | string | 2-40 caractères. |
| `labelI18n` | objet | optionnel — `{ fr?, en?, es?, de? }` (≤ 40 caractères chacun). |
| `embedUrl` | string | **HTTPS obligatoire**, domaine public (jamais d'IP ni de localhost), ≤ 500 caractères. |
| `icon` | string | optionnel — nom d'icône Lucide kebab-case (défaut : `puzzle`). |

`contributes.widgets` (max 5, capability `ui.widget` requise) — même modèle
pour un widget du tableau de bord d'accueil : `{ key, title (2-60),
embedUrl, minHeight? (120-1200 px) }`. Les utilisateurs du tenant l'ajoutent
depuis « Personnaliser » sur leur accueil (rubrique Add-ons du sélecteur) ;
il se rend dans la même iframe isolée avec le même jeton de contexte.

Exemple complet :

```json
{
  "capabilities": ["ui.menu"],
  "contributes": {
    "menuEntries": [
      {
        "key": "tableau",
        "label": "Tableau de bord",
        "labelI18n": { "en": "Dashboard" },
        "embedUrl": "https://app.votre-domaine.com/capibara",
        "icon": "gauge"
      }
    ]
  }
}
```

Votre page reçoit `?capibara_token=…` et s'affiche dans une iframe
`sandbox` **sans** `allow-same-origin` : elle ne peut ni lire les cookies
Capibara ni toucher le DOM parent — concevez-la comme une page autonome.

**Encore libres (typage à l'ouverture de leur montage)** — enregistrées et
examinées en review, pas encore montées :

| Clé | Nécessite la capability |
|---|---|
| `settingsSections` | `ui.settings` |
| `siteBuilderBlocks` | `ui.block` |
| `aiTools` | `ai.tool` |

---

### `pricing`

| Champ | Type | Règle |
|---|---|---|
| `pricing.model` | `'free' \| 'one_time' \| 'subscription'` | obligatoire. |
| `pricing.amountEur` | number | requis et `> 0` dès que `model` ≠ `free` ; interdit (doit être absent ou 0) quand `model = free`. |
| `pricing.trialDays` | integer 0–30 | autorisé **uniquement** quand `model = subscription`. Sur `one_time`, le renseigner est une erreur. |

Trois combinaisons valides, aucune autre :

| `model` | `amountEur` | `trialDays` |
|---|---|---|
| `free` | absent | interdit |
| `one_time` | `> 0` requis | interdit |
| `subscription` | `> 0` requis | optionnel, 0–30 |

Le prix est saisi en euros ; au lancement, la conversion multi-devise au
paiement est gérée par Stripe selon le pays du payeur. Le partage de revenu
qui s'applique à ce prix est détaillé dans [Revenus et
rev-share](/dev/docs/revenus).

---

### `i18n`

| Champ | Type | Obligatoire | Contrainte |
|---|---|---|---|
| `i18n.fr` | string | oui | 1 à 120 caractères — la baseline utilisée comme accroche par défaut de la fiche marketplace. |
| `i18n.en` | string | oui | 1 à 120 caractères. |
| `i18n.es` | string | non | ≤ 120 caractères. |
| `i18n.de` | string | non | ≤ 120 caractères. |

`fr` et `en` sont la **baseline obligatoire** — un manifeste sans l'une des
deux est invalide, même si le reste est correct.

---

### `support`

| Champ | Type | Contrainte |
|---|---|---|
| `support.email` | string | format e-mail valide. |
| `support.docsUrl` | string | URL valide (`http(s)://…`). |

Non obligatoire au sens du schéma, mais **fortement attendu en review** : un
add-on sans e-mail de support est plus difficile à faire approuver, et bloque
la fonctionnalité « Contacter le développeur » que voit un tenant qui a
installé votre add-on.

---

## Erreurs de validation courantes

| Message renvoyé | Cause | Correction |
|---|---|---|
| `Identifiant invalide (a-z, 0-9, tirets ; 3 à 50 caractères).` | `key` ne respecte pas le format kebab-case, ou commence/finit par un tiret. | Utilisez uniquement minuscules, chiffres et tirets internes (ex. `crm-segments`). |
| `Version semver invalide (ex. 1.2.0).` | `version` n'est pas au format `MAJOR.MINOR.PATCH`. | `1.0.0`, pas `v1.0` ni `1.0`. |
| `Permission invalide (format resource:action).` | Une entrée de `permissions` ne suit pas `resource:action`. | `crm:read`, pas `crm.read` ni `read-crm`. |
| `Capability inconnue (ou domaine http.fetch manquant/mal formé).` | Une entrée de `capabilities` n'est ni dans la liste blanche, ni un `http.fetch:<domaine>` valide. | Vérifiez l'orthographe exacte (`ui.widget`, pas `ui.widgets`) ou complétez le domaine (`http.fetch:api.example.com`, pas `http.fetch:` seul). |
| `Montant > 0 requis pour un add-on payant.` | `pricing.model` ≠ `free` mais `amountEur` absent ou ≤ 0. | Renseignez `amountEur`. |
| `Un add-on gratuit ne doit pas avoir de montant.` | `pricing.model = free` avec un `amountEur` > 0. | Retirez `amountEur`, ou changez `model`. |
| `Les essais ne s'appliquent qu'aux abonnements.` | `trialDays` renseigné avec `model = one_time`. | Retirez `trialDays`, ou passez en `subscription`. |
| `Baseline FR obligatoire` / `Baseline EN obligatoire` | `i18n.fr` ou `i18n.en` vide. | Renseignez une phrase courte dans les deux langues. |
| Erreur de type « clé non reconnue » sur le manifeste | Un champ de premier niveau ne fait pas partie de la liste (le schéma est strict). | Retirez le champ, ou vérifiez l'orthographe (`compatibility`, pas `compatibilities`). |
| `Le champ "key" doit rester "<clé du projet>" (immuable).` | Le `key` du manifeste ne correspond plus à celui du projet créé sur le portail. | Remettez la `key` d'origine — pour changer d'identifiant, créez un nouveau projet. |
| `author.devAccountSlug doit être "<votre-slug>".` | `author.devAccountSlug` ne correspond pas à votre compte développeur. | Copiez exactement votre slug depuis le tableau de bord du portail. |
| `La version X est déjà REVIEW/APPROVED/PUBLISHED et ne peut être modifiée. Incrémentez la version.` | Vous tentez de réenregistrer un brouillon sur un `version` déjà engagé dans le cycle. | Changez `version` (ex. `0.1.0` → `0.1.1`) avant d'enregistrer. |

---

## Trois exemples de manifestes complets

### 1. Gratuit, avec interface (widget)

```json
{
  "key": "crm-segments",
  "name": "Segments avancés CRM",
  "version": "0.1.0",
  "author": { "name": "Atelier TS", "devAccountSlug": "atelier-ts" },
  "compatibility": { "colibri": ">=1.0", "modules": ["crm"] },
  "permissions": ["crm:read"],
  "capabilities": ["ui.widget"],
  "contributes": {
    "widgets": [
      {
        "key": "crm-segments-summary",
        "titleI18n": { "fr": "Mes segments", "en": "My segments" },
        "size": "md"
      }
    ]
  },
  "pricing": { "model": "free" },
  "i18n": {
    "fr": "Segmentez vos contacts CRM en un clic.",
    "en": "Segment your CRM contacts in one click."
  },
  "support": { "email": "support@atelier-ts.example" }
}
```

### 2. Payant, abonnement avec essai

```json
{
  "key": "devis-relance-auto",
  "name": "Relances automatiques de devis",
  "version": "1.2.0",
  "author": { "name": "Studio Forge", "devAccountSlug": "studio-forge" },
  "compatibility": { "colibri": ">=1.0", "modules": ["billing-fr"] },
  "permissions": ["billing:read"],
  "capabilities": ["events.subscribe", "ui.settings"],
  "contributes": {
    "settingsSections": [
      {
        "key": "devis-relance-auto",
        "titleI18n": { "fr": "Relances de devis", "en": "Quote follow-ups" }
      }
    ]
  },
  "pricing": { "model": "subscription", "amountEur": 9, "trialDays": 14 },
  "i18n": {
    "fr": "Relance automatiquement vos devis non signés après 3, 7 et 14 jours.",
    "en": "Automatically follows up on unsigned quotes after 3, 7 and 14 days."
  },
  "support": {
    "email": "support@studio-forge.example",
    "docsUrl": "https://studio-forge.example/docs/devis-relance"
  }
}
```

### 3. Intégration hybride avec appel réseau sortant (`http.fetch`)

```json
{
  "key": "sync-compta-externe",
  "name": "Synchronisation comptable externe",
  "version": "0.3.1",
  "author": { "name": "Studio Forge", "devAccountSlug": "studio-forge" },
  "compatibility": { "colibri": ">=1.0", "modules": ["accounting"] },
  "permissions": ["billing:read"],
  "capabilities": ["http.fetch:api.moncompta-externe.example", "events.subscribe"],
  "pricing": { "model": "one_time", "amountEur": 49 },
  "i18n": {
    "fr": "Exporte vos écritures comptables vers un logiciel tiers via API.",
    "en": "Exports your accounting entries to a third-party tool via API."
  },
  "support": { "email": "support@studio-forge.example" }
}
```

Cet add-on illustre le modèle **hybride** : son vrai travail (l'appel vers
`api.moncompta-externe.example`) tourne dans **votre** backend, qui
s'authentifie séparément auprès de Capibara via une clé API ou OAuth — cf.
[API publique](/dev/docs/api-publique). Le `http.fetch` déclaré ici documente
l'intention pour la review ; il ne remplace pas votre propre infrastructure
réseau tant que l'exécution hébergée n'est pas active.
