# Revenus et rev-share

> Le modèle de prix du manifeste, l'onboarding Stripe Connect, les 3 paliers de partage chiffrés en euros, et la responsabilité fiscale du développeur.
> Catégorie : Distribution · mis à jour le 2026-07-02 · plateforme v1

## Le modèle de prix

Le prix d'un add-on est déclaré dans le manifeste (`pricing`, cf.
[Référence du manifeste](/dev/docs/manifeste#pricing)) :

| `model` | Ce que paie le tenant |
|---|---|
| `free` | rien. |
| `one_time` | un montant fixe (`amountEur`), une seule fois, à l'installation. |
| `subscription` | `amountEur` par mois, avec un essai gratuit optionnel (`trialDays`, 0 à 30 jours). |

Le prix est saisi en euros ; Stripe gère la conversion selon le pays du
payeur au moment du paiement.

---

## Onboarding Stripe Connect Express

Pour toucher le moindre euro, vous devez compléter l'onboarding **Stripe
Connect Express** depuis `/dev/payouts` :

1. Le portail crée votre compte Connect Express (associé à votre compte
   développeur) au premier clic sur « Configurer mes paiements ».
2. Vous êtes redirigé vers un formulaire Stripe hébergé (KYC : identité,
   coordonnées bancaires). Vous pouvez le quitter et y revenir plus tard
   (« Reprendre l'onboarding »).
3. Une fois le KYC complet (`payouts_enabled` **et** `charges_enabled` côté
   Stripe), votre compte passe « vérifié » et les paiements deviennent
   possibles.

> Si Stripe Connect n'est pas encore activé sur l'instance que vous utilisez
> (environnement de test, par exemple), la page l'indique clairement : les
> paiements développeurs seront disponibles à la bascule en production.

---

## Les 3 paliers de partage (sur le net après frais Stripe)

| Palier | Part développeur | Condition |
|---|---|---|
| **Standard** | 60 % | par défaut, toujours actif. |
| **Boost lancement** | 80 % | pendant les **90 jours** qui suivent votre toute première publication, tous add-ons confondus. |
| **Capibara Partner** | 70 % | statut accordé par l'équipe Capibara. |

Si plusieurs paliers s'appliquent en même temps, **le plus favorable pour
vous** est retenu automatiquement — pas besoin de le demander.

### Exemple chiffré — vente à 10 €

1. Le tenant paie **10,00 €**.
2. Les frais Stripe sont estimés à **1,5 % + 0,25 €** (cartes européennes),
   soit ici **0,40 €**.
3. Le **net** disponible au partage est donc **9,60 €**.
4. Votre part dépend du palier actif :

| Palier | Part dev | Vous touchez | Part plateforme |
|---|---|---|---|
| Standard (60 %) | 60 % | **5,76 €** | 3,84 € |
| Boost lancement (80 %) | 80 % | **7,68 €** | 1,92 € |
| Capibara Partner (70 %) | 70 % | **6,72 €** | 2,88 € |

> Le taux de frais Stripe ci-dessus est une **estimation**, utilisée pour
> fixer la retenue au moment du paiement. Le montant net réel dépend du type
> de carte et du pays de l'acheteur ; il est réconcilié après coup depuis
> Stripe et c'est cette valeur réconciliée qui apparaît dans votre récapitulatif
> de revenus (`/dev/payouts`).

---

## Quand et comment c'est versé

Les ventes sont encaissées par **transfert de destination** (« destination
charges ») : votre part est transférée **automatiquement vers votre compte
Stripe Connect à chaque vente**, sans action de votre part. La page
`/dev/payouts` récapitule, par add-on : nombre de ventes, chiffre d'affaires
brut, votre part cumulée. Le rythme effectif de mise à disposition des fonds
sur votre compte bancaire (quotidien, hebdomadaire…) suit ensuite le
calendrier de virement standard de votre compte Stripe Connect.

### Remboursements

Politique par défaut : **14 jours satisfait ou remboursé** sur les achats
ponctuels, **au prorata** sur les abonnements (le mois entamé reste dû). En
cas de remboursement, votre part est reprise au même prorata (transfert
inverse) ; les frais Stripe non récupérables restent à la charge de la
plateforme, jamais déduits une seconde fois de votre part.

---

## La TVA et votre fiscalité

Stripe Tax gère la TVA européenne **sur la transaction avec l'acheteur**
(le tenant qui installe votre add-on). Cela ne vous dispense pas de vos
**propres obligations fiscales** : vous restez seul responsable de déclarer,
dans votre pays, les revenus perçus via la plateforme. Capibara n'est ni
votre comptable ni votre conseiller fiscal — en cas de doute, consultez un
professionnel.

---

## Suivre vos revenus

`/dev/payouts` affiche en temps réel :

- l'état de votre compte Stripe Connect ;
- votre palier de rev-share actuel et le nombre de jours restants du Boost
  lancement, le cas échéant ;
- vos ventes, votre chiffre d'affaires brut et votre part nette cumulée,
  avec le détail des remboursements éventuels.
