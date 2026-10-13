# Cadence

Application de sport (Expo / React Native, TypeScript) : tu crées un programme, Cadence te le rappelle, te guide pendant la séance et lance la musique.

## Ce que fait l'application

- **Programme** : séances par semaine et jours, niveau, muscles, maison (avec ou sans poids) ou salle, durée. Les séances sont construites à partir de ces choix et collent à la durée demandée.
- **Rappel** : une notification aux heures et jours de séance.
- **Séance** : aperçu avec les images des exercices → *Lancer* → pour chaque exercice, image, nom et répétitions → **OK** → chrono de repos (±15 s) où tu notes les répétitions faites ou **Échec** → exercice suivant → écran de fin (muscles travaillés, calories, durée).
- **Musique**, lancée au début de la séance, qui continue écran verrouillé :
  - *Automatique, dans Cadence* : playlist composée d'après tes goûts avec les titres d'artistes indépendants d'**Audius** (aucune clé nécessaire) et, si le secret `JAMENDO_CLIENT_ID` est renseigné (voir plus bas), la musique libre de **Jamendo**. Elle suit une courbe d'énergie (échauffement → effort → retour au calme) et la durée de la séance. Si une source ne répond pas, l'autre prend le relais.
  - *Automatique, dans ton application* : Cadence ouvre Spotify, YouTube Music, Deezer ou Apple Music sur une recherche adaptée à tes goûts.
  - *Manuel* : tes fichiers MP3/MP4 (lus dans Cadence, écran verrouillé compris) ou le lien d'une playlist YouTube, lue avec le lecteur officiel de YouTube dans un panneau en bas de l'écran de séance : tu gardes l'appli sous la main pour changer d'exercice ou valider une série.

## Obtenir l'APK depuis une tablette

1. Ouvre l'onglet **Actions** du dépôt : la compilation « Compiler l'APK Android » se lance toute seule à chaque envoi sur `main` (15 à 25 minutes). Tu peux aussi la lancer à la main : *Run workflow*.
2. Quand la coche verte apparaît, va dans **Releases** (colonne de droite de la page du dépôt), ouvre le dernier build et télécharge **Cadence.apk**.
3. Ouvre le fichier pour l'installer (Android demande d'autoriser l'installation depuis le navigateur la première fois).

Aucun compte ni secret n'est nécessaire. Si le build échoue, ouvre l'exécution dans Actions, déplie l'étape marquée ❌ et envoie-moi son message.

## Musique libre de Jamendo (facultatif)

Sans rien faire, Cadence compose déjà ta playlist avec Audius. Pour ajouter la musique libre de Jamendo, mets sa clé gratuite dans un secret du dépôt : elle est intégrée à l'application à la compilation, tu n'as rien à saisir dans l'application.

1. Va sur [devportal.jamendo.com](https://devportal.jamendo.com), crée un compte puis une application, et copie le **client id**.
2. Sur GitHub, dans le dépôt : *Settings → Secrets and variables → Actions → New repository secret*. Nom : `JAMENDO_CLIENT_ID`, valeur : le client id.
3. Relance la compilation (*Actions → Compiler l'APK Android → Run workflow*), puis installe le nouvel APK. L'étape « Clé Jamendo » de l'exécution indique si le secret a été trouvé.

Le secret reste masqué dans les journaux GitHub, mais il est copié dans l'APK, publié dans les Releases : quiconque télécharge l'APK peut le retrouver en l'inspectant. C'est sans gravité pour un identifiant Jamendo gratuit en lecture seule, mais n'y mets jamais une clé privée ou payante.

Jamendo est réservé à un usage **non commercial** ; les artistes de Jamendo et d'Audius sont crédités dans l'application.

## Bon à savoir

- La lecture en arrière-plan, les commandes de l'écran verrouillé et l'import de fichiers ne marchent que dans l'APK, pas dans Expo Go ni dans un navigateur.
- Si la musique s'arrête écran éteint, retire Cadence de l'optimisation de batterie (réglages Android).
- Les titres d'Audius et de Jamendo se lisent en continu : il faut une connexion pendant la séance.
- **YouTube ne se lit pas en arrière-plan** : ses conditions d'utilisation l'interdisent hors de son application. Le panneau YouTube de Cadence se met donc en pause quand tu quittes l'appli ou verrouilles l'écran, et repart au retour. Pour de la musique écran éteint, utilise le mode automatique ou tes fichiers. Le bouton ↗ du panneau ouvre la playlist dans l'application YouTube (en écran partagé Android, Cadence reste visible à côté).
- Si une vidéo de la playlist refuse d'être lue hors de YouTube, Cadence passe à la suivante ; si toute la playlist est bloquée, le panneau propose de réessayer ou d'ouvrir YouTube.
- Le chrono de repos prévient par une notification quand l'application est en arrière-plan.
- Les programmes et l'historique restent sur l'appareil.
- Certains exercices « maison » demandent une paire d'haltères : active « Pas de poids à la maison » en créant le programme pour n'avoir que des exercices au poids du corps.
- Avec peu de muscles (ou sans poids), il peut manquer d'exercices pour remplir la durée : l'écran de durée prévient quand une séance sera nettement plus courte.

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
| `src/music` | Audius, Jamendo, composition de la playlist, lecteur, YouTube (liens et page du lecteur intégré), applications externes |
| `src/notifications` | rappels et fin de repos |
| `src/features`, `src/components`, `src/theme` | interface |
| `src/store` | données sauvegardées sur l'appareil |

Le dossier `android/` n'est pas dans le dépôt : il est généré par `expo prebuild` à partir de `app.json`.

Audius se lit sans clé en s'identifiant par le nom de l'application (`app_name=Cadence`, voir `src/music/audius.ts`). Si Audius exigeait un jour une clé d'API (à créer sur [api.audius.co/plans](https://api.audius.co/plans)), elle s'ajouterait à ces requêtes.
