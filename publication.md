# Publication et review

> Soumettre en review, ce qui est vérifié aujourd'hui, les motifs de refus courants, publier, mettre à jour, le kill switch et la fiche marketplace.
> Catégorie : Distribution · mis à jour le 2026-07-02 · plateforme v1

## Soumettre une version en review

Depuis un brouillon (`DRAFT`) valide, la soumission déclenche deux choses
immédiatement :

1. Une **revalidation complète du manifeste**, avec le même schéma que
   l'éditeur du portail. Si elle échoue, la version repart directement en
   `REJECTED` avec le détail des erreurs — sans attendre personne.
2. La mise en file d'un build pour les vérifications automatisées de code.

> **En préparation.** Aujourd'hui, ce build reste en attente : les gates de
> lint, type-check, analyse de sécurité statique, tests et audit des
> dépendances **ne sont pas encore exécutées automatiquement**. C'est la
> review humaine qui couvre ces points manuellement le temps que le runner de
> build soit branché. Ne soumettez pas un add-on que vous n'avez pas testé
> vous-même : la review vérifie la cohérence et la sécurité déclarative, pas
> (encore) l'exécution de votre code.

---

## Ce que la review vérifie

- **Le manifeste** — champs cohérents, permissions et capabilities
  proportionnées à ce que l'add-on annonce faire (cf. [Permissions et
  consentement du tenant](/dev/docs/permissions) et [Capabilities et quotas
  d'exécution](/dev/docs/capabilities)).
- **La description honnête** — la baseline `i18n`, la tagline et la
  description de la fiche marketplace doivent correspondre à ce que l'add-on
  fait réellement. Une promesse non tenue (ex. « synchronisation en temps
  réel » pour un traitement en réalité manuel) est un motif de refus.
- **La catégorie correcte** — cohérente avec la fonction principale de
  l'add-on, pas choisie pour la visibilité.
- **Les permissions et capabilities** — au minimum nécessaire (principe du
  moindre privilège).
- **Le support** — un `support.email` valide et surveillé.
- **La sécurité et la qualité générale du code**, dans la mesure du possible
  à la lecture (tant que les gates automatisées ne sont pas branchées).

---

## Délais

Il n'y a pas de délai contractuel affiché à ce stade : les versions
soumises sont traitées **dans l'ordre d'arrivée** par l'équipe Capibara.
Suivez le statut de votre version (`REVIEW`, `APPROVED`, `REJECTED`)
directement depuis la page de votre add-on sur le portail — aucune action de
votre part n'est nécessaire pendant l'attente.

---

## Motifs de refus courants

- Manifeste invalide ou champs incohérents entre eux (ex. `capabilities`
  déclarant `ui.widget` sans widget correspondant dans `contributes`).
- Permissions ou capabilities disproportionnées par rapport à la
  fonctionnalité décrite.
- Description ou tagline trompeuse, ou qui promet une fonctionnalité non
  implémentée.
- Absence de `support.email`, ou adresse manifestement non surveillée.
- Comportement suspect détecté à la lecture (appel réseau vers un domaine non
  déclaré dans `capabilities`, tentative de contournement des permissions).
- Contenu ou comportement contraire aux CGV Marketplace (logiciel
  malveillant, tracker non déclaré, violation de droits de tiers).

Un refus est toujours accompagné de notes explicites. Corrigez et resoumettez
— une version `REJECTED` redevient un brouillon modifiable.

---

## Publier une version approuvée

Une fois `APPROVED`, la publication est **une action volontaire** : rien ne
se publie automatiquement. Au premier `publish` d'un projet, la fiche
marketplace est créée automatiquement, avec :

- l'**accroche** reprise de votre baseline `i18n.fr` (modifiable ensuite) ;
- la **catégorie** du projet ;
- un **statut** `LISTED` (visible et installable).

Les publications suivantes du même projet mettent à jour la version publiée
sur la fiche existante.

---

## Mettre à jour (nouvelle version)

Il n'y a pas de mise à jour « en place » : vous incrémentez le `version`
(semver) dans le manifeste, enregistrez un nouveau brouillon, et refaites le
cycle `submit` → review → `publish`. Chaque version garde son propre
historique (`DRAFT`/`REVIEW`/`APPROVED`/`PUBLISHED`/`REJECTED`) — vous
pouvez avoir plusieurs versions dans des états différents en parallèle (par
exemple une `PUBLISHED` en production pendant qu'une prochaine est en
`REVIEW`).

Côté tenant, les mises à jour **ne sont jamais appliquées automatiquement** :
un administrateur doit ouvrir la fiche de son add-on installé et re-consentir
explicitement aux permissions de la nouvelle version pour l'appliquer.
Prévoyez que certains de vos utilisateurs restent sur une version antérieure
un moment.

---

## Le kill switch (incident global ou par tenant)

En cas d'incident (faille de sécurité découverte, comportement abusif,
signalement fondé), l'équipe Capibara peut **désactiver une version**
immédiatement :

- **Globalement** — la version est isolée pour tous les tenants qui l'ont
  installée.
- **Pour un seul tenant** — si le problème n'affecte qu'un espace précis
  (ex. donnée corrompue chez ce client), sans braquer le reste de votre base
  installée.

Chaque désactivation est enregistrée avec un motif, et peut être levée dès
que le problème est résolu. Un incident actif sur une de vos versions vous
est notifié — traitez-le en priorité : c'est le mécanisme qui protège vos
utilisateurs (et votre réputation de développeur) en attendant un correctif.

---

## La fiche marketplace

Éditable depuis la page de votre add-on sur le portail, une fois une
première version publiée :

| Champ | Contrainte |
|---|---|
| Accroche (`tagline`) | ≤ 140 caractères. |
| Description (`descriptionMd`) | ≤ 20 000 caractères, en Markdown. |
| Captures d'écran | jusqu'à 8, chacune une URL d'image que vous hébergez (pas d'upload dédié pour la fiche — utilisez votre propre hébergement d'images). |
| Catégorie | reprise du projet, modifiable. |
| Icône | image carrée, ≤ 1 Mo, uploadée depuis l'onglet général de votre projet — affichée sur le portail **et** la fiche marketplace. |

Une fiche soignée (accroche claire, captures réelles de l'add-on en
fonctionnement, description qui explique le bénéfice concret) reste le
meilleur levier d'installation — la review juge la conformité, pas
l'attractivité, mais les deux vont mieux ensemble.
