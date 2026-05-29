# Saga-wedding

Saga-wedding est une application de bureau complète développée avec Electron et React, conçue pour faciliter la gestion et l'organisation d'événements de mariage. Elle intègre des fonctionnalités telles que la gestion de calendrier, la génération de documents (PDF, Excel) et la gestion de base de données locale (SQLite).

## Description Technique

Ce projet repose sur une architecture moderne utilisant **Electron** pour l'application de bureau et **React** pour l'interface utilisateur, le tout propulsé par **Electron-Vite** pour un développement et un build optimisés.

### Stack et Bibliothèques Principales :
- **Frontend** : React 19, React Router DOM pour la navigation, Lucide React pour les icônes.
- **Gestionnaire de Calendrier** : FullCalendar (`@fullcalendar/react`, `daygrid`, `interaction`) pour l'organisation des événements.
- **Génération de Documents** : jsPDF et jsPDF-AutoTable (pour les exports PDF), ExcelJS et File-saver (pour les exports Excel).
- **Base de données** : SQLite3 pour le stockage local sécurisé et performant des données.
- **Outils de développement & Packaging** : Vite, ESLint, Prettier, Electron-Builder (pour la compilation multiplateforme).

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
