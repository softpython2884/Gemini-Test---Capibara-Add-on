# Démarrer avec les add-ons Capibara

> Le modèle add-on Capibara de bout en bout : compte développeur, premier projet, manifeste minimal, et cycle DRAFT → REVIEW → PUBLISHED.
> Catégorie : Démarrer · mis à jour le 2026-07-02 · plateforme v1

## Le modèle add-on Capibara

Capibara for Developers permet de construire une extension (« add-on ») pour
la plateforme **sans jamais avoir accès au code source de Capibara**. Tout ce
dont un add-on a besoin se déclare dans un fichier unique, `add-on.json` (le
« manifeste »), et se distribue via un portail dédié :

1. Vous décrivez votre add-on dans un manifeste : identité, permissions
   demandées, capacités techniques utilisées, tarif.
2. Vous soumettez une version à la review.
3. Une fois approuvée, vous la publiez : elle devient installable depuis le
   marketplace par n'importe quel espace (tenant) Capibara.
4. Si votre add-on est payant, vous touchez une part de chaque vente (cf.
   [Revenus et rev-share](/dev/docs/revenus)).

Un add-on peut avoir un **backend externe** (le vôtre, appelé « hybride » ou
« externe ») qui appelle l'API publique de Capibara avec une clé API ou un
jeton OAuth — c'est le modèle **fonctionnel dès aujourd'hui**. Le modèle
« hébergé » (votre code tournant directement dans une sandbox Capibara, sans
backend à vous) est décrit dans cette documentation mais son exécution réelle
est encore en construction : voir la note dans [Capabilities et quotas
d'exécution](/dev/docs/capabilities).

> **Vous n'avez jamais besoin du code source de Capibara.** Le manifeste, la
> référence des permissions/capabilities et l'API publique suffisent à
> construire un add-on complet.

---

## Ce qu'il vous faut avant de commencer

- Un compte Capibara (le même compte qui vous sert à administrer vos espaces).
- **Au moins un espace (tenant) sur un forfait Pro ou Business.** Le portail
  développeur est réservé aux comptes Pro+ — un compte uniquement Free voit un
  mur d'accès proposant de passer à Pro. Cette vérification est refaite à
  chaque action sensible (créer un compte dev, publier), pas seulement à la
  connexion.
- Savoir lire un peu de JSON. Aucune compétence Next.js/TypeScript côté
  plateforme n'est requise pour un add-on hybride simple.

Le portail est accessible sur `developer.capibara.fr`, ou directement sur
`/dev` depuis le domaine principal.

---

## Étape 1 — Créer votre compte développeur

Depuis `/dev`, si vous n'avez pas encore de compte développeur, un
formulaire vous demande un **nom public** (2 à 80 caractères) — c'est le nom
affiché sur vos add-ons et votre profil public du marketplace
(`/marketplace/dev/<votre-slug>`). Un slug unique est dérivé automatiquement
de ce nom (minuscules, tirets) ; s'il est déjà pris, un court suffixe aléatoire
est ajouté.

Créer un compte développeur est **idempotent** : si vous en avez déjà un, la
même action renvoie simplement le vôtre plutôt que d'en créer un second — vous
ne pouvez avoir qu'un compte développeur par compte Capibara.

---

## Étape 2 — Créer votre premier projet d'add-on

Un **projet** est le conteneur stable de votre add-on : il porte un nom, une
catégorie, et surtout une **clé technique immuable** (`key`) qui identifie
votre add-on sur toute la plateforme, pour toujours.

| Champ | Contrainte |
|---|---|
| Nom | 2 à 80 caractères, modifiable à tout moment. |
| Identifiant (`key`) | kebab-case, 3 à 50 caractères (`a-z`, `0-9`, tirets), unique sur toute la plateforme, **immuable après création**. |
| Catégorie | une valeur parmi : `sales`, `finance`, `marketing`, `productivity`, `hr`, `website`, `integration`, `other`. |

Choisissez la `key` avec soin — la même valeur doit ensuite apparaître dans
le champ `key` de chaque manifeste que vous soumettez pour ce projet, et ne
pourra plus jamais changer. Une bonne pratique : préfixez avec un mot qui
évoque votre produit plutôt qu'un nom trop générique (`crm-segments` plutôt
que `segments`).

---

## Étape 3 — Écrire votre manifeste minimal

Le manifeste `add-on.json` est la seule source de vérité de ce que fait
votre add-on aux yeux de la plateforme. Voici le plus petit manifeste valide,
pour un add-on gratuit qui ajoute un widget d'accueil :

```json
{
  "key": "crm-segments",
  "name": "Segments avancés CRM",
  "version": "0.1.0",
  "author": { "name": "Studio Forge", "devAccountSlug": "studio-forge" },
  "compatibility": { "colibri": ">=1.0", "modules": ["crm"] },
  "permissions": ["crm:read"],
  "capabilities": ["ui.widget"],
  "pricing": { "model": "free" },
  "i18n": {
    "fr": "Segmentez vos contacts CRM en un clic.",
    "en": "Segment your CRM contacts in one click."
  }
}
```

La référence complète de chaque champ (types, contraintes exactes, règles de
tarification, exemples supplémentaires) est dans [Référence du manifeste
add-on.json](/dev/docs/manifeste).

Trois façons d'écrire ce fichier depuis le portail, sur la page de votre
add-on :

1. **Éditeur de code** (Monaco) — coloration syntaxique + complétion + erreurs
   inline, dérivées du même schéma que la validation serveur.
