# Cadence

Application de sport (Expo / React Native, TypeScript) : tu crées un programme, Cadence te le rappelle, te guide pendant la séance et lance la musique.

## Ce que fait l'application

- **Programme** : séances par semaine et jours, niveau, muscles, maison ou salle, durée. Les séances sont construites à partir de ces choix et collent à la durée demandée.
- **Rappel** : une notification aux heures et jours de séance.
- **Séance** : aperçu avec les images des exercices → *Lancer* → pour chaque exercice, image, nom et répétitions → **OK** → chrono de repos (±15 s) où tu notes les répétitions faites ou **Échec** → exercice suivant → écran de fin (muscles travaillés, calories, durée).
- **Musique**, lancée au début de la séance, qui continue écran verrouillé :
  - *Automatique, dans Cadence* : playlist composée d'après tes goûts avec les titres d'artistes indépendants d'**Audius** (aucune clé nécessaire) et, si tu ajoutes ta clé gratuite, la musique libre de **Jamendo**. Elle suit une courbe d'énergie (échauffement → effort → retour au calme) et la durée de la séance. Si une source ne répond pas, l'autre prend le relais.
  - *Automatique, dans ton application* : Cadence ouvre Spotify, YouTube Music, Deezer ou Apple Music sur une recherche adaptée à tes goûts.
  - *Manuel* : tes fichiers MP3/MP4 (lus dans Cadence) ou le lien d'une playlist YouTube (ouverte dans l'application YouTube).

## Obtenir l'APK depuis une tablette

1. Ouvre l'onglet **Actions** du dépôt : la compilation « Compiler l'APK Android » se lance toute seule à chaque envoi sur `main` (15 à 25 minutes). Tu peux aussi la lancer à la main : *Run workflow*.
2. Quand la coche verte apparaît, va dans **Releases** (colonne de droite de la page du dépôt), ouvre le dernier build et télécharge **Cadence.apk**.
3. Ouvre le fichier pour l'installer (Android demande d'autoriser l'installation depuis le navigateur la première fois).

Aucun compte ni secret n'est nécessaire. Si le build échoue, ouvre l'exécution dans Actions, déplie l'étape marquée ❌ et envoie-moi son message.

## Clé Jamendo (facultative)

Sans clé, Cadence compose déjà ta playlist avec Audius. Une clé Jamendo gratuite ajoute la musique libre de Jamendo pour plus de choix. À créer une fois :

1. Va sur [devportal.jamendo.com](https://devportal.jamendo.com), crée un compte puis une application.
2. Copie le **client id**.
3. Colle-le dans Cadence : *Réglages → Musique de séance → Enregistrer la clé*.

Variante : ajoute-le comme secret du dépôt nommé `JAMENDO_CLIENT_ID` (*Settings → Secrets and variables → Actions → New repository secret*). Il est alors intégré à l'application à la compilation et Cadence ne le demande plus. Attention : l'APK publié dans les Releases est public, la clé y serait lisible par quiconque le télécharge.

Jamendo est réservé à un usage **non commercial** ; les artistes de Jamendo et d'Audius sont crédités dans l'application.

## Bon à savoir

- La lecture en arrière-plan, les commandes de l'écran verrouillé et l'import de fichiers ne marchent que dans l'APK, pas dans Expo Go ni dans un navigateur.
- Si la musique s'arrête écran éteint, retire Cadence de l'optimisation de batterie (réglages Android).
- Les titres d'Audius et de Jamendo se lisent en continu : il faut une connexion pendant la séance.
- Le chrono de repos prévient par une notification quand l'application est en arrière-plan.
- Les programmes et l'historique restent sur l'appareil.
- Certains exercices « maison » demandent une paire d'haltères.

## Développement

```bash
npm ci
npx expo start        # lancer l'application
npx tsc --noEmit      # types
npx expo lint         # règles
npx jest              # tests
```

| Dossier | Contenu |
| --- | --- |
| `src/app` | écrans (Expo Router) |
| `src/domain` | exercices, génération du programme, calendrier |
| `src/workout` | déroulement d'une séance (machine à états) |
| `src/music` | Audius, Jamendo, composition de la playlist, lecteur, YouTube, applications externes |
| `src/notifications` | rappels et fin de repos |
| `src/features`, `src/components`, `src/theme` | interface |
| `src/store` | données sauvegardées sur l'appareil |

Le dossier `android/` n'est pas dans le dépôt : il est généré par `expo prebuild` à partir de `app.json`.

Audius se lit sans clé en s'identifiant par le nom de l'application (`app_name=Cadence`, voir `src/music/audius.ts`). Si Audius exigeait un jour une clé d'API (à créer sur [api.audius.co/plans](https://api.audius.co/plans)), elle s'ajouterait à ces requêtes.
