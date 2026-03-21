# RTL Online - Radio Tabernacle de Likasi

## Overview
Application mobile officielle de la Radio Tabernacle de Likasi (RTL), fréquence 90.2 MHz. L'application permet aux auditeurs d'écouter la radio en direct, consulter le programme, écouter les émissions archivées et contacter la radio.

## Architecture
- **Frontend**: Expo Router avec React Native (tabs: Accueil, Programme, Emissions, Contact)
- **Backend**: Express.js avec API REST
- **Database**: PostgreSQL via Drizzle ORM
- **Audio**: expo-audio pour le lecteur en direct et les émissions

## Key Features
- Lecteur audio en direct avec animation de visualisation
- Grille de programmes par jour de la semaine
- Catalogue d'émissions audio avec lecteur intégré
- Page contact avec liens directs (téléphone, WhatsApp, email, Facebook)

## API Routes
- GET/PUT `/api/stream` - Configuration du flux en direct
- GET/POST/DELETE `/api/programs` - Gestion des programmes
- GET/POST/DELETE `/api/emissions` - Gestion des émissions audio
- GET/PUT `/api/contact` - Informations de contact

## Database Tables
- `stream_config` - URL et configuration du streaming
- `programs` - Programmes radio (titre, jour, horaire, animateur)
- `emissions` - Émissions audio archivées
- `contact_info` - Coordonnées de la radio

## Design
- Thème sombre avec rouge crimson (#C41E3A) et or (#D4AF37)
- Tabs avec support liquid glass iOS 26+
- Animations de visualisation audio avec reanimated

## Recent Changes
- 2026-02-18: Création initiale de l'application
