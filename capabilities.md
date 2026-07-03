# Capabilities et quotas d’exécution

> Chaque capability déclarable dans le manifeste, ce qu'elle autorise, quand la demander, et les quotas de l'exécution hébergée en préparation.
> Catégorie : Référence · mis à jour le 2026-07-02 · plateforme v1

## Capability ou permission ?

Deux champs du manifeste se ressemblent mais répondent à des questions
différentes :

- **`capabilities`** répond à *« à quel type d'extension ou de ressource
  technique votre add-on veut-il accéder ? »* — une entrée de menu, un appel
  réseau sortant, un espace de stockage clé/valeur…
- **`permissions`** répond à *« à quelles données métier du tenant votre
  add-on veut-il accéder ? »* — lire les contacts CRM, écrire des factures…
  Documentation complète : [Permissions et consentement du
  tenant](/dev/docs/permissions).

Un add-on qui affiche un widget lisant des contacts CRM déclare donc
généralement **les deux** : `"capabilities": ["ui.widget"]` et
`"permissions": ["crm:read"]`.

---

## Liste blanche des capabilities

Seules les capabilities explicitement listées ci-dessous (ou un
`http.fetch:<domaine>` bien formé) sont acceptées par le validateur du
manifeste — toute autre valeur est rejetée à l'enregistrement.

| Capability | Autorise | Quand la demander |
|---|---|---|
| `storage.tenant.ro` | Lecture d'un espace de stockage clé/valeur scopé au tenant qui a installé l'add-on. | Votre add-on a besoin de relire une configuration qu'il a écrite précédemment, sans avoir à la redemander à l'utilisateur. |
| `storage.tenant.rw` | Lecture **et** écriture de ce même espace de stockage. | Votre add-on doit mémoriser un réglage, un état, un cache léger propre à ce tenant. |
| `ui.block` | Contribuer un bloc au site builder (constructeur de site/landing). | Votre add-on ajoute un composant visuel que l'utilisateur peut poser sur une page publique de son site. |
| `ui.menu` | Contribuer une entrée dans la navigation latérale — **actif dès aujourd'hui en mode hybride** : votre page HTTPS est montée en iframe isolée via `contributes.menuEntries` (cf. [le manifeste](/dev/docs/manifeste)). | Votre add-on a sa propre page dans l'espace de gestion du tenant. |
| `ui.widget` | Contribuer un widget sur le tableau de bord d'accueil — **actif dès aujourd'hui en mode hybride** via `contributes.widgets` (iframe isolée dans la grille, ajout depuis « Personnaliser »). | Votre add-on affiche un résumé ou un indicateur en un coup d'œil. |
| `ui.settings` | Contribuer une section dans la centrale de paramétrage du tenant. | Votre add-on a des réglages que l'utilisateur doit pouvoir configurer. |
| `ai.tool` | Exposer un outil utilisable par l'assistant IA de la plateforme. | Votre add-on veut que l'assistant IA puisse déclencher une de ses actions ou lire une de ses données, sur demande de l'utilisateur. |
| `events.subscribe` | Souscrire aux événements de domaine typés émis par les apps (ex. facture payée, devis accepté, ticket créé). | Votre add-on réagit à un événement métier plutôt que d'interroger l'API en boucle. |

### Accès réseau — `http.fetch:<domaine>`

Pas de capability fixe pour le réseau sortant : chaque domaine externe que
votre add-on appelle doit être déclaré explicitement, un par un, sous la
forme `http.fetch:<domaine pleinement qualifié>` :

```json
{
  "capabilities": ["http.fetch:api.exemple.com", "http.fetch:hooks.exemple.io"]
}
```

Un domaine sans point ni TLD d'au moins deux lettres est refusé
(`http.fetch:localhost` ou `http.fetch:api` ne valident pas). Il n'y a pas
d'accès au réseau interne de la plateforme : seul l'egress vers des domaines
publics explicitement déclarés est concerné, et — une fois l'exécution
hébergée active — chaque appel sera proxifié et audité (cf. quotas
ci-dessous). En attendant, un add-on **hybride/externe** fait ses appels
réseau depuis son propre backend, sans passer par cette capability : il
appelle l'[API publique](/dev/docs/api-publique) de Capibara avec une clé API
ou un jeton OAuth, comme n'importe quel client HTTP.

