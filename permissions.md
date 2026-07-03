# Permissions et consentement du tenant

> Le format resource:action, l'écran de consentement que voit l'administrateur du tenant à l'installation, et les bonnes pratiques du moindre privilège.
> Catégorie : Référence · mis à jour le 2026-07-02 · plateforme v1

## Le format `resource:action`

Chaque entrée du tableau `permissions` du manifeste suit le format :

```
resource:action
```

validé par l'expression régulière `^[a-z][a-z0-9-]*:(read|write|delete|admin)$`.

- `resource` commence par une lettre minuscule, puis lettres/chiffres/tirets
  (c'est la clé technique d'un module de la plateforme — cf. le tableau
  ci-dessous).
- `action` est l'une de : `read`, `write`, `delete`, `admin`.

Exemples valides : `crm:read`, `shop:write`, `billing-fr:read`,
`support:delete`. Exemples invalides : `crm.read` (point au lieu de deux-
points), `read-crm` (ordre inversé), `CRM:read` (majuscules).

---

## Ressources first-party

Ces clés correspondent aux modules métier réels de la plateforme. Une
permission ne porte que sur les **données du tenant** dans ce module — jamais
sur la configuration de la plateforme elle-même.

| Ressource | Module |
|---|---|
| `crm` | CRM (contacts, sociétés, opportunités) |
| `shop` | Boutique en ligne |
| `billing-fr` | Facturation et devis |
| `accounting` | Comptabilité |
| `inventory` | Stock |
| `purchasing` | Achats |
| `projects` | Projets |
| `planning` | Planning et rendez-vous |
| `support` | Support client |
| `blog` | Blog |
| `newsletter` | Newsletter |
| `site` | Site et landing builder |
| `media` | Médiathèque |
| `documents` | Documents et wiki |
| `chat` | Chat interne |
| `hr` | Ressources humaines |
| `formation` | Formation (OF / Qualiopi) |
| `domains` | Domaines personnalisés |
| `mail` | Messagerie |

> Cette liste couvre les ressources RBAC des modules de premier niveau. Un
> module peut exposer des sous-ressources plus fines en interne (par exemple
> une action d'administration réservée) — si votre add-on a besoin d'une
> permission qui ne correspond à aucune de ces clés, demandez sur
> `/dev/support` plutôt que de deviner une clé qui n'existe pas : une
> permission sur une ressource inconnue n'est pas rejetée par le format
> (l'expression régulière accepte toute chaîne qui y ressemble), mais elle
> n'ouvrira aucun accès réel.

---

## Le consentement à l'installation

Les permissions ne sont pas qu'une déclaration technique : **l'administrateur
du tenant les voit et les accorde explicitement** avant que votre add-on ne
soit installé. Sur la fiche d'installation, une carte « Permissions
demandées » liste chaque entrée de votre manifeste en clair, et l'installation
d'un add-on gratuit est bloquée tant que la case suivante n'est pas cochée :

> *« J'autorise cet add-on à accéder aux permissions ci-dessus dans mon
> espace. »*

Pour un add-on payant, le même écran de permissions précède le paiement. Et à
chaque **mise à jour** de version installée, l'administrateur doit
**re-consentir** explicitement aux permissions de la nouvelle version — les
mises à jour ne sont jamais silencieuses ni automatiques. Si vous ajoutez une
permission dans une nouvelle version, attendez-vous à ce que certains tenants
mettent plusieurs jours avant de la ré-accepter : ne rendez pas votre add-on
dépendant d'une mise à jour instantanée.

---

## Revalidées en base, jamais en confiance

Côté plateforme, chaque permission déclarée est confrontée au RBAC strict de
Capibara : les accès sont **revalidés en base à chaque appel**, jamais mis en
cache sur la seule foi du consentement initial. Un add-on qui perd une
permission (retirée par l'administrateur, ou parce que le module a été
désactivé chez ce tenant) voit ses appels correspondants refusés
immédiatement, pas seulement à la prochaine installation.

---

## Bonnes pratiques (principe du moindre privilège)

- **Une permission par usage réel.** Si votre add-on ne fait que lire les
  contacts CRM pour afficher un résumé, déclarez `crm:read` — pas
  `crm:write` « au cas où une future version en aurait besoin ».
- **Séparez lecture et écriture.** `shop:read` et `shop:write` sont deux
  entrées distinctes : ne demandez `write` que si vous créez/modifiez
  réellement des données.
- **`delete` et `admin` sont sensibles.** Ce sont les permissions qui
  ralentissent le plus la review humaine — n'y recourez que si la
  fonctionnalité l'exige vraiment, et expliquez pourquoi dans votre fiche de
  soumission.
- **Moins de permissions = review plus rapide et plus de confiance tenant.**
  Un tenant qui voit une longue liste de permissions pour un petit add-on
  hésite à installer.

---

## Lien avec la review

La liste de permissions de votre manifeste fait partie de ce que l'équipe
Capibara regarde à la review (cf. [Publication et
review](/dev/docs/publication)) : une permission qui ne correspond à rien de
visible dans la description ou le comportement annoncé de l'add-on est un
motif de refus fréquent. Documentez, dans votre fiche marketplace, à quoi
sert chaque permission un peu inhabituelle.