2. **Formulaire assisté** — un onglet Formulaire pour les champs courants,
   synchronisé avec l'onglet JSON (les deux éditent le même objet).
3. **Import depuis un dépôt Git** — connectez un dépôt et le portail va y lire
   `add-on.json` pour créer une version brouillon. **Seul GitHub est pris en
   charge pour l'import aujourd'hui** (GitLab et Forgejo sont acceptés comme
   simple métadonnée de projet, mais l'import de fichier ne fonctionne qu'avec
   un dépôt GitHub pour le moment).

---

## Étape 4 — Le cycle de vie d'une version

Chaque version de votre add-on (un `semver` précis, ex. `0.1.0`) suit un
cycle strict :

```
DRAFT ──submit──▶ REVIEW ──approuvé──▶ APPROVED ──publish──▶ PUBLISHED
  ▲                   │
  └────────────────REJECTED (avec notes) ◀──┘
```

- **DRAFT** — votre brouillon. Vous pouvez l'enregistrer autant de fois que
  nécessaire ; chaque enregistrement revalide le manifeste en direct (mêmes
  règles que la validation serveur). La `key` doit rester identique à celle
  du projet, et `author.devAccountSlug` doit être exactement votre slug.
- **REVIEW** — dès que vous soumettez, le manifeste est **revalidé
  immédiatement** (un manifeste invalide repart en `REJECTED` sur-le-champ,
  avec le détail des erreurs). Un build est aussi mis en file pour les
  vérifications automatisées de code.
  > **En préparation.** Aujourd'hui, ces vérifications automatisées
  > (lint, types, tests, audit des dépendances) restent en attente tant que
  > le runner de build n'est pas branché : c'est la review humaine qui les
  > couvre manuellement en attendant. Cela n'empêche pas de soumettre — mais
  > soignez particulièrement la qualité et la sécurité de votre code, elle
  > est revue à la main.
- **APPROVED** — validée par l'équipe Capibara. Vous pouvez publier quand
  vous le souhaitez (la publication n'est pas automatique).
- **PUBLISHED** — installable depuis le marketplace. La première publication
  d'un projet crée automatiquement sa fiche marketplace (accroche reprise de
  votre baseline `i18n.fr`, catégorie du projet).
- **REJECTED** — refusée, avec des notes explicites. Corrigez et resoumettez :
  une version `REJECTED` peut être renvoyée en review comme un brouillon.

Une version déjà en `REVIEW`, `APPROVED` ou `PUBLISHED` ne peut plus être
modifiée — pour changer quoi que ce soit, incrémentez le `version` (semver)
et enregistrez un nouveau brouillon.

---

## Étape 5 — Choisir comment votre add-on s'exécute

Deux modèles d'exécution existent dans le manifeste et la doctrine du
portail ; à ce stade, un seul est pleinement opérationnel :

- **Add-on hybride / externe (fonctionnel aujourd'hui)** — votre add-on a un
  **backend chez vous** (n'importe quel langage, n'importe quel hébergeur).
  Il appelle l'[API publique](/dev/docs/api-publique) de Capibara avec une clé
  API ou un jeton [OAuth](/dev/docs/oauth). C'est le chemin recommandé pour
  démarrer.
- **Add-on hébergé (en préparation)** — votre code s'exécuterait directement
  dans une sandbox Capibara, sans backend à héberger vous-même, via un objet
  `capibara` injecté correspondant à vos [capabilities](/dev/docs/capabilities)
  déclarées. Déclarez déjà vos `capabilities` et vos `contributes` dans le
  manifeste — la review en tient compte — mais ne construisez pas encore un
  add-on qui *dépend* de cette exécution pour fonctionner : elle n'est pas
  encore active en production.

---

## Checklist de première publication

Avant de soumettre votre première version en review :

- [ ] Le manifeste valide sans erreur (l'éditeur du portail vous le confirme
      en direct).
- [ ] `permissions` et `capabilities` sont **minimales** — ne demandez que
      ce que votre add-on utilise réellement (cf. [Permissions et
      consentement du tenant](/dev/docs/permissions)).
- [ ] La baseline `i18n.fr` (et `i18n.en`) décrit clairement, en une phrase,
      ce que fait l'add-on — c'est ce qui apparaît sur la fiche marketplace.
- [ ] `support.email` est renseigné : un tenant qui installe votre add-on
      doit pouvoir vous contacter.
- [ ] Le tarif (`pricing`) correspond à ce que vous annoncez publiquement.
- [ ] Vous avez testé le parcours complet côté add-on (installation,
      utilisation, désinstallation) sur un espace de test.
- [ ] Si votre add-on est payant, l'onboarding Stripe Connect est démarré
      depuis `/dev/payouts` (cf. [Revenus et rev-share](/dev/docs/revenus)).

---

## Et ensuite ?

- [Référence du manifeste add-on.json](/dev/docs/manifeste) — chaque champ,
  en détail.
- [Capabilities et quotas d'exécution](/dev/docs/capabilities)
- [Permissions et consentement du tenant](/dev/docs/permissions)
- [Sign in with Capibara (OAuth)](/dev/docs/oauth)
- [API publique](/dev/docs/api-publique)
- [Publication et review](/dev/docs/publication)
- [Utiliser cette doc avec votre IA](/dev/docs/llm) — si vous construisez avec
  l'aide d'un assistant IA, commencez par là.
