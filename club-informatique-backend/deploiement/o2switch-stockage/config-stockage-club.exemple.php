<?php
/*
 * Modèle de configuration du coffre à fichiers. À copier sous le nom config-stockage-club.php dans le dossier
 * PARENT de la racine du sous-domaine (jamais dans la racine elle-même), puis à compléter.
 * Ce fichier rempli contient un secret : il ne doit jamais être ajouté au dépôt.
 */
return [
    // Même valeur que la variable STORAGE_RELAIS_CLE du backend : 64 caractères aléatoires au moins.
    'cle' => 'A_REMPLACER',
    // Dossier des fichiers, hors de toute racine web. Exemple : /home/<identifiant cPanel>/stockage-club
    'dossier' => '/home/IDENTIFIANT/stockage-club',
];
