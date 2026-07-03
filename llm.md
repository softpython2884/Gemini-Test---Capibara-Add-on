# Utiliser cette doc avec votre IA

> Les URLs llms.txt, llms-full.txt, le Markdown brut par page et l'archive ZIP — pour construire un add-on Capibara avec l'aide d'un assistant IA.
> Catégorie : Démarrer · mis à jour le 2026-07-02 · plateforme v1

## Pourquoi cette page

Cette documentation est conçue pour être lue **par un assistant IA autant
que par vous**. Chaque page existe en Markdown brut (sans mise en page,
sans navigation) à une URL stable, et l'ensemble est disponible sous des
formats pensés pour être collés directement dans le contexte d'un agent :
vous n'avez jamais besoin d'accéder au code source de Capibara — cette
documentation, plus l'[API publique](/dev/docs/api-publique), suffisent.

---

## Les URLs à connaître

| URL | Contenu | Format |
|---|---|---|
| `/llms.txt` | Index de toutes les pages, groupées par catégorie, avec un résumé d'une ligne et un lien vers chaque version brute. | `text/plain`, convention [llms.txt](https://llmstxt.org) |
| `/llms-full.txt` | **Toutes** les pages concaténées intégralement, dans l'ordre de navigation du hub. | `text/plain` |
| `/dev/docs/raw/<slug>` | Le Markdown brut d'une seule page (ex. `/dev/docs/raw/manifeste`). | `text/markdown` |
| `/dev/docs/download` | Une archive `.zip` contenant un fichier `.md` par page. | `application/zip` |

Les trois premiers sont accessibles sans authentification particulière
au-delà de celle déjà requise pour le reste du portail développeur ; ce sont
de simples réponses texte, faciles à récupérer avec `curl` ou directement
depuis le navigateur de votre agent.

```
curl https://capibara.fr/llms.txt
curl https://capibara.fr/llms-full.txt
curl https://capibara.fr/dev/docs/raw/manifeste
```

---

## Ce que contient `/llms.txt`

Un index compact, dans le format standard `llms.txt` : un titre, un court
résumé de la plateforme, puis une section par catégorie avec un lien vers
chaque page — pratique pour qu'un agent **découvre** la documentation
disponible sans la charger en entier :

```
# Capibara for Developers

> Construisez des add-ons pour Capibara sans accès à son code source :
> manifeste déclaratif, permissions consenties par le tenant, API publique,
> OAuth, distribution et rev-share.

## Démarrer
- [Démarrer avec les add-ons Capibara](https://capibara.fr/dev/docs/raw/demarrer): …
- [Utiliser cette doc avec votre IA](https://capibara.fr/dev/docs/raw/llm): …

## Référence
- [Référence du manifeste add-on.json](https://capibara.fr/dev/docs/raw/manifeste): …
…
```

`/llms-full.txt`, à l'inverse, ne fait aucun tri : c'est le contenu intégral
des dix pages, séparées par `---`, pensé pour être collé **une seule fois**
dans le contexte d'un agent qui doit ensuite répondre à des questions variées
sans repartir chercher chaque page individuellement.

---

## Workflow conseillé

1. **Donnez `/llms-full.txt` à votre agent** en tout début de conversation
   (collé directement, ou récupéré via un outil de navigation web si votre
   agent en a un). C'est la référence la plus dense : elle contient déjà le
   manifeste exhaustif, les capabilities, les permissions, l'OAuth complet,
   l'API publique et le modèle de revenus.
2. **Faites écrire le manifeste par l'agent**, puis collez-le dans l'éditeur
   du portail (onglet **Manifeste** de votre add-on, `/dev/addons/<votre-projet>/manifest`)
   — l'éditeur valide en direct avec le même schéma que le serveur : les
   erreurs éventuelles de l'agent sont visibles immédiatement, sans attendre
   une soumission en review.
3. **Itérez** : si une erreur de validation apparaît, recopiez le message
   exact à votre agent (les messages sont listés dans [Référence du
   manifeste](/dev/docs/manifeste#erreurs-de-validation-courantes)) — ils
   sont volontairement explicites et actionnables.
4. Pour un add-on hybride (backend externe), demandez à votre agent
   d'implémenter l'appel à [l'API publique](/dev/docs/api-publique) et le
   flux [OAuth](/dev/docs/oauth) directement depuis les séquences `curl`
   fournies — elles sont écrites pour être traduites telles quelles dans
   n'importe quel langage.

---

## Une doc, deux lecteurs

Rien dans ce hub n'est réservé à l'un ou l'autre : les pages HTML
(`/dev/docs/<slug>`) et leur version brute (`/dev/docs/raw/<slug>`)
partagent exactement le même contenu source — pas de version « appauvrie »
pour la machine. Si un détail vous semble absent quand vous travaillez avec
un agent, c'est probablement qu'il est absent tout court : signalez-le
depuis `/dev/support`.