---

## Quotas de l'exécution hébergée

Ces quotas s'appliquent à l'isolate d'exécution d'un add-on **hébergé** (le
modèle « votre code tourne chez Capibara », par opposition à un backend
externe que vous gérez vous-même) :

| Quota | Valeur |
|---|---|
| Temps CPU | 50 ms par requête |
| Mémoire | 128 Mo |
| Appels au capability broker | 100 par requête (anti-boucle) |

Un dépassement coupe l'exécution de la requête en cours — l'add-on ne peut
pas dégrader le reste de l'espace du tenant ni des autres tenants. Chaque
appel passant par le capability broker est audité (journal consultable par
l'équipe de review en cas d'incident), et un add-on défaillant peut être
isolé (kill switch, cf. [Publication et review](/dev/docs/publication))
globalement ou pour un seul tenant, sans affecter les autres.

### Deux façons de faire tourner votre logique

**A — Code HÉBERGÉ (sandbox).** Ajoutez `main` à votre manifeste (chemin
relatif, ex. `"main": "src/index.ts"`). À la publication, Capibara empaquette
ce point d'entrée (sans jamais exécuter votre code au build) et le fait tourner
dans un isolate contraint (workerd). Votre module exporte un handler façon
worker :

```ts
export default {
  async fetch(request, env) {
    // env.capibara = votre seule porte vers la plateforme (servie par le broker,
    // qui applique capabilities + permissions + quotas + audit).
    await env.capibara.storage.put('compteur', { n: 1 });   // storage.tenant.rw
    const cfg = await env.capibara.storage.get('compteur'); // storage.tenant.ro
    const r = await env.capibara.fetch('https://api.exemple.com/x'); // http.fetch:api.exemple.com
    return new Response(JSON.stringify({ cfg, upstream: r.status }));
  },
};
```

Votre code est appelé côté tenant via `/api/addons/<votre-clé>/<chemin>`
(authentifié, tenant résolu). `env.capibara` expose `storage.get/list/put/delete`
(KV cloisonné par tenant) et `fetch(url, init)` (sortie réseau bornée, vers les
domaines `http.fetch:` déclarés). Aucun autre accès : ni DB, ni réseau libre,
ni secret. Les quotas ci-dessus s'appliquent réellement à ce code.

> **Activation.** Le runtime hébergé se déploie côté instance (profil Docker
> `addons`). Sur une instance où il n'est pas encore activé, l'invocation
> renvoie proprement « runtime non activé » — votre add-on reste distribué et
> installable, et son mode hybride (ci-dessous) fonctionne sans dépendre du
> runtime.

**B — Mode HYBRIDE (sans `main`).** Votre propre backend appelle l'[API
publique](/dev/docs/api-publique), vos pages sont montées côté tenant via
`contributes.menuEntries` (iframe isolée + jeton de contexte signé), et les
[webhooks sortants](/dev/docs/webhooks) vous poussent les événements. Ce chemin
ne dépend d'aucune activation et fonctionne dès aujourd'hui. Les deux modes se
combinent librement.

---

## Déclarer des capabilities : bonnes pratiques

- **Minimum nécessaire** — chaque capability demandée est visible par la
  review et (à terme) par l'administrateur du tenant au moment de
  l'installation. N'en demandez que ce que votre add-on utilise vraiment.
- **Cohérence avec `contributes`** — si vous déclarez `ui.widget`, la review
  s'attend à trouver une entrée correspondante dans `contributes.widgets` (et
  réciproquement).
- **`http.fetch` un domaine à la fois** — pas de joker, pas de sous-domaine
  générique : un domaine par service tiers que vous appelez réellement.
- **Pas de capability « au cas où »** — en ajouter une que vous n'utilisez
  pas encore ralentit la review et n'apporte rien tant qu'elle n'est pas
  exercée.
