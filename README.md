# Widget Météo Open-Meteo pour Capibara

Cet add-on Capibara permet d'afficher la météo en temps réel et des prévisions à 3 jours sur le tableau de bord d'un espace de travail (tenant) Capibara. Il utilise l'API gratuite de géocodage et de prévision d'**Open-Meteo**.

## Architecture de l'Add-on

L'application est construite selon le modèle **hybride** de Capibara :
- **Manifeste (`add-on.json`)** : Décrit l'add-on à la plateforme Capibara, demande les permissions nécessaires et déclare les points d'intégration (menu de configuration et widget d'accueil).
- **Backend Node.js/Express (`server.js`)** : Sert l'interface utilisateur statique et fournit une API simple de lecture/écriture de la ville choisie, cloisonnée par tenant (identifié par le jeton de sécurité `capibara_token`).
- **Stockage local (`db.json`)** : Fichier JSON léger qui sert de base de données persistante pour stocker les coordonnées par tenant.
- **Frontend (`public/`)** : Pages HTML et CSS utilisant un style premium et moderne (glassmorphism avec effets de flou de verre, mode sombre élégant, animations douces et design adaptatif).

---

## Démarrage rapide (Local)

### 1. Installation des dépendances
Assurez-vous que Node.js est installé, puis exécutez la commande suivante dans le dossier du projet :
```bash
npm install
```

### 2. Lancement du serveur de développement
Démarrez le serveur local :
```bash
npm start
```
Le serveur sera disponible à l'adresse suivante : [http://localhost:3000](http://localhost:3000).

### 3. Tester localement dans votre navigateur
Pour tester les fonctionnalités sans plateforme Capibara connectée (mode de secours local automatique) :
- **Page de Configuration** : Ouvrez [http://localhost:3000/settings.html](http://localhost:3000/settings.html) pour rechercher une ville (ex. "Lyon", "Nice") et cliquez sur "Enregistrer la configuration".
- **Widget Météo** : Ouvrez [http://localhost:3000/widget.html](http://localhost:3000/widget.html) pour voir le widget météo de la ville configurée avec les températures actuelles, le vent, la pluie, l'indice UV et les prévisions sur 3 jours.

---

## Déploiement en production et enregistrement Capibara

### 1. Hébergement
Déployez le projet sur un hébergeur web de votre choix (par exemple Vercel, Render, Heroku ou votre propre serveur).
> [!IMPORTANT]
> Capibara nécessite que les URLs d'intégration (`embedUrl`) utilisent le protocole **HTTPS** sécurisé.

### 2. Configuration du Manifeste
Dans `add-on.json`, mettez à jour les propriétés suivantes :
- `author.devAccountSlug` : Remplacez `"antigravity"` par votre propre slug de compte développeur Capibara (visible sur `developer.capibara.fr`).
- `contributes.menuEntries[0].embedUrl` : Remplacez le domaine fictif par l'URL publique de votre page `settings.html` (ex: `https://votre-domaine.com/settings.html`).
- `contributes.widgets[0].embedUrl` : Remplacez le domaine fictif par l'URL publique de votre page `widget.html` (ex: `https://votre-domaine.com/widget.html`).

### 3. Enregistrement sur le portail développeur
1. Connectez-vous sur le portail développeur Capibara (`developer.capibara.fr`).
2. Créez un nouveau projet avec l'identifiant technique `weather-widget`.
3. Collez le contenu de votre fichier `add-on.json` dans l'onglet **Manifeste** (ou configurez l'importation automatique depuis GitHub).
4. Soumettez votre version (ex: `0.1.0`) en review pour la publier sur le marketplace Capibara !
