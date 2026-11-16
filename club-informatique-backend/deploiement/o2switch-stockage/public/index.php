<?php
/*
 * Coffre à fichiers de la plateforme du Club Informatique de l'IST, hébergé sur o2switch.
 *
 * Seul le backend s'en sert : chaque requête porte la clé secrète dans l'en-tête X-Cle-Stockage.
 * Les fichiers sont rangés dans un dossier hors de la racine web ; ce script est la seule porte d'accès.
 *
 *   GET  ?action=sante                    vérifie la configuration (clé exigée)
 *   GET  ?cle=2026/11/<id>                renvoie le contenu (404 s'il n'existe pas)
 *   POST ?action=enregistrer&cle=...      enregistre le corps de la requête (remplace un contenu existant)
 *   POST ?action=supprimer&cle=...        supprime le contenu (sans erreur s'il n'existe pas)
 *
 * Réglages : fichier config-stockage-club.php placé dans le dossier parent de la racine du sous-domaine
 * (modèle : config-stockage-club.exemple.php).
 */

declare(strict_types=1);

const TAILLE_MAXIMALE = 12 * 1024 * 1024; // 10 Mo acceptés par le backend, plus une marge.

function repondre(int $statut, string $message = ''): never
{
    http_response_code($statut);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    echo $message;
    exit;
}

$fichierConfig = dirname(__DIR__) . '/config-stockage-club.php';
if (!is_file($fichierConfig)) {
    repondre(500, 'configuration absente');
}
$config = require $fichierConfig;
$secret = (string) ($config['cle'] ?? '');
$dossier = rtrim((string) ($config['dossier'] ?? ''), '/\\');
if (strlen($secret) < 32 || $dossier === '') {
    repondre(500, 'configuration incomplete');
}

// Authentification : comparaison à durée constante, aucune indication sur la cause du refus.
$presentee = (string) ($_SERVER['HTTP_X_CLE_STOCKAGE'] ?? '');
if (!hash_equals($secret, $presentee)) {
    repondre(403, 'refuse');
}

$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = (string) ($_GET['action'] ?? '');

if ($methode === 'GET' && $action === 'sante') {
    if (!is_dir($dossier) && !mkdir($dossier, 0700, true)) {
        repondre(500, 'dossier de stockage impossible a creer');
    }
    if (!is_writable($dossier)) {
        repondre(500, 'dossier de stockage non inscriptible');
    }
    repondre(200, 'ok');
}

// Clé attribuée par le backend : segments alphanumériques séparés par « / », jamais « .. ».
$cle = (string) ($_GET['cle'] ?? '');
if (!preg_match('#^[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+){0,5}$#', $cle)) {
    repondre(400, 'cle invalide');
}
$chemin = $dossier . '/' . $cle;

if ($methode === 'GET' && $action === '') {
    if (!is_file($chemin)) {
        repondre(404, 'absent');
    }
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . filesize($chemin));
    header('Cache-Control: no-store');
    while (ob_get_level() > 0) {
        ob_end_clean();
    }
    readfile($chemin);
    exit;
}

if ($methode === 'POST' && $action === 'enregistrer') {
    $annonce = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($annonce > TAILLE_MAXIMALE) {
        repondre(413, 'fichier trop volumineux');
    }
    $parent = dirname($chemin);
    if (!is_dir($parent) && !mkdir($parent, 0700, true)) {
        repondre(500, 'dossier impossible a creer');
    }
    // Écriture dans un fichier provisoire, puis renommage : un contenu n'est jamais visible à moitié écrit.
    $provisoire = $parent . '/.depot-' . bin2hex(random_bytes(8));
    $entree = fopen('php://input', 'rb');
    $sortie = fopen($provisoire, 'xb');
    if ($entree === false || $sortie === false) {
        repondre(500, 'ecriture impossible');
    }
    $total = 0;
    while (!feof($entree)) {
        $morceau = fread($entree, 1024 * 1024);
        if ($morceau === false) {
            break;
        }
        $total += strlen($morceau);
        if ($total > TAILLE_MAXIMALE) {
            fclose($sortie);
            unlink($provisoire);
            repondre(413, 'fichier trop volumineux');
        }
        fwrite($sortie, $morceau);
    }
    fclose($entree);
    fclose($sortie);
    if ($annonce > 0 && $total !== $annonce) {
        unlink($provisoire);
        repondre(400, 'contenu incomplet');
    }
    if (!rename($provisoire, $chemin)) {
        unlink($provisoire);
        repondre(500, 'enregistrement impossible');
    }
    chmod($chemin, 0600);
    repondre(204);
}

if ($methode === 'POST' && $action === 'supprimer') {
    if (is_file($chemin) && !unlink($chemin)) {
        repondre(500, 'suppression impossible');
    }
    repondre(204);
}

repondre(405, 'operation inconnue');
