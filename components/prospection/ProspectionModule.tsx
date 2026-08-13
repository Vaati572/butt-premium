"use client"

import { useState } from "react"

interface Props { activeSociety: any; profile: any }

const PARIS_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<script>
// Polyfill window.storage -> localStorage avec préfixe unique
window.storage = {
  get: async function(key) {
    try {
      const v = localStorage.getItem('butt_prosp_paris_' + key);
      return v ? {value: v} : null;
    } catch(e) { return null; }
  },
  set: async function(key, value) {
    try {
      localStorage.setItem('butt_prosp_paris_' + key, value);
      return {key, value};
    } catch(e) { return null; }
  },
  delete: async function(key) {
    try {
      localStorage.removeItem('butt_prosp_paris_' + key);
      return {key, deleted: true};
    } catch(e) { return null; }
  }
};
</script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prospection Pharmacies Paris — Butt Premium</title>
<style>
  :root{
    --rose:#c9436e;
    --rose-dark:#a3325a;
    --rose-light:#fbe8ee;
    --ink:#1f1a1d;
    --muted:#7c6f74;
    --line:#ecdfe3;
    --bg:#fffaf9;
    --card:#ffffff;
    --done:#e8f4ec;
    --done-line:#8fc9a3;
    --done-ink:#2e7d4f;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
    background:var(--bg);
    color:var(--ink);
  }
  header{
    background:linear-gradient(135deg,var(--rose),var(--rose-dark));
    color:#fff;
    padding:28px 24px 22px;
    position:sticky;
    top:0;
    z-index:20;
    box-shadow:0 4px 16px rgba(163,50,90,.25);
  }
  header h1{
    margin:0 0 4px;
    font-size:22px;
    letter-spacing:.2px;
  }
  header p{
    margin:0;
    font-size:13px;
    opacity:.92;
  }
  .stats{
    display:flex;
    gap:10px;
    margin-top:16px;
    flex-wrap:wrap;
  }
  .stat{
    background:rgba(255,255,255,.15);
    border:1px solid rgba(255,255,255,.3);
    border-radius:10px;
    padding:8px 14px;
    font-size:13px;
    min-width:110px;
  }
  .stat b{ display:block; font-size:20px; }

  .progress-wrap{
    margin-top:14px;
    height:8px;
    background:rgba(255,255,255,.25);
    border-radius:6px;
    overflow:hidden;
  }
  .progress-bar{
    height:100%;
    background:#fff;
    width:0%;
    transition:width .3s ease;
  }

  .toolbar{
    max-width:1100px;
    margin:20px auto 0;
    padding:0 20px;
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    align-items:center;
  }
  .toolbar input[type="text"]{
    flex:1;
    min-width:200px;
    padding:10px 14px;
    border:1px solid var(--line);
    border-radius:10px;
    font-size:14px;
    background:#fff;
  }
  .toolbar select{
    padding:10px 14px;
    border:1px solid var(--line);
    border-radius:10px;
    font-size:14px;
    background:#fff;
    color:var(--ink);
  }
  .toolbar button{
    padding:10px 16px;
    border-radius:10px;
    border:1px solid var(--line);
    background:#fff;
    cursor:pointer;
    font-size:13px;
    color:var(--ink);
    transition:.15s;
  }
  .toolbar button:hover{ border-color:var(--rose); color:var(--rose-dark); }
  .toolbar button.reset{ color:#a33; border-color:#f0cccc; }
  .toolbar button.reset:hover{ background:#fff5f5; }

  main{
    max-width:1100px;
    margin:0 auto;
    padding:16px 20px 60px;
  }

  .zone-group{
    margin-top:26px;
  }
  .zone-title{
    font-size:14px;
    font-weight:700;
    color:var(--rose-dark);
    text-transform:uppercase;
    letter-spacing:.5px;
    margin:0 0 10px 2px;
    display:flex;
    align-items:center;
    gap:8px;
  }
  .zone-title .count{
    font-weight:400;
    color:var(--muted);
    font-size:12px;
    text-transform:none;
    letter-spacing:0;
  }

  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(300px,1fr));
    gap:12px;
  }

  .card{
    background:var(--card);
    border:1px solid var(--line);
    border-radius:14px;
    padding:14px 16px;
    transition:.15s;
    position:relative;
  }
  .card.done{
    background:var(--done);
    border-color:var(--done-line);
  }
  .card-top{
    display:flex;
    gap:10px;
    align-items:flex-start;
  }
  .checkbox{
    margin-top:3px;
    width:20px;
    height:20px;
    flex:none;
    accent-color:var(--rose);
    cursor:pointer;
  }
  .card.done .checkbox{ accent-color:var(--done-ink); }

  .card-body{ flex:1; min-width:0; }
  .name{
    font-size:15px;
    font-weight:600;
    margin:0 0 3px;
    color:var(--ink);
  }
  .card.done .name{ color:var(--done-ink); text-decoration:line-through; text-decoration-color:var(--done-line); }
  .addr{ font-size:12.5px; color:var(--muted); margin:0 0 6px; }
  .meta{ font-size:12.5px; color:var(--ink); display:flex; flex-direction:column; gap:3px; }
  .meta span.icon{ opacity:.7; margin-right:4px; }
  .meta a{ color:var(--rose-dark); text-decoration:none; }
  .meta a:hover{ text-decoration:underline; }

  .status-row{
    margin-top:10px;
    display:flex;
    gap:6px;
    flex-wrap:wrap;
  }
  .tag-btn{
    font-size:11px;
    padding:4px 9px;
    border-radius:20px;
    border:1px solid var(--line);
    background:#fff;
    cursor:pointer;
    color:var(--muted);
  }
  .tag-btn.active{
    background:var(--rose-light);
    border-color:var(--rose);
    color:var(--rose-dark);
    font-weight:600;
  }

  .note-input{
    margin-top:8px;
    width:100%;
    font-size:12.5px;
    padding:6px 9px;
    border:1px solid var(--line);
    border-radius:8px;
    background:#fffdfb;
    color:var(--ink);
    resize:vertical;
    min-height:30px;
    font-family:inherit;
  }

  .empty{
    text-align:center;
    color:var(--muted);
    padding:40px 0;
    font-size:14px;
  }

  footer{
    text-align:center;
    color:var(--muted);
    font-size:12px;
    padding:20px 0 40px;
  }

  @media (max-width:600px){
    header{padding:20px 16px 18px;}
    .toolbar{padding:0 14px;}
    main{padding:12px 14px 40px;}
    .grid{grid-template-columns:1fr;}
  }
</style>
</head>
<body>

<header>
  <h1>💊 Prospection Pharmacies — Paris</h1>
  <p>Démarchage gamme de soin Butt Premium · cochez au fur et à mesure de vos visites</p>
  <div class="stats">
    <div class="stat"><b id="stat-total">0</b>Pharmacies</div>
    <div class="stat"><b id="stat-done">0</b>Visitées</div>
    <div class="stat"><b id="stat-interested">0</b>Intéressées</div>
    <div class="stat"><b id="stat-remaining">0</b>Restantes</div>
  </div>
  <div class="progress-wrap"><div class="progress-bar" id="progress-bar"></div></div>
</header>

<div class="toolbar">
  <input type="text" id="search" placeholder="Rechercher par nom, adresse ou code postal...">
  <select id="filter-status">
    <option value="all">Tous les statuts</option>
    <option value="todo">À faire</option>
    <option value="done">Visitée</option>
    <option value="interested">Intéressée</option>
    <option value="refused">Refusé</option>
  </select>
  <select id="filter-zone">
    <option value="all">Tous les arrondissements</option>
  </select>
  <button id="export-btn">📥 Exporter CSV</button>
  <button id="reset-btn" class="reset">🗑 Réinitialiser</button>
</div>

<main id="main">
  <div class="empty" id="loading">Chargement des pharmacies…</div>
</main>

<footer>Données de localisation issues de Google Places · pas d'adresse e-mail publique disponible pour la plupart des pharmacies, contactez-les par téléphone ou sur place.</footer>

<script id="pharmacy-data" type="application/json">[{"name": "Pharmacie du Palais Royal", "address": "164 Rue Saint-Honoré, 75001 Paris", "phone": "+33 1 42 60 34 36", "hours": "Lun-Ven 8h-22h, Sam-Dim 9h-22h", "cp": "75001", "id": "pharmacie-du-palais-royal-75001"}, {"name": "Pharmacie Saint Honoré", "address": "115 Rue Saint-Honoré, 75001 Paris", "phone": "+33 1 45 08 15 87", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75001", "id": "pharmacie-saint-honor-75001"}, {"name": "Pharmacie du Forum Des Halles", "address": "1 Rue Pierre Lescot, 75001 Paris", "phone": "+33 1 40 41 90 80", "hours": "Lun-Sam 8h30-20h20, Dim 10h-19h50", "cp": "75001", "id": "pharmacie-du-forum-des-halles-75001"}, {"name": "Pharmacie des Pyramides", "address": "9 Rue des Pyramides, 75001 Paris", "phone": "+33 1 42 60 42 56", "hours": "Lun-Ven 8h30-20h, Sam 9h30-20h, Dim fermé", "cp": "75001", "id": "pharmacie-des-pyramides-75001"}, {"name": "Pharmacie Louvre Rivoli", "address": "2 Rue du Roule, 75001 Paris", "phone": "+33 1 42 36 80 73", "hours": "Lun-Sam 9h-20h, Dim 11h-19h", "cp": "75001", "id": "pharmacie-louvre-rivoli-75001"}, {"name": "Pharmacie Avenue De L'Opéra", "address": "20 Av. de l'Opéra, 75001 Paris", "phone": "+33 1 40 13 04 65", "hours": "Lun-Sam 8h30-19h55, Dim fermé", "cp": "75001", "id": "pharmacie-avenue-de-l-op-ra-75001"}, {"name": "La Pharmacie du Théâtre Français", "address": "2 Pl. André Malraux, 75001 Paris", "phone": "+33 1 42 96 29 33", "hours": "Lun-Ven 8h-22h, Sam 10h-21h, Dim 9h-22h", "cp": "75001", "id": "la-pharmacie-du-th-tre-fran-ais-75001"}, {"name": "Pharmacie du Marché Saint Honoré", "address": "7 Rue du Marché Saint-Honoré, 75001 Paris", "phone": "+33 1 42 61 00 49", "hours": "Lun-Ven 8h30-20h, Sam 9h-19h, Dim fermé", "cp": "75001", "id": "pharmacie-du-march-saint-honor-75001"}, {"name": "Pharmacie du Louvre", "address": "38 Rue du Louvre, 75001 Paris", "phone": "+33 1 42 36 01 35", "hours": "Lun-Ven 9h30-19h, Sam 11h-18h, Dim fermé", "cp": "75001", "id": "pharmacie-du-louvre-75001"}, {"name": "Citypharma", "address": "26 Rue du Four, 75006 Paris", "phone": "+33 1 46 33 20 81", "hours": "Lun-Ven 8h30-21h, Sam 12h-20h, Dim 11h-20h", "cp": "75006", "id": "citypharma-75006"}, {"name": "Grande Pharmacie de la bourse - Boticinal", "address": "1 Rue du 4 septembre, 75002 Paris", "phone": "+33 1 42 36 16 67", "hours": "Lun-Ven 9h-14h/15h-19h, Sam 12h-19h, Dim fermé", "cp": "75002", "id": "grande-pharmacie-de-la-bourse-boticinal-75002"}, {"name": "Pharmacy Montorgueil Parispharma", "address": "67 Rue Montorgueil, 75002 Paris", "phone": "+33 1 42 36 81 00", "hours": "Lun-Sam 8h30-20h30, Dim 9h-20h", "cp": "75002", "id": "pharmacy-montorgueil-parispharma-75002"}, {"name": "Pharmacie Opéra Garnier - Choiseul", "address": "23 Rue de Choiseul, 75002 Paris", "phone": "+33 7 81 00 97 93", "hours": "Lun-Mar 8h30-21h30, Mer-Dim variable, voir sur place", "cp": "75002", "id": "pharmacie-op-ra-garnier-choiseul-75002"}, {"name": "Pharmacie Opéra casanova", "address": "6 Rue Danielle Casanova, 75002 Paris", "phone": "+33 1 42 61 48 93", "hours": "Lun-Ven 9h-19h, Sam-Dim fermé", "cp": "75002", "id": "pharmacie-op-ra-casanova-75002"}, {"name": "Pharmacie des Grands Boulevards", "address": "178 Rue Montmartre, 75002 Paris", "phone": "+33 1 42 33 23 96", "hours": "Lun-Ven 8h-20h, Sam 11h-20h, Dim fermé", "cp": "75002", "id": "pharmacie-des-grands-boulevards-75002"}, {"name": "Pharmacie du Sentier", "address": "247 Rue St Denis, 75002 Paris", "phone": "+33 1 42 36 71 92", "hours": "Lun-Ven 9h-20h, Sam 13h30-18h, Dim fermé", "cp": "75002", "id": "pharmacie-du-sentier-75002"}, {"name": "Pharmacie Vendôme", "address": "8 Rue des Capucines, 75002 Paris", "phone": "+33 1 42 61 03 07", "hours": "Lun-Dim 9h-21h30", "cp": "75002", "id": "pharmacie-vend-me-75002"}, {"name": "Pharmacie Pharmavance Centrale Turbigo", "address": "29 R. de Turbigo, 75002 Paris", "phone": "+33 1 45 08 51 08", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75002", "id": "pharmacie-pharmavance-centrale-turbigo-75002"}, {"name": "Pharmacie Moderne du Sentier", "address": "7 Rue des Petits Carreaux, 75002 Paris", "phone": "+33 1 45 08 53 16", "hours": "Lun-Ven 8h-20h, Sam 8h30-20h, Dim fermé", "cp": "75002", "id": "pharmacie-moderne-du-sentier-75002"}, {"name": "Pharmacie Des Panoramas", "address": "151 Rue Montmartre, 75002 Paris", "phone": "+33 1 42 36 84 37", "hours": "Lun-Ven 8h30-20h, Sam-Dim fermé", "cp": "75002", "id": "pharmacie-des-panoramas-75002"}, {"name": "Pharmacie de la Place de la République", "address": "5 Pl. de la République, 75003 Paris", "phone": "+33 1 47 00 18 08", "hours": "24h/24 - 7j/7", "cp": "75003", "id": "pharmacie-de-la-place-de-la-r-publique-75003"}, {"name": "Pharmacie Pharmavance Beaubourg", "address": "54 Rue Beaubourg, 75003 Paris", "phone": "+33 1 42 72 24 44", "hours": "Lun-Ven 9h-13h30/14h30-19h, Sam-Dim fermé", "cp": "75003", "id": "pharmacie-pharmavance-beaubourg-75003"}, {"name": "Pharmacie de Bretagne", "address": "10 Rue de Bretagne, 75003 Paris", "phone": "+33 1 42 78 43 31", "hours": "Lun-Sam 8h30-20h, Dim fermé", "cp": "75003", "id": "pharmacie-de-bretagne-75003"}, {"name": "Pharmacy Metro Temple", "address": "172 Rue du Temple, 75003 Paris", "phone": "+33 1 42 72 12 39", "hours": "Lun-Jeu 9h-20h, Ven 8h-20h, Sam-Dim fermé", "cp": "75003", "id": "pharmacy-metro-temple-75003"}, {"name": "Pharmacie Beaubourg", "address": "54 Rue Rambuteau, 75003 Paris", "phone": "+33 1 48 87 78 19", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75003", "id": "pharmacie-beaubourg-75003"}, {"name": "Pharmacie La Croix de Malte", "address": "53 Bd Saint-Martin, 75003 Paris", "phone": "+33 1 42 72 29 03", "hours": "Lun-Ven 8h15-20h30, Sam 9h-20h30, Dim fermé", "cp": "75003", "id": "pharmacie-la-croix-de-malte-75003"}, {"name": "Pharmacie Canonne", "address": "88 Bd de Sébastopol, 75003 Paris", "phone": "+33 1 42 77 57 57", "hours": "Lun-Sam 8h30-20h, Dim fermé", "cp": "75003", "id": "pharmacie-canonne-75003"}, {"name": "Pharmacie Saint Gilles", "address": "47 Rue de Turenne, 75003 Paris", "phone": "+33 1 40 27 06 21", "hours": "Lun-Ven 8h-20h, Sam-Dim 9h30-19h30", "cp": "75003", "id": "pharmacie-saint-gilles-75003"}, {"name": "Grande Pharmacie de Turenne", "address": "95 Rue de Turenne, 75003 Paris", "phone": "+33 1 42 78 42 63", "hours": "Lun-Ven 9h-20h, Sam 10h-20h, Dim fermé", "cp": "75003", "id": "grande-pharmacie-de-turenne-75003"}, {"name": "Univers Pharmacie - Grande Pharmacie Première", "address": "24 Bd de Sébastopol, 75004 Paris", "phone": "+33 1 48 87 62 30", "hours": "Lun-Sam 9h-20h, Dim 10h-20h", "cp": "75004", "id": "univers-pharmacie-grande-pharmacie-premi-re-75004"}, {"name": "St. Paul Pharmacy", "address": "71 Rue Saint-Antoine, 75004 Paris", "phone": "+33 1 48 87 79 55", "hours": "Lun-Dim 8h30-21h", "cp": "75004", "id": "st-paul-pharmacy-75004"}, {"name": "Pharmacie Du Marais", "address": "119 Rue Saint-Antoine, 75004 Paris", "phone": "+33 1 42 72 20 44", "hours": "Lun-Sam 8h30-21h, Dim 9h30-21h", "cp": "75004", "id": "pharmacie-du-marais-75004"}, {"name": "Pharmacy Archives", "address": "2 Rue des Archives, 75004 Paris", "phone": "+33 1 42 78 45 56", "hours": "Lun-Ven 8h30-20h30, Sam 9h-20h30, Dim 10h-20h30", "cp": "75004", "id": "pharmacy-archives-75004"}, {"name": "Pharmacie Lafayette Des Halles Paris 4", "address": "10 Bd de Sébastopol, 75004 Paris", "phone": "+33 1 42 72 03 23", "hours": "Lun-Dim 8h30-20h45", "cp": "75004", "id": "pharmacie-lafayette-des-halles-paris-4-75004"}, {"name": "Pharmacie Rivoli", "address": "13 Rue de Rivoli, 75004 Paris", "phone": "+33 1 48 87 61 85", "hours": "Lun-Sam 9h30-20h30, Dim 11h-20h30", "cp": "75004", "id": "pharmacie-rivoli-75004"}, {"name": "Pharmacie de la Mairie", "address": "9 Rue des Archives, 75004 Paris", "phone": "+33 1 42 78 53 58", "hours": "Lun-Dim 9h-20h", "cp": "75004", "id": "pharmacie-de-la-mairie-75004"}, {"name": "Pharmacie PARIS BASTILLE", "address": "1 Rue des Tournelles, 75004 Paris", "phone": "+33 1 42 72 67 43", "hours": "Lun-Ven 9h-20h, Sam-Dim fermé", "cp": "75004", "id": "pharmacie-paris-bastille-75004"}, {"name": "Pharmacie Henri IV", "address": "27 Bd Henri IV, 75004 Paris", "phone": "+33 1 48 87 74 47", "hours": "Lun-Ven 9h-19h (Mer 19h30), Sam-Dim fermé", "cp": "75004", "id": "pharmacie-henri-iv-75004"}, {"name": "Pharmacie de la Bastille Paris 4", "address": "3 Bd Beaumarchais, 75004 Paris", "phone": "+33 1 42 72 38 31", "hours": "Lun-Dim 9h-21h", "cp": "75004", "id": "pharmacie-de-la-bastille-paris-4-75004"}, {"name": "Pharmacie Monge Notre Dame", "address": "1 Pl. Monge, 75005 Paris", "phone": "+33 1 43 31 39 44", "hours": "Lun-Dim 8h-20h", "cp": "75005", "id": "pharmacie-monge-notre-dame-75005"}, {"name": "Pharmacie 5", "address": "20 Rue des Écoles, 75005 Paris", "phone": "+33 1 43 26 80 84", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75005", "id": "pharmacie-5-75005"}, {"name": "PHARMACIE DE LA SORBONNE", "address": "49 Rue des Écoles, 75005 Paris", "phone": "+33 1 43 54 76 98", "hours": "Lun-Dim 8h-20h", "cp": "75005", "id": "pharmacie-de-la-sorbonne-75005"}, {"name": "Pharmacy Observatory", "address": "100 Bd de Port-Royal, 75005 Paris", "phone": "+33 1 43 54 09 70", "hours": "Lun-Ven 9h-19h, Sam fermé, Dim 8h-20h", "cp": "75005", "id": "pharmacy-observatory-75005"}, {"name": "Pharmacie Saint-Hilaire", "address": "18 Rue Geoffroy-Saint-Hilaire, 75005 Paris", "phone": "+33 1 47 07 08 68", "hours": "Lun-Sam 8h30-20h, Dim fermé", "cp": "75005", "id": "pharmacie-saint-hilaire-75005"}, {"name": "Pharmacie Maubert - Coté pharma", "address": "50 Bd Saint-Germain, 75005 Paris", "phone": "+33 1 43 54 48 21", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75005", "id": "pharmacie-maubert-cot-pharma-75005"}, {"name": "Pharmacie Saint Marcel", "address": "76 Bd Saint-Marcel, 75005 Paris", "phone": "+33 1 43 31 20 60", "hours": "Lun-Ven 8h30-20h30, Sam 9h-20h, Dim fermé", "cp": "75005", "id": "pharmacie-saint-marcel-75005"}, {"name": "Pharmacie du 5e", "address": "89 Rue Mouffetard, 75005 Paris", "phone": "+33 1 43 31 41 44", "hours": "Lun-Sam 9h30-19h30, Dim fermé", "cp": "75005", "id": "pharmacie-du-5e-75005"}, {"name": "Pharmacie Centrale des Écoles", "address": "6 Rue des Écoles, 75005 Paris", "phone": "+33 1 43 26 82 40", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75005", "id": "pharmacie-centrale-des-coles-75005"}, {"name": "LA GRANDE PHARMACIE DU 5", "address": "2 Rue Claude Bernard, 75005 Paris", "phone": "+33 1 43 31 06 99", "hours": "Lun-Ven 8h30-20h, Sam 9h-19h30, Dim fermé", "cp": "75005", "id": "la-grande-pharmacie-du-5-75005"}, {"name": "Pharmacie Paris Rive Gauche", "address": "10-12 Bd Saint-Michel, 75006 Paris", "phone": "+33 1 43 26 92 66", "hours": "Lun-Jeu 8h-21h, Ven-Dim 9h/10h-21h", "cp": "75006", "id": "pharmacie-paris-rive-gauche-75006"}, {"name": "Drugstore Saint Germain des Prés", "address": "45 Rue Bonaparte, 75006 Paris", "phone": "+33 1 43 26 52 92", "hours": "Lun-Sam 9h30-20h, Dim 11h-19h", "cp": "75006", "id": "drugstore-saint-germain-des-pr-s-75006"}, {"name": "Pharmacie Mabillon Saint Germain", "address": "8 Rue du Four, 75006 Paris", "phone": "+33 1 43 26 09 25", "hours": "Lun-Sam 9h-20h, Dim 9h-19h", "cp": "75006", "id": "pharmacie-mabillon-saint-germain-75006"}, {"name": "Pharmacie Saint-Sulpice", "address": "18 Rue Saint-Sulpice, 75006 Paris", "phone": "+33 1 43 26 01 29", "hours": "Lun-Sam 9h-19h30, Dim fermé", "cp": "75006", "id": "pharmacie-saint-sulpice-75006"}, {"name": "Pharmacy Rennes Assas", "address": "105 Rue de Rennes, 75006 Paris", "phone": "+33 1 45 48 80 76", "hours": "Lun-Jeu 8h30-20h, Ven-Dim fermé", "cp": "75006", "id": "pharmacy-rennes-assas-75006"}, {"name": "PHARMACIE SAINT-PLACIDE", "address": "58 Rue Saint-Placide, 75006 Paris", "phone": "+33 1 45 48 40 43", "hours": "Lun-Sam 8h30-20h, Dim fermé", "cp": "75006", "id": "pharmacie-saint-placide-75006"}, {"name": "Pharmacie Odéon", "address": "97 Bd Saint-Germain, 75006 Paris", "phone": "+33 1 43 26 07 16", "hours": "Lun-Ven 9h-19h30, Sam-Dim fermé", "cp": "75006", "id": "pharmacie-od-on-75006"}, {"name": "PHARMACIE DE SEVRES", "address": "119 Rue de Sèvres, 75006 Paris", "phone": "+33 1 47 34 36 64", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75006", "id": "pharmacie-de-sevres-75006"}, {"name": "Pharmacie d'Assas", "address": "19 Rue de Fleurus, 75006 Paris", "phone": "+33 1 88 61 07 75", "hours": "Lun-Ven 9h-20h, Sam 9h-19h30, Dim fermé", "cp": "75006", "id": "pharmacie-d-assas-75006"}, {"name": "Pharmacie du 7ème - S. ASSADI", "address": "18 Bis Av. de la Motte-Picquet, 75007 Paris", "phone": "+33 1 45 51 31 82", "hours": "Lun-Ven 9h-20h, Sam-Dim fermé", "cp": "75007", "id": "pharmacie-du-7-me-s-assadi-75007"}, {"name": "Pharmacy Babylon", "address": "6 Rue de Babylone, 75007 Paris", "phone": "+33 1 43 31 31 00", "hours": "Lun-Dim 9h-20h", "cp": "75007", "id": "pharmacy-babylon-75007"}, {"name": "La Pharmacie parisienne", "address": "104 Rue Saint-Dominique, 75007 Paris", "phone": "+33 1 47 05 83 95", "hours": "Lun-Ven 8h30-20h, Sam-Dim 9h-20h", "cp": "75007", "id": "la-pharmacie-parisienne-75007"}, {"name": "PHARMACIE PARIS EIFFEL SELARL", "address": "114 Rue Saint-Dominique, 75007 Paris", "phone": "+33 1 47 05 45 80", "hours": "Lun-Ven 9h-20h, Sam-Dim 10h-20h", "cp": "75007", "id": "pharmacie-paris-eiffel-selarl-75007"}, {"name": "Pharmacie d'Orsay", "address": "6 Rue de Bellechasse, 75007 Paris", "phone": "+33 1 45 51 65 16", "hours": "Lun 10h30-20h, Mar-Sam 9h-20h, Dim 10h-19h", "cp": "75007", "id": "pharmacie-d-orsay-75007"}, {"name": "Pharmacie Cotinat", "address": "151 Rue de Grenelle, 75007 Paris", "phone": "+33 1 42 73 00 25", "hours": "Lun-Ven 8h30-19h30, Sam 9h-19h30, Dim fermé", "cp": "75007", "id": "pharmacie-cotinat-75007"}, {"name": "La Grande Pharmacie du Bac", "address": "70 Rue du Bac, 75007 Paris", "phone": "+33 1 45 48 99 74", "hours": "Lun-Sam 9h-20h, Dim 10h-20h", "cp": "75007", "id": "la-grande-pharmacie-du-bac-75007"}, {"name": "Pharmacie de la Comete", "address": "75 Rue Saint-Dominique, 75007 Paris", "phone": "+33 1 45 51 63 67", "hours": "Lun-Ven 8h-20h, Sam 8h30-20h, Dim fermé", "cp": "75007", "id": "pharmacie-de-la-comete-75007"}, {"name": "Pharmacie MAYER - Saxe", "address": "2 Rue Léon Vaudoyer, 75007 Paris", "phone": "+33 1 47 34 80 51", "hours": "Lun-Ven 9h30-12h30/13h30-19h30, Sam 9h30-19h, Dim fermé", "cp": "75007", "id": "pharmacie-mayer-saxe-75007"}, {"name": "Pharmacie Saint Dominique", "address": "88 Rue Saint-Dominique, 75007 Paris", "phone": "+33 1 47 05 58 54", "hours": "Lun-Sam 9h-21h, Dim fermé", "cp": "75007", "id": "pharmacie-saint-dominique-75007"}, {"name": "Pharmacie des Arts Elysées", "address": "27 Rue de Miromesnil, 75008 Paris", "phone": "+33 1 42 65 27 49", "hours": "Lun-Ven 8h/8h30-20h, Sam 9h-13h, Dim fermé", "cp": "75008", "id": "pharmacie-des-arts-elys-es-75008"}, {"name": "Pharmacie La Boétie Champs Elysées", "address": "116 Rue La Boétie, 75008 Paris", "phone": "+33 1 43 59 35 50", "hours": "Lun-Ven 8h30-20h30, Sam 9h-20h, Dim 10h-19h30", "cp": "75008", "id": "pharmacie-la-bo-tie-champs-elys-es-75008"}, {"name": "Aprium Pharmacie Anglaise", "address": "62 Av. des Champs-Élysées, 75008 Paris", "phone": "+33 1 43 59 22 52", "hours": "Lun-Dim 9h-00h", "cp": "75008", "id": "aprium-pharmacie-anglaise-75008"}, {"name": "Haussmann Laborde Pharmacy", "address": "130 Bd Haussmann, 75008 Paris", "phone": "+33 1 45 22 16 72", "hours": "Lun-Ven 9h-20h, Sam 10h-20h, Dim fermé", "cp": "75008", "id": "haussmann-laborde-pharmacy-75008"}, {"name": "La Grande Pharmacie Bailly", "address": "108-110 Rue Saint-Lazare, 75008 Paris", "phone": "+33 1 53 42 10 10", "hours": "Lun-Ven 8h-20h, Sam 10h-19h, Dim fermé", "cp": "75008", "id": "la-grande-pharmacie-bailly-75008"}, {"name": "Selarl Grande Pharmacie Wagram", "address": "239 Rue du Faubourg Saint-Honoré, 75008 Paris", "phone": "+33 1 42 67 27 60", "hours": "Lun-Sam 9h-21h, Dim 9h-20h", "cp": "75008", "id": "selarl-grande-pharmacie-wagram-75008"}, {"name": "Pharmacie Du Roule", "address": "71 Av. Franklin Delano Roosevelt, 75008 Paris", "phone": "+33 1 43 59 17 46", "hours": "Lun-Ven 8h30-20h, Sam 9h30-20h, Dim fermé", "cp": "75008", "id": "pharmacie-du-roule-75008"}, {"name": "Pharmacie Sourire", "address": "58 Rue de Miromesnil, 75008 Paris", "phone": "+33 1 45 22 18 87", "hours": "Lun-Ven 8h-20h15, Sam 9h-14h, Dim fermé", "cp": "75008", "id": "pharmacie-sourire-75008"}, {"name": "Pharmacie des Champs-Élysées - Boticinal", "address": "84 Av. des Champs-Élysées, 75008 Paris", "phone": "+33 1 45 62 02 41", "hours": "Lun-Ven 9h-20h, Sam 9h30-20h, Dim 10h-20h", "cp": "75008", "id": "pharmacie-des-champs-lys-es-boticinal-75008"}, {"name": "Pharmacie du Rond Point des Champs", "address": "49bis Av. Franklin Delano Roosevelt, 75008 Paris", "phone": "+33 1 43 59 23 71", "hours": "Lun-Ven 8h30-20h, Sam 10h-20h, Dim fermé", "cp": "75008", "id": "pharmacie-du-rond-point-des-champs-75008"}, {"name": "PHARMACIE CADET LAFAYETTE", "address": "66 Rue La Fayette, 75009 Paris", "phone": "+33 1 47 70 80 58", "hours": "Lun-Ven 9h-19h, Sam-Dim fermé", "cp": "75009", "id": "pharmacie-cadet-lafayette-75009"}, {"name": "Pharmacie Centrale Martyrs", "address": "36 R. des Martyrs, 75009 Paris", "phone": "+33 1 48 78 10 04", "hours": "Lun-Ven 9h-13h/14h-20h, Sam fermé, Dim 9h-13h/14h-20h", "cp": "75009", "id": "pharmacie-centrale-martyrs-75009"}, {"name": "Pharmacie Chaussée d'Antin", "address": "52-54 Rue de la Chau. d'Antin, 75009 Paris", "phone": "+33 1 48 74 21 06", "hours": "Lun-Ven 8h-20h30, Sam 9h30-20h30, Dim 10h-20h", "cp": "75009", "id": "pharmacie-chauss-e-d-antin-75009"}, {"name": "Pharmacie de la Trinité", "address": "57 Rue de Châteaudun, 75009 Paris", "phone": "+33 1 48 74 13 13", "hours": "Lun-Ven 8h30-20h, Sam 9h30-19h, Dim fermé", "cp": "75009", "id": "pharmacie-de-la-trinit-75009"}, {"name": "Grande Pharmacie de la Place Blanche", "address": "5 Pl. Blanche, 75009 Paris", "phone": "+33 1 48 74 77 99", "hours": "Lun-Sam 9h-21h, Dim 9h-20h", "cp": "75009", "id": "grande-pharmacie-de-la-place-blanche-75009"}, {"name": "Pharmacie Européenne de la Place de Clichy", "address": "6 Pl. de Clichy, 75009 Paris", "phone": "+33 1 48 74 65 18", "hours": "24h/24 - 7j/7", "cp": "75009", "id": "pharmacie-europ-enne-de-la-place-de-clichy-75009"}, {"name": "Pharmacie Caumartin Opéra", "address": "30 Rue de Caumartin, 75009 Paris", "phone": "+33 1 40 54 62 28", "hours": "Lun-Ven 8h30-20h, Sam-Dim 11h-19h", "cp": "75009", "id": "pharmacie-caumartin-op-ra-75009"}, {"name": "Pharmacie des Galeries", "address": "11 Rue de Mogador, 75009 Paris", "phone": "+33 1 48 74 22 01", "hours": "Lun-Ven 8h30-20h, Sam 9h30-20h, Dim 10h-20h", "cp": "75009", "id": "pharmacie-des-galeries-75009"}, {"name": "Pharmacie de l'Opéra - Boticinal", "address": "1 Rue Auber, 75009 Paris", "phone": "+33 1 42 65 88 29", "hours": "Lun-Dim 8h/9h-20h", "cp": "75009", "id": "pharmacie-de-l-op-ra-boticinal-75009"}, {"name": "Pharmacie Des Théâtres (Pharmavance)", "address": "1 Rue Pierre Fontaine, 75009 Paris", "phone": "+33 1 48 74 29 10", "hours": "Lun-Ven 8h30-00h, Sam 8h30-20h, Dim 10h-20h", "cp": "75009", "id": "pharmacie-des-th-tres-pharmavance-75009"}, {"name": "Pharmacie Pharmavance Mairie du 10", "address": "90 Rue du Faubourg Saint-Martin, 75010 Paris", "phone": "+33 1 42 08 53 08", "hours": "Lun-Dim 9h-19h30", "cp": "75010", "id": "pharmacie-pharmavance-mairie-du-10-75010"}, {"name": "PHARMACIE DU SOLEIL 2 7J/7", "address": "75 Bd de Strasbourg, 75010 Paris", "phone": "+33 1 47 70 31 56", "hours": "Lun-Ven 8h-21h, Sam 9h-21h, Dim 10h-21h", "cp": "75010", "id": "pharmacie-du-soleil-2-7j-7-75010"}, {"name": "PHARMACIE DE LA GARE DU NORD", "address": "18 Rue de Dunkerque, 75010 Paris", "phone": "+33 1 45 26 38 31", "hours": "Lun-Ven 7h-20h30, Sam-Dim 9h-20h", "cp": "75010", "id": "pharmacie-de-la-gare-du-nord-75010"}, {"name": "Pharmacie Pharmavance", "address": "45 Rue du Faubourg Saint-Denis, 75010 Paris", "phone": "+33 1 47 70 34 87", "hours": "Lun-Sam 8h30-20h30, Dim 10h-20h", "cp": "75010", "id": "pharmacie-pharmavance-75010"}, {"name": "Grande pharmacie de la Porte Saint-Denis", "address": "2 Rue du Faubourg Saint-Denis, 75010 Paris", "phone": "+33 1 70 23 37 28", "hours": "Lun-Ven 8h30-20h30, Sam 10h-20h, Dim fermé", "cp": "75010", "id": "grande-pharmacie-de-la-porte-saint-denis-75010"}, {"name": "Central Pharmacy North", "address": "132 Rue La Fayette, 75010 Paris", "phone": "+33 1 47 70 06 14", "hours": "Lun-Ven 8h-20h30, Sam 9h30-20h, Dim 9h-20h", "cp": "75010", "id": "central-pharmacy-north-75010"}, {"name": "pharmacie magenta", "address": "2 Pl. Jacques Bonsergent, 75010 Paris", "phone": "+33 1 42 08 17 80", "hours": "Lun-Sam 8h30-20h, Dim 9h30-20h", "cp": "75010", "id": "pharmacie-magenta-75010"}, {"name": "Pharmacie 217", "address": "217 Rue La Fayette, 75010 Paris", "phone": "+33 1 46 07 86 44", "hours": "Jeu-Ven 9h-13h/14h30-19h30, Sam 9h-13h/14h-20h, Lun-Mer & Dim fermé", "cp": "75010", "id": "pharmacie-217-75010"}, {"name": "Pharmacie Centrale de l'Est", "address": "10 Rue du 8 Mai 1945, 75010 Paris", "phone": "+33 1 40 36 52 75", "hours": "Lun-Ven 8h30-20h30, Sam-Dim fermé", "cp": "75010", "id": "pharmacie-centrale-de-l-est-75010"}, {"name": "Pharmacie Du Canal Saint Martin", "address": "38 Rue Lucien Sampaix, 75010 Paris", "phone": "+33 1 46 07 76 34", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75010", "id": "pharmacie-du-canal-saint-martin-75010"}, {"name": "PHARMACIE CENTRALE DU 11ÈME", "address": "1 Pl. Léon Blum, 75011 Paris", "phone": "+33 1 43 79 66 06", "hours": "Lun-Ven 8h-21h, Sam-Dim 9h-20h", "cp": "75011", "id": "pharmacie-centrale-du-11-me-75011"}, {"name": "Pharmacie Voltaire-Oberkampf", "address": "29 Bd Voltaire, 75011 Paris", "phone": "+33 1 47 00 42 74", "hours": "Lun-Jeu 9h-20h30, Ven-Sam 9h-20h, Dim 10h30-20h", "cp": "75011", "id": "pharmacie-voltaire-oberkampf-75011"}, {"name": "PHARMACIE CENTRALE ROQUETTE", "address": "51 Rue de la Roquette, 75011 Paris", "phone": "+33 1 47 00 92 66", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75011", "id": "pharmacie-centrale-roquette-75011"}, {"name": "Pharmacie Bastille", "address": "6 Bd Richard-Lenoir, 75011 Paris", "phone": "+33 1 47 00 49 44", "hours": "24h/24 - 7j/7", "cp": "75011", "id": "pharmacie-bastille-75011"}, {"name": "Mapharmacie République", "address": "44 Rue du Faubourg du Temple, 75011 Paris", "phone": "+33 1 43 57 55 79", "hours": "Lun-Dim 9h-20h", "cp": "75011", "id": "mapharmacie-r-publique-75011"}, {"name": "Pharmacie Selarl", "address": "113 Bd Voltaire, 75011 Paris", "phone": "+33 1 43 79 18 65", "hours": "Lun-Ven 9h-20h, Sam 9h-19h30, Dim fermé", "cp": "75011", "id": "pharmacie-selarl-75011"}, {"name": "Pharmacie Louguet", "address": "43 Rue Faidherbe, 75011 Paris", "phone": "+33 1 43 71 41 40", "hours": "Lun-Ven 8h30-20h, Sam-Dim 9h30-20h", "cp": "75011", "id": "pharmacie-louguet-75011"}, {"name": "PHARMACIE ISRAEL MEYER", "address": "81 Rue de la Roquette, 75011 Paris", "phone": "+33 1 43 79 78 54", "hours": "Lun-Jeu 8h-21h, Ven 8h-18h, Sam fermé, Dim 8h-21h", "cp": "75011", "id": "pharmacie-israel-meyer-75011"}, {"name": "SELARL Nation pharmacie", "address": "13 Pl. de la Nation, 75011 Paris", "phone": "+33 1 43 73 24 03", "hours": "Lun-Sam 8h30-20h30, Dim fermé", "cp": "75011", "id": "selarl-nation-pharmacie-75011"}, {"name": "GRANDE PHARMACIE DAUMESNIL", "address": "6 Pl. Félix Éboué, 75012 Paris", "phone": "+33 1 43 43 19 03", "hours": "Lun-Dim 8h30/9h-21h", "cp": "75012", "id": "grande-pharmacie-daumesnil-75012"}, {"name": "GRANDE PHARMACIE DE BERCY", "address": "14 Rue de Wattignies, 75012 Paris", "phone": "+33 1 43 43 55 22", "hours": "Lun-Ven 9h-20h, Sam-Dim fermé", "cp": "75012", "id": "grande-pharmacie-de-bercy-75012"}, {"name": "Pharmacie Dang", "address": "237 Rue de Charenton, 75012 Paris", "phone": "+33 1 43 07 44 59", "hours": "Lun-Ven 8h30-13h/15h-20h30, Sam-Dim fermé", "cp": "75012", "id": "pharmacie-dang-75012"}, {"name": "PHARMACIE 257", "address": "257 Av. Daumesnil, 75012 Paris", "phone": "+33 1 43 43 53 10", "hours": "Lun-Sam 9h-20h (Mer 18h30), Dim fermé", "cp": "75012", "id": "pharmacie-257-75012"}, {"name": "Pharmacie de Reuilly 7j/7", "address": "27 Bd de Reuilly, 75012 Paris", "phone": "+33 1 43 43 03 17", "hours": "Lun-Dim 9h-20h", "cp": "75012", "id": "pharmacie-de-reuilly-7j-7-75012"}, {"name": "Pharmacy Reuilly Diderot", "address": "35 Rue de Reuilly, 75012 Paris", "phone": "+33 9 50 10 16 26", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75012", "id": "pharmacy-reuilly-diderot-75012"}, {"name": "Citypharma Bercy", "address": "86 Bd Soult, 75012 Paris", "phone": "+33 1 43 43 13 68", "hours": "24h/24 - 7j/7", "cp": "75012", "id": "citypharma-bercy-75012"}, {"name": "Pharmacie Centrale Dugommier", "address": "1 Bd de Reuilly, 75012 Paris", "phone": "+33 1 43 43 54 24", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75012", "id": "pharmacie-centrale-dugommier-75012"}, {"name": "PHARMACIE (Bd Diderot)", "address": "88 Bd Diderot, 75012 Paris", "phone": "+33 1 43 43 82 05", "hours": "Lun-Dim 8h30/9h-20h/21h", "cp": "75012", "id": "pharmacie-bd-diderot-75012"}, {"name": "The pharmacy of the park well & well", "address": "21 Rue de Pommard, 75012 Paris", "phone": "+33 1 53 33 01 02", "hours": "Lun-Dim 8h30-20h", "cp": "75012", "id": "the-pharmacy-of-the-park-well-well-75012"}, {"name": "Elsie Pharmacie Centrale Paris 13", "address": "75 Rue de Tolbiac, 75013 Paris", "phone": "+33 1 44 24 10 00", "hours": "Lun-Ven 8h30-20h30, Sam 9h-20h30, Dim fermé", "cp": "75013", "id": "elsie-pharmacie-centrale-paris-13-75013"}, {"name": "Pharmacie Italie 2 Nextypharm", "address": "Ctre Cial Italie 2, 30 Av. d'Italie, 75013 Paris", "phone": "+33 1 45 80 02 08", "hours": "Lun-Sam 9h-20h, Dim 10h-19h30", "cp": "75013", "id": "pharmacie-italie-2-nextypharm-75013"}, {"name": "Pharmacie de garde du 13eme", "address": "5 Bis Av. d'Italie, 75013 Paris", "phone": "+33 1 45 82 86 60", "hours": "24h/24 - 7j/7", "cp": "75013", "id": "pharmacie-de-garde-du-13eme-75013"}, {"name": "Pharmacie Tolbiac Nextypharm", "address": "61 Av. d'Italie, 75013 Paris", "phone": "+33 1 44 24 19 72", "hours": "Lun-Sam 8h-20h, Dim 8h-21h", "cp": "75013", "id": "pharmacie-tolbiac-nextypharm-75013"}, {"name": "Pharmacie F", "address": "141 Av. de France, 75013 Paris", "phone": "+33 1 86 95 42 42", "hours": "Lun-Ven 9h-20h, Sam-Dim fermé", "cp": "75013", "id": "pharmacie-f-75013"}, {"name": "Pharmacie de l'Avenue", "address": "76 Av. d'Italie, 75013 Paris", "phone": "+33 1 45 80 95 34", "hours": "Lun-Sam 8h-20h, Dim fermé", "cp": "75013", "id": "pharmacie-de-l-avenue-75013"}, {"name": "Pharmacie Du Centre Commercial Massena 13", "address": "13 Pl. de Vénétie, 75013 Paris", "phone": "+33 1 44 06 72 72", "hours": "Lun-Ven 8h30-20h30, Sam 8h30-18h30, Dim fermé", "cp": "75013", "id": "pharmacie-du-centre-commercial-massena-13-75013"}, {"name": "Pharmacie de la Place d'Italie", "address": "8 Pl. d'Italie, 75013 Paris", "phone": "+33 1 43 31 23 14", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75013", "id": "pharmacie-de-la-place-d-italie-75013"}, {"name": "PHARMACIE DU PARC", "address": "3 Rue de l'Amiral Mouchez, 75013 Paris", "phone": "+33 1 45 89 10 05", "hours": "Lun-Sam 9h-13h30/15h-19h30 (Mer 18h30)", "cp": "75013", "id": "pharmacie-du-parc-75013"}, {"name": "PHARMACIE BIBLIOTHEQUE", "address": "110 Av. de France, 75013 Paris", "phone": "+33 1 45 83 95 53", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75013", "id": "pharmacie-bibliotheque-75013"}, {"name": "Pharmacie Principale de la Porte d'Orléans", "address": "4 Pl. du 25 Août 1944, 75014 Paris", "phone": "+33 1 45 42 27 75", "hours": "Lun-Ven 7h-3h, Sam-Dim 8h-3h", "cp": "75014", "id": "pharmacie-principale-de-la-porte-d-orl-ans-75014"}, {"name": "Pharmacie Centrale d'Alésia", "address": "110 Rue d'Alésia, 75014 Paris", "phone": "+33 1 45 42 13 24", "hours": "Lun-Ven 9h-20h, Sam-Dim fermé", "cp": "75014", "id": "pharmacie-centrale-d-al-sia-75014"}, {"name": "Pharmacie du Grand Paris", "address": "122 Av. du Général Leclerc, 75014 Paris", "phone": "+33 1 45 39 13 14", "hours": "Lun-Dim 8h30/9h-20h", "cp": "75014", "id": "pharmacie-du-grand-paris-75014"}, {"name": "La Grande Pharmacie d'Alésia", "address": "79 Av. du Général Leclerc, 75014 Paris", "phone": "+33 1 43 27 13 23", "hours": "Lun-Sam 8h30-20h30, Dim 9h30-19h30", "cp": "75014", "id": "la-grande-pharmacie-d-al-sia-75014"}, {"name": "Grande Pharmacie Didot", "address": "64 Boulevard Brune, 75014 Paris", "phone": "+33 1 45 39 57 56", "hours": "Lun-Dim 8h30-20h", "cp": "75014", "id": "grande-pharmacie-didot-75014"}, {"name": "Pharmacie Monge Plaisance", "address": "203 Rue d'Alésia, 75014 Paris", "phone": "+33 1 45 43 15 54", "hours": "Lun-Dim 8h-19h50", "cp": "75014", "id": "pharmacie-monge-plaisance-75014"}, {"name": "Pharmacie Aprium Alésia Plaisance", "address": "172 Rue d'Alésia, 75014 Paris", "phone": "+33 1 45 43 19 24", "hours": "Lun-Ven 8h-20h, Sam 9h-19h, Dim fermé", "cp": "75014", "id": "pharmacie-aprium-al-sia-plaisance-75014"}, {"name": "Grande Pharmacie Daguerre", "address": "33 Rue Daguerre, 75014 Paris", "phone": "+33 1 43 22 38 11", "hours": "Lun-Ven 8h30-20h, Sam-Dim fermé", "cp": "75014", "id": "grande-pharmacie-daguerre-75014"}, {"name": "Pharmacie De L'Europe", "address": "178 Av. du Maine, 75014 Paris", "phone": "+33 1 45 40 51 91", "hours": "Lun-Sam 8h30-21h, Dim fermé", "cp": "75014", "id": "pharmacie-de-l-europe-75014"}, {"name": "Pharmacie Sarrette", "address": "3 Rue Sarrette, 75014 Paris", "phone": "+33 1 43 27 17 57", "hours": "Lun-Ven 9h-20h, Sam 9h30-19h30, Dim fermé", "cp": "75014", "id": "pharmacie-sarrette-75014"}, {"name": "Pharmacie Eiffel Commerce", "address": "13-15-17 Rue du Commerce, 75015 Paris", "phone": "+33 1 45 75 33 35", "hours": "Lun-Sam 8h-20h45, Dim fermé", "cp": "75015", "id": "pharmacie-eiffel-commerce-75015"}, {"name": "La Grande Pharmacie du 15", "address": "119 Rue St Charles, 75015 Paris", "phone": "+33 1 45 77 88 46", "hours": "Lun-Ven 8h30-20h30, Sam 9h-20h, Dim fermé", "cp": "75015", "id": "la-grande-pharmacie-du-15-75015"}, {"name": "Grande Pharmacie du Commerce", "address": "89 Rue du Commerce, 75015 Paris", "phone": "+33 1 48 28 43 50", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75015", "id": "grande-pharmacie-du-commerce-75015"}, {"name": "Pharmacie Bir Hakeim", "address": "6 Bd de Grenelle, 75015 Paris", "phone": "+33 1 45 77 33 30", "hours": "Lun-Ven 8h30-20h30, Sam 9h30-13h/14h-20h, Dim fermé", "cp": "75015", "id": "pharmacie-bir-hakeim-75015"}, {"name": "Grande Pharmacie Convention", "address": "242 Rue de la Convention, 75015 Paris", "phone": "+33 1 48 28 96 98", "hours": "Lun-Ven 8h30-20h30, Sam 9h-20h30, Dim fermé", "cp": "75015", "id": "grande-pharmacie-convention-75015"}, {"name": "Aprium Pharmacie Lourmel", "address": "105 Av. Félix Faure, 75015 Paris", "phone": "+33 1 45 57 45 45", "hours": "Lun-Sam 9h-20h, Dim 8h-21h", "cp": "75015", "id": "aprium-pharmacie-lourmel-75015"}, {"name": "Pharmavance Convention", "address": "55 Rue de la Convention, 75015 Paris", "phone": "+33 1 45 77 57 94", "hours": "Lun-Sam 8h30-20h30, Dim fermé", "cp": "75015", "id": "pharmavance-convention-75015"}, {"name": "PHARMACIE DE LA PLACE", "address": "9 Pl. du Général Beuret, 75015 Paris", "phone": "+33 1 48 28 56 11", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75015", "id": "pharmacie-de-la-place-75015"}, {"name": "Pharmacie Centrale Mirabeau", "address": "7 Pont Mirabeau, 75015 Paris", "phone": "+33 1 45 77 85 23", "hours": "Lun-Sam 8h30-20h, Dim fermé", "cp": "75015", "id": "pharmacie-centrale-mirabeau-75015"}, {"name": "GRANDE PHARMACIE DE LA POMPE", "address": "66 Rue de la Pompe, 75116 Paris", "phone": "+33 1 45 04 73 46", "hours": "Lun-Dim 9h-20h", "cp": "75116", "id": "grande-pharmacie-de-la-pompe-75116"}, {"name": "Pharmacie Exelmans", "address": "77 Boulevard Exelmans, 75016 Paris", "phone": "+33 1 46 51 23 92", "hours": "Lun-Ven 9h-20h, Sam-Dim fermé", "cp": "75016", "id": "pharmacie-exelmans-75016"}, {"name": "Aprium Grande Pharmacie Basire", "address": "143 rue de La Pompe / 118 Av. Victor Hugo, 75016 Paris", "phone": "+33 1 45 05 42 88", "hours": "Lun-Dim 9h-20h", "cp": "75016", "id": "aprium-grande-pharmacie-basire-75016"}, {"name": "Pharmacie de la Mairie 16", "address": "82 Rue de la Pompe, 75016 Paris", "phone": "+33 1 45 04 73 66", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75016", "id": "pharmacie-de-la-mairie-16-75016"}, {"name": "Pharmacy Blue Cross", "address": "43 Rue d'Auteuil, 75016 Paris", "phone": "Non renseigné", "hours": "Lun-Ven 8h30-20h30, Sam 9h-13h30/14h30-20h, Dim fermé", "cp": "75016", "id": "pharmacy-blue-cross-75016"}, {"name": "Pharmacie du Marché de Passy", "address": "2 Pl. de Passy, 75016 Paris", "phone": "+33 9 80 24 62 46", "hours": "Lun-Ven 8h30-20h, Sam 9h-20h, Dim fermé", "cp": "75016", "id": "pharmacie-du-march-de-passy-75016"}, {"name": "Grande Pharmacie d'Auteuil Paris", "address": "4 Rue Poussin, 75016 Paris", "phone": "+33 1 42 88 07 71", "hours": "Lun-Sam 9h-19h30, Dim fermé", "cp": "75016", "id": "grande-pharmacie-d-auteuil-paris-75016"}, {"name": "Grande Pharmacie Doumer Passy", "address": "83 Av. Paul Doumer, 75116 Paris", "phone": "+33 1 45 25 20 54", "hours": "Lun-Ven 8h-20h, Sam-Dim fermé", "cp": "75116", "id": "grande-pharmacie-doumer-passy-75116"}, {"name": "Pharmacie du Bien Etre", "address": "36 Rue de la Pompe, 75116 Paris", "phone": "+33 1 45 04 14 89", "hours": "Lun-Sam 8h-20h, Dim 9h-19h", "cp": "75116", "id": "pharmacie-du-bien-etre-75116"}, {"name": "Pharmacy Porte St Cloud", "address": "122 Bd Murat, 75016 Paris", "phone": "+33 1 42 88 74 16", "hours": "Lun-Ven 8h30-20h30, Sam-Dim 9h-20h", "cp": "75016", "id": "pharmacy-porte-st-cloud-75016"}, {"name": "pharmacie de Paris (Champerret)", "address": "5 Pl. de la Prte de Champerret, 75017 Paris", "phone": "+33 1 45 72 43 25", "hours": "Lun-Sam 8h-20h30, Dim 8h30-21h", "cp": "75017", "id": "pharmacie-de-paris-champerret-75017"}, {"name": "Grande pharmacie du palais des congrès", "address": "2 Pl de la Pte Maillot, 75017 Paris", "phone": "+33 1 87 44 35 44", "hours": "24h/24 - 7j/7", "cp": "75017", "id": "grande-pharmacie-du-palais-des-congr-s-75017"}, {"name": "Pharmacie de l'Avenue - PARIS 17", "address": "121 Av. de Saint-Ouen, 75017 Paris", "phone": "+33 1 46 27 22 32", "hours": "Lun-Sam 8h15-21h, Dim fermé", "cp": "75017", "id": "pharmacie-de-l-avenue-paris-17-75017"}, {"name": "Aprium Pharmacie Place Marechal Juin", "address": "7 Pl. du Maréchal Juin, 75017 Paris", "phone": "+33 1 47 63 34 39", "hours": "Lun-Sam 8h-21h, Dim fermé", "cp": "75017", "id": "aprium-pharmacie-place-marechal-juin-75017"}, {"name": "PHARMACIE DU VILLAGE BATIGNOLLES", "address": "40 Rue des Batignolles, 75017 Paris", "phone": "+33 1 44 70 98 99", "hours": "Lun-Ven 8h-20h30, Sam 9h-20h, Dim fermé", "cp": "75017", "id": "pharmacie-du-village-batignolles-75017"}, {"name": "Pharmacie de la Porte Maillot", "address": "68 Av. de la Grande Armée, 75017 Paris", "phone": "+33 1 45 74 17 31", "hours": "24h/24 - 7j/7", "cp": "75017", "id": "pharmacie-de-la-porte-maillot-75017"}, {"name": "Pharmacie des Jardins du Palais well&well", "address": "5 Rue Gilbert Cesbron, 75017 Paris", "phone": "+33 1 85 73 25 20", "hours": "Lun-Sam 9h-19h30, Dim fermé", "cp": "75017", "id": "pharmacie-des-jardins-du-palais-well-well-75017"}, {"name": "Pharmacie Moreno Legendre", "address": "79 Rue Legendre, 75017 Paris", "phone": "+33 1 83 95 44 08", "hours": "Lun-Dim 9h-14h/15h-20h", "cp": "75017", "id": "pharmacie-moreno-legendre-75017"}, {"name": "Pharmacy Porte d'Asnieres", "address": "96 Bd Berthier, 75017 Paris", "phone": "+33 1 47 64 94 12", "hours": "Lun-Ven 9h-20h, Sam fermé, Dim 9h-20h", "cp": "75017", "id": "pharmacy-porte-d-asnieres-75017"}, {"name": "Pharmacie Française", "address": "40 Rue des Acacias, 75017 Paris", "phone": "+33 1 43 80 18 26", "hours": "Lun-Ven 8h30-20h30, Sam 9h30-19h30, Dim fermé", "cp": "75017", "id": "pharmacie-fran-aise-75017"}, {"name": "Pharmacie Espace Conseil", "address": "64 Bd Barbès, 75018 Paris", "phone": "+33 1 46 06 02 61", "hours": "Lun-Ven 8h-00h, Sam fermé, Dim 8h30-00h", "cp": "75018", "id": "pharmacie-espace-conseil-75018"}, {"name": "Pharmacie (Marcadet)", "address": "141 Rue Marcadet, 75018 Paris", "phone": "+33 1 46 06 58 20", "hours": "Lun-Ven 9h-13h/14h-19h30, Sam-Dim fermé", "cp": "75018", "id": "pharmacie-marcadet-75018"}, {"name": "Pharmacie Pharmavance Mairie du 18", "address": "3 Pl. Charles Bernard, 75018 Paris", "phone": "+33 1 46 06 63 53", "hours": "Lun-Sam 8h30-20h, Dim fermé", "cp": "75018", "id": "pharmacie-pharmavance-mairie-du-18-75018"}, {"name": "Pharmacy Porte de la Chapelle", "address": "93 Rue de la Chapelle, 75018 Paris", "phone": "+33 1 40 05 16 34", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75018", "id": "pharmacy-porte-de-la-chapelle-75018"}, {"name": "Pharmacie des Abbesses", "address": "34 Rue des Abbesses, 75018 Paris", "phone": "+33 1 46 06 69 10", "hours": "Lun-Ven 8h30-20h, Sam-Dim fermé", "cp": "75018", "id": "pharmacie-des-abbesses-75018"}, {"name": "Aprium Pharmacie Centrale De La Chapelle", "address": "5 Rue de la Chapelle, 75018 Paris", "phone": "+33 1 46 07 14 84", "hours": "Lun-Sam 9h-20h, Dim 9h30-20h", "cp": "75018", "id": "aprium-pharmacie-centrale-de-la-chapelle-75018"}, {"name": "Grande Pharmacie du 102", "address": "102 Av. de Saint-Ouen, 75018 Paris", "phone": "+33 1 46 27 44 18", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75018", "id": "grande-pharmacie-du-102-75018"}, {"name": "Pharmacie Principale M.H.B", "address": "61 Rue des Poissonniers, 75018 Paris", "phone": "+33 1 46 06 57 10", "hours": "Lun-Sam 9h-20h30, Dim fermé", "cp": "75018", "id": "pharmacie-principale-m-h-b-75018"}, {"name": "PHARMACIE DES 3 QUARTIERS", "address": "18 Av. de Clichy, 75018 Paris", "phone": "+33 1 45 22 16 48", "hours": "Lun-Ven 8h30-20h, Sam fermé, Dim 10h-17h", "cp": "75018", "id": "pharmacie-des-3-quartiers-75018"}, {"name": "Pharmacie Santé Bien-être", "address": "40 Rue du Poteau, 75018 Paris", "phone": "+33 1 46 06 50 10", "hours": "Lun-Sam 9h-20h, Dim fermé", "cp": "75018", "id": "pharmacie-sant-bien-tre-75018"}, {"name": "Pharmacie Paris (Eugène Jumin)", "address": "29 Rue Eugène Jumin, 75019 Paris", "phone": "+33 1 44 84 70 98", "hours": "Lun-Ven 8h30-20h, Sam-Dim 9h-20h", "cp": "75019", "id": "pharmacie-paris-eug-ne-jumin-75019"}, {"name": "Pharmacie 121 Av. Jean Jaurès", "address": "121 Av. Jean Jaurès, 75019 Paris", "phone": "+33 1 42 08 29 94", "hours": "Lun-Ven 8h-20h, Sam-Dim 9h-20h", "cp": "75019", "id": "pharmacie-121-av-jean-jaur-s-75019"}, {"name": "APRIUM Pharmacie De L'Ourcq", "address": "81 BIS Rue de l'Ourcq, 75019 Paris", "phone": "+33 1 40 35 41 30", "hours": "Lun-Dim 8h30-20h30", "cp": "75019", "id": "aprium-pharmacie-de-l-ourcq-75019"}, {"name": "Pharmacie Secretan", "address": "19 Av. Secrétan, 75019 Paris", "phone": "+33 1 42 45 19 93", "hours": "Lun-Sam 8h30-21h, Dim 9h-20h", "cp": "75019", "id": "pharmacie-secretan-75019"}, {"name": "Pharmacie de Stalingrad", "address": "27 Av. de Flandre, 75019 Paris", "phone": "+33 1 46 07 27 71", "hours": "Lun-Ven 9h-19h, Sam-Dim fermé", "cp": "75019", "id": "pharmacie-de-stalingrad-75019"}, {"name": "Grande Pharmacie Riquet", "address": "28 Rue Riquet, 75019 Paris", "phone": "+33 1 42 05 69 88", "hours": "Lun-Sam 8h30-20h, Dim 9h-20h", "cp": "75019", "id": "grande-pharmacie-riquet-75019"}, {"name": "Pharmacy Geode", "address": "118 Av. de Flandre, 75019 Paris", "phone": "+33 1 40 05 07 04", "hours": "Lun 9h-20h, Mar-Ven 8h30-20h, Sam 9h-19h, Dim fermé", "cp": "75019", "id": "pharmacy-geode-75019"}, {"name": "Pharmacie Manin des Buttes-Chaumont", "address": "105 Rue Manin, 75019 Paris", "phone": "+33 1 42 06 54 81", "hours": "Lun-Ven 8h30-20h30, Sam 9h-19h30, Dim 9h-20h", "cp": "75019", "id": "pharmacie-manin-des-buttes-chaumont-75019"}, {"name": "Pharmacie Lafayette Daloy Gregori", "address": "15-17 Rue Henri Ribière, 75019 Paris", "phone": "+33 1 53 38 60 00", "hours": "Lun-Mar 9h-20h, Mer 8h30-20h30, Jeu-Ven 9h-20h, Sam-Dim 9h-19h30", "cp": "75019", "id": "pharmacie-lafayette-daloy-gregori-75019"}, {"name": "PHARMACIE PLACE GAMBETTA", "address": "4 Pl. Gambetta, 75020 Paris", "phone": "+33 1 47 97 50 75", "hours": "Lun-Ven 9h-19h, Sam-Dim fermé", "cp": "75020", "id": "pharmacie-place-gambetta-75020"}, {"name": "Pharmacie du 20e", "address": "144 Bd de Ménilmontant, 75020 Paris", "phone": "+33 1 47 97 33 48", "hours": "Lun-Dim 9h-20h", "cp": "75020", "id": "pharmacie-du-20e-75020"}, {"name": "Pharmacy Gatines", "address": "243 bis Rue des Pyrénées, 75020 Paris", "phone": "+33 1 46 36 86 01", "hours": "Lun-Ven 9h-20h, Sam fermé, Dim 9h-20h", "cp": "75020", "id": "pharmacy-gatines-75020"}, {"name": "Central Pharmacy of the Pyrenees", "address": "127 Rue des Pyrénées, 75020 Paris", "phone": "+33 1 43 70 18 59", "hours": "Lun-Ven 9h-20h, Sam 9h30-19h30, Dim fermé", "cp": "75020", "id": "central-pharmacy-of-the-pyrenees-75020"}, {"name": "Saint Blaise Pharmacy", "address": "117 Rue de Bagnolet, 75020 Paris", "phone": "+33 1 43 71 43 99", "hours": "Lun-Ven 8h30-20h, Sam-Dim 9h-20h", "cp": "75020", "id": "saint-blaise-pharmacy-75020"}, {"name": "Pharmacie Pharmavance Paris 20", "address": "6 Rue de Bagnolet, 75020 Paris", "phone": "+33 1 43 70 24 28", "hours": "Lun-Sam 8h30-20h, Dim fermé", "cp": "75020", "id": "pharmacie-pharmavance-paris-20-75020"}, {"name": "GRANDE PHARMACIE D'AVRON", "address": "43 Rue d'Avron, 75020 Paris", "phone": "+33 1 43 73 23 51", "hours": "Lun-Sam 8h30-20h, Dim fermé", "cp": "75020", "id": "grande-pharmacie-d-avron-75020"}, {"name": "Pharmacy Porte des Lilas", "address": "168 Bd Mortier, 75020 Paris", "phone": "+33 1 43 64 63 00", "hours": "Lun-Ven 8h-20h, Sam 10h-14h30/15h-19h, Dim 9h-21h", "cp": "75020", "id": "pharmacy-porte-des-lilas-75020"}, {"name": "Pharmacie Saint-Fargeau", "address": "112 Av. Gambetta, 75020 Paris", "phone": "+33 1 40 31 60 15", "hours": "Lun-Ven 8h-20h30, Sam-Dim 9h-20h", "cp": "75020", "id": "pharmacie-saint-fargeau-75020"}, {"name": "PHARMACIE BELGRAND TENON", "address": "15 Rue Belgrand, 75020 Paris", "phone": "+33 1 40 31 66 33", "hours": "Lun-Ven 9h-19h30, Sam 9h-20h, Dim fermé", "cp": "75020", "id": "pharmacie-belgrand-tenon-75020"}]</script>
<script>
const pharmacies = JSON.parse(document.getElementById('pharmacy-data').textContent);

let state = {}; // id -> {done, status, note}

async function loadState(){
  try{
    const res = await window.storage.get('pharmacy-state');
    if(res && res.value){
      state = JSON.parse(res.value);
    }
  }catch(e){
    state = {};
  }
}

async function saveState(){
  try{
    await window.storage.set('pharmacy-state', JSON.stringify(state));
  }catch(e){
    console.error('Erreur de sauvegarde', e);
  }
}

function getEntry(id){
  if(!state[id]) state[id] = {done:false, status:'todo', note:''};
  return state[id];
}

function groupByZone(list){
  const groups = {};
  list.forEach(p=>{
    const zone = p.cp || 'Autre';
    if(!groups[zone]) groups[zone] = [];
    groups[zone].push(p);
  });
  return groups;
}

function zoneName(cp){
  const map = {
    '75001':'1er arr.','75002':'2e arr.','75003':'3e arr.','75004':'4e arr.',
    '75005':'5e arr.','75006':'6e arr.','75007':'7e arr.','75008':'8e arr.',
    '75009':'9e arr.','75010':'10e arr.','75011':'11e arr.','75012':'12e arr.',
    '75013':'13e arr.','75014':'14e arr.','75015':'15e arr.','75016':'16e arr.',
    '75116':'16e arr.','75017':'17e arr.','75018':'18e arr.','75019':'19e arr.',
    '75020':'20e arr.'
  };
  return map[cp] || cp;
}

const STATUS_LABELS = {
  todo: {label:'À faire', class:''},
  interested: {label:'Intéressée', class:'active'},
  refused: {label:'Refusé', class:'active'},
  callback: {label:'À rappeler', class:'active'}
};

function render(){
  const main = document.getElementById('main');
  const searchVal = document.getElementById('search').value.trim().toLowerCase();
  const statusFilter = document.getElementById('filter-status').value;
  const zoneFilter = document.getElementById('filter-zone').value;

  let filtered = pharmacies.filter(p=>{
    const entry = getEntry(p.id);
    if(searchVal){
      const hay = (p.name+' '+p.address+' '+p.cp).toLowerCase();
      if(!hay.includes(searchVal)) return false;
    }
    if(zoneFilter !== 'all' && p.cp !== zoneFilter) return false;
    if(statusFilter === 'done' && !entry.done) return false;
    if(statusFilter === 'todo' && entry.done) return false;
    if(statusFilter === 'interested' && entry.status !== 'interested') return false;
    if(statusFilter === 'refused' && entry.status !== 'refused') return false;
    return true;
  });

  main.innerHTML = '';

  if(filtered.length === 0){
    main.innerHTML = '<div class="empty">Aucune pharmacie ne correspond à votre recherche.</div>';
    updateStats();
    return;
  }

  const groups = groupByZone(filtered);
  const zoneKeys = Object.keys(groups).sort();

  zoneKeys.forEach(zone=>{
    const list = groups[zone];
    const section = document.createElement('div');
    section.className = 'zone-group';

    const title = document.createElement('div');
    title.className = 'zone-title';
    title.innerHTML = \`📍 Paris \${zoneName(zone)} <span class="count">(\${list.length})</span>\`;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'grid';

    list.forEach(p=>{
      grid.appendChild(renderCard(p));
    });

    section.appendChild(grid);
    main.appendChild(section);
  });

  updateStats();
}

function renderCard(p){
  const entry = getEntry(p.id);
  const card = document.createElement('div');
  card.className = 'card' + (entry.done ? ' done' : '');

  const top = document.createElement('div');
  top.className = 'card-top';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'checkbox';
  checkbox.checked = entry.done;
  checkbox.addEventListener('change', ()=>{
    entry.done = checkbox.checked;
    if(entry.done && entry.status === 'todo') entry.status = 'interested';
    if(!entry.done) entry.status = 'todo';
    saveState();
    render();
  });

  const body = document.createElement('div');
  body.className = 'card-body';

  const name = document.createElement('p');
  name.className = 'name';
  name.textContent = p.name;

  const addr = document.createElement('p');
  addr.className = 'addr';
  addr.textContent = p.address;

  const meta = document.createElement('div');
  meta.className = 'meta';
  const phoneHTML = p.phone && p.phone !== 'Non renseigné'
    ? \`<span class="icon">📞</span><a href="tel:\${p.phone.replace(/\\s/g,'')}">\${p.phone}</a>\`
    : \`<span class="icon">📞</span>Non renseigné\`;
  meta.innerHTML = \`
    <div>\${phoneHTML}</div>
    <div><span class="icon">🕒</span>\${p.hours}</div>
  \`;

  const statusRow = document.createElement('div');
  statusRow.className = 'status-row';
  Object.keys(STATUS_LABELS).forEach(key=>{
    if(key === 'todo') return;
    const btn = document.createElement('button');
    btn.className = 'tag-btn' + (entry.status === key ? ' active' : '');
    btn.textContent = STATUS_LABELS[key].label;
    btn.addEventListener('click', ()=>{
      entry.status = entry.status === key ? 'todo' : key;
      if(entry.status !== 'todo') entry.done = true;
      saveState();
      render();
    });
    statusRow.appendChild(btn);
  });

  const note = document.createElement('textarea');
  note.className = 'note-input';
  note.placeholder = 'Note (contact, remarques...)';
  note.value = entry.note || '';
  note.addEventListener('input', ()=>{
    entry.note = note.value;
    saveState();
  });

  body.appendChild(name);
  body.appendChild(addr);
  body.appendChild(meta);
  body.appendChild(statusRow);
  body.appendChild(note);

  top.appendChild(checkbox);
  top.appendChild(body);
  card.appendChild(top);

  return card;
}

function updateStats(){
  const total = pharmacies.length;
  let done = 0, interested = 0;
  pharmacies.forEach(p=>{
    const e = getEntry(p.id);
    if(e.done) done++;
    if(e.status === 'interested') interested++;
  });
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-interested').textContent = interested;
  document.getElementById('stat-remaining').textContent = total - done;
  document.getElementById('progress-bar').style.width = total ? ((done/total)*100)+'%' : '0%';
}

function populateZoneFilter(){
  const select = document.getElementById('filter-zone');
  const zones = [...new Set(pharmacies.map(p=>p.cp))].sort();
  zones.forEach(z=>{
    const opt = document.createElement('option');
    opt.value = z;
    opt.textContent = 'Paris ' + zoneName(z);
    select.appendChild(opt);
  });
}

function exportCSV(){
  const rows = [['Nom','Adresse','Telephone','Horaires','Visitee','Statut','Note']];
  pharmacies.forEach(p=>{
    const e = getEntry(p.id);
    rows.push([p.name, p.address, p.phone||'', p.hours, e.done?'Oui':'Non', e.status, (e.note||'').replace(/\\n/g,' ')]);
  });
  const csv = rows.map(r => r.map(field => \`"\${String(field).replace(/"/g,'""')}"\`).join(',')).join('\\n');
  const blob = new Blob(['\\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prospection_pharmacies_paris.csv';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('search').addEventListener('input', render);
document.getElementById('filter-status').addEventListener('change', render);
document.getElementById('filter-zone').addEventListener('change', render);
document.getElementById('export-btn').addEventListener('click', exportCSV);
document.getElementById('reset-btn').addEventListener('click', ()=>{
  if(confirm('Réinitialiser toute la progression (cases, statuts, notes) ?')){
    state = {};
    saveState();
    render();
  }
});

(async function init(){
  await loadState();
  populateZoneFilter();
  render();
})();
</script>

</body>
</html>
`

const REGION_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<script>
// Polyfill window.storage -> localStorage avec préfixe unique
window.storage = {
  get: async function(key) {
    try {
      const v = localStorage.getItem('butt_prosp_region_' + key);
      return v ? {value: v} : null;
    } catch(e) { return null; }
  },
  set: async function(key, value) {
    try {
      localStorage.setItem('butt_prosp_region_' + key, value);
      return {key, value};
    } catch(e) { return null; }
  },
  delete: async function(key) {
    try {
      localStorage.removeItem('butt_prosp_region_' + key);
      return {key, deleted: true};
    } catch(e) { return null; }
  }
};
</script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Prospection Pharmacies Région — Butt Premium</title>
<style>
  :root{
    --rose:#c9436e;
    --rose-dark:#a3325a;
    --rose-light:#fbe8ee;
    --ink:#1f1a1d;
    --muted:#7c6f74;
    --line:#ecdfe3;
    --bg:#fffaf9;
    --card:#ffffff;
    --done:#e8f4ec;
    --done-line:#8fc9a3;
    --done-ink:#2e7d4f;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
    background:var(--bg);
    color:var(--ink);
  }
  header{
    background:linear-gradient(135deg,var(--rose),var(--rose-dark));
    color:#fff;
    padding:28px 24px 22px;
    position:sticky;
    top:0;
    z-index:20;
    box-shadow:0 4px 16px rgba(163,50,90,.25);
  }
  header h1{
    margin:0 0 4px;
    font-size:22px;
    letter-spacing:.2px;
  }
  header p{
    margin:0;
    font-size:13px;
    opacity:.92;
  }
  .stats{
    display:flex;
    gap:10px;
    margin-top:16px;
    flex-wrap:wrap;
  }
  .stat{
    background:rgba(255,255,255,.15);
    border:1px solid rgba(255,255,255,.3);
    border-radius:10px;
    padding:8px 14px;
    font-size:13px;
    min-width:110px;
  }
  .stat b{ display:block; font-size:20px; }

  .progress-wrap{
    margin-top:14px;
    height:8px;
    background:rgba(255,255,255,.25);
    border-radius:6px;
    overflow:hidden;
  }
  .progress-bar{
    height:100%;
    background:#fff;
    width:0%;
    transition:width .3s ease;
  }

  .toolbar{
    max-width:1100px;
    margin:20px auto 0;
    padding:0 20px;
    display:flex;
    gap:10px;
    flex-wrap:wrap;
    align-items:center;
  }
  .toolbar input[type="text"]{
    flex:1;
    min-width:200px;
    padding:10px 14px;
    border:1px solid var(--line);
    border-radius:10px;
    font-size:14px;
    background:#fff;
  }
  .toolbar select{
    padding:10px 14px;
    border:1px solid var(--line);
    border-radius:10px;
    font-size:14px;
    background:#fff;
    color:var(--ink);
  }
  .toolbar button{
    padding:10px 16px;
    border-radius:10px;
    border:1px solid var(--line);
    background:#fff;
    cursor:pointer;
    font-size:13px;
    color:var(--ink);
    transition:.15s;
  }
  .toolbar button:hover{ border-color:var(--rose); color:var(--rose-dark); }
  .toolbar button.reset{ color:#a33; border-color:#f0cccc; }
  .toolbar button.reset:hover{ background:#fff5f5; }

  main{
    max-width:1100px;
    margin:0 auto;
    padding:16px 20px 60px;
  }

  .zone-group{
    margin-top:26px;
  }
  .zone-title{
    font-size:14px;
    font-weight:700;
    color:var(--rose-dark);
    text-transform:uppercase;
    letter-spacing:.5px;
    margin:0 0 10px 2px;
    display:flex;
    align-items:center;
    gap:8px;
  }
  .zone-title .count{
    font-weight:400;
    color:var(--muted);
    font-size:12px;
    text-transform:none;
    letter-spacing:0;
  }

  .grid{
    display:grid;
    grid-template-columns:repeat(auto-fill, minmax(300px,1fr));
    gap:12px;
  }

  .card{
    background:var(--card);
    border:1px solid var(--line);
    border-radius:14px;
    padding:14px 16px;
    transition:.15s;
    position:relative;
  }
  .card.done{
    background:var(--done);
    border-color:var(--done-line);
  }
  .card-top{
    display:flex;
    gap:10px;
    align-items:flex-start;
  }
  .checkbox{
    margin-top:3px;
    width:20px;
    height:20px;
    flex:none;
    accent-color:var(--rose);
    cursor:pointer;
  }
  .card.done .checkbox{ accent-color:var(--done-ink); }

  .card-body{ flex:1; min-width:0; }
  .name{
    font-size:15px;
    font-weight:600;
    margin:0 0 3px;
    color:var(--ink);
  }
  .card.done .name{ color:var(--done-ink); text-decoration:line-through; text-decoration-color:var(--done-line); }
  .addr{ font-size:12.5px; color:var(--muted); margin:0 0 6px; }
  .meta{ font-size:12.5px; color:var(--ink); display:flex; flex-direction:column; gap:3px; }
  .meta span.icon{ opacity:.7; margin-right:4px; }
  .meta a{ color:var(--rose-dark); text-decoration:none; }
  .meta a:hover{ text-decoration:underline; }

  .status-row{
    margin-top:10px;
    display:flex;
    gap:6px;
    flex-wrap:wrap;
  }
  .tag-btn{
    font-size:11px;
    padding:4px 9px;
    border-radius:20px;
    border:1px solid var(--line);
    background:#fff;
    cursor:pointer;
    color:var(--muted);
  }
  .tag-btn.active{
    background:var(--rose-light);
    border-color:var(--rose);
    color:var(--rose-dark);
    font-weight:600;
  }

  .note-input{
    margin-top:8px;
    width:100%;
    font-size:12.5px;
    padding:6px 9px;
    border:1px solid var(--line);
    border-radius:8px;
    background:#fffdfb;
    color:var(--ink);
    resize:vertical;
    min-height:30px;
    font-family:inherit;
  }

  .empty{
    text-align:center;
    color:var(--muted);
    padding:40px 0;
    font-size:14px;
  }

  footer{
    text-align:center;
    color:var(--muted);
    font-size:12px;
    padding:20px 0 40px;
  }

  @media (max-width:600px){
    header{padding:20px 16px 18px;}
    .toolbar{padding:0 14px;}
    main{padding:12px 14px 40px;}
    .grid{grid-template-columns:1fr;}
  }
</style>
</head>
<body>

<header>
  <h1>💊 Prospection Pharmacies — Champagne &amp; alentours</h1>
  <p>Reims, Châlons-en-Champagne, Épernay, Sens, Auxerre, Joigny, Vitry-le-François, Sézanne, Chaumont</p>
  <div class="stats">
    <div class="stat"><b id="stat-total">0</b>Pharmacies</div>
    <div class="stat"><b id="stat-done">0</b>Visitées</div>
    <div class="stat"><b id="stat-interested">0</b>Intéressées</div>
    <div class="stat"><b id="stat-remaining">0</b>Restantes</div>
  </div>
  <div class="progress-wrap"><div class="progress-bar" id="progress-bar"></div></div>
</header>

<div class="toolbar">
  <input type="text" id="search" placeholder="Rechercher par nom, adresse ou code postal...">
  <select id="filter-status">
    <option value="all">Tous les statuts</option>
    <option value="todo">À faire</option>
    <option value="done">Visitée</option>
    <option value="interested">Intéressée</option>
    <option value="refused">Refusé</option>
  </select>
  <select id="filter-zone">
    <option value="all">Tous les arrondissements</option>
  </select>
  <button id="export-btn">📥 Exporter CSV</button>
  <button id="reset-btn" class="reset">🗑 Réinitialiser</button>
</div>

<main id="main">
  <div class="empty" id="loading">Chargement des pharmacies…</div>
</main>

<footer>Données issues de Google Places · Reims, Châlons-en-Champagne, Épernay, Sens, Auxerre, Joigny, Vitry-le-François, Sézanne, Chaumont · pas d'adresse e-mail publique disponible, privilégier le téléphone.</footer>

<script id="pharmacy-data" type="application/json">[{"name": "Pharmacy Bride Charlier Lafayette", "address": "36 Pl. Drouet d'Erlon, 51100 Reims", "phone": "+33 3 26 47 23 26", "hours": "Lun-Sam 9h-20h, Dim fermé", "ville": "Reims", "cp": "51100", "id": "pharmacy-bride-charlier-lafayette-51100"}, {"name": "Pharmacie d'Erlon", "address": "70 Pl. Drouet d'Erlon, 51100 Reims", "phone": "+33 3 26 47 26 08", "hours": "Lun-Dim 8h-19h50", "ville": "Reims", "cp": "51100", "id": "pharmacie-d-erlon-51100"}, {"name": "Pharmacie Principale - Reims", "address": "34 Rue de Vesle, 51100 Reims", "phone": "+33 3 26 47 59 34", "hours": "Lun-Ven 9h-12h30/13h30-19h, Sam 9h-19h, Dim fermé", "ville": "Reims", "cp": "51100", "id": "pharmacie-principale-reims-51100"}, {"name": "Aprium Pharmacie Talleyrand", "address": "13 Rue de Talleyrand, 51100 Reims", "phone": "+33 3 26 47 32 32", "hours": "Lun-Ven 9h-19h30, Sam 9h-19h, Dim fermé", "ville": "Reims", "cp": "51100", "id": "aprium-pharmacie-talleyrand-51100"}, {"name": "Pharmacie de L'Esplanade", "address": "56 Rue Cérès, 51100 Reims", "phone": "+33 3 26 47 36 89", "hours": "Lun-Ven 9h-19h30, Sam 9h-18h, Dim fermé", "ville": "Reims", "cp": "51100", "id": "pharmacie-de-l-esplanade-51100"}, {"name": "Pharmacy Ardennes By Mediprix", "address": "134 Av. Jean Jaurès, 51100 Reims", "phone": "+33 3 26 07 21 85", "hours": "Lun-Sam 9h-19h30, Dim fermé", "ville": "Reims", "cp": "51100", "id": "pharmacy-ardennes-by-mediprix-51100"}, {"name": "Carrefour Reims Cernay pharmacy", "address": "2 Rte de Cernay, 51100 Reims", "phone": "+33 3 26 89 08 89", "hours": "Lun-Sam 9h-19h, Dim fermé", "ville": "Reims", "cp": "51100", "id": "carrefour-reims-cernay-pharmacy-51100"}, {"name": "Pharmacie Colbert", "address": "4 Rue Colbert, 51100 Reims", "phone": "+33 3 26 47 48 34", "hours": "Lun-Ven 9h-19h30, Sam 9h-18h30, Dim fermé", "ville": "Reims", "cp": "51100", "id": "pharmacie-colbert-51100"}, {"name": "Pharmacie des Six Cadrans", "address": "1 Rue Gambetta, 51100 Reims", "phone": "+33 3 26 47 28 14", "hours": "Lun-Ven 8h30-12h30/14h-19h30, Sam 9h-18h, Dim fermé", "ville": "Reims", "cp": "51100", "id": "pharmacie-des-six-cadrans-51100"}, {"name": "Pharmacie de Vesle", "address": "168 Rue de Vesle, 51100 Reims", "phone": "+33 3 26 47 43 26", "hours": "Lun-Sam 9h-12h15/14h-19h, Dim fermé", "ville": "Reims", "cp": "51100", "id": "pharmacie-de-vesle-51100"}, {"name": "Grande Pharmacie de Châlons MEDIPRIX", "address": "Rue du Dr Fragne, 51000 Châlons-en-Champagne", "phone": "+33 3 26 68 16 49", "hours": "Lun-Ven 8h30-12h30/13h30-19h, Sam-Dim fermé", "ville": "Châlons-en-Champagne", "cp": "51000", "id": "grande-pharmacie-de-ch-lons-mediprix-51000"}, {"name": "Pharmacie Notre Dame", "address": "1 Rue Léon Bourgeois, 51000 Châlons-en-Champagne", "phone": "+33 3 26 65 17 38", "hours": "Lun-Ven 8h30-20h, Sam 8h45-19h, Dim fermé", "ville": "Châlons-en-Champagne", "cp": "51000", "id": "pharmacie-notre-dame-51000"}, {"name": "Pharmacie de La Marne", "address": "38 Rue de la Marne, 51000 Châlons-en-Champagne", "phone": "+33 3 26 68 03 35", "hours": "Lun-Sam 8h45-19h, Dim fermé", "ville": "Châlons-en-Champagne", "cp": "51000", "id": "pharmacie-de-la-marne-51000"}, {"name": "Pharmacie Principale Sicard", "address": "2 Rue de la Marne, 51000 Châlons-en-Champagne", "phone": "+33 3 26 64 03 37", "hours": "Lun-Ven 8h45-19h30, Sam 8h45-19h, Dim fermé", "ville": "Châlons-en-Champagne", "cp": "51000", "id": "pharmacie-principale-sicard-51000"}, {"name": "Pharmacie Croix Dampierre", "address": "Av. du Président Roosevelt, 51000 Châlons-en-Champagne", "phone": "+33 3 26 21 90 00", "hours": "Lun-Ven 9h-20h, Sam-Dim fermé", "ville": "Châlons-en-Champagne", "cp": "51000", "id": "pharmacie-croix-dampierre-51000"}, {"name": "Pharmacie Saint Jacques", "address": "20 Rue Léon Bourgeois, 51000 Châlons-en-Champagne", "phone": "+33 3 26 21 43 13", "hours": "Lun-Sam 8h30-20h, Dim fermé", "ville": "Châlons-en-Champagne", "cp": "51000", "id": "pharmacie-saint-jacques-51000"}, {"name": "Pharmacie 52 République", "address": "52 Pl. de la République, 51000 Châlons-en-Champagne", "phone": "+33 3 26 65 18 92", "hours": "Lun-Ven 8h30-12h30/13h30-19h30, Sam 8h30-12h30/13h30-19h, Dim fermé", "ville": "Châlons-en-Champagne", "cp": "51000", "id": "pharmacie-52-r-publique-51000"}, {"name": "Pharmacie du Pressoir - SELIA Pharma", "address": "24 Pl. Auban Moët, 51200 Épernay", "phone": "+33 3 26 55 32 26", "hours": "Lun-Ven 8h30-19h30, Sam-Dim fermé", "ville": "Épernay", "cp": "51200", "id": "pharmacie-du-pressoir-selia-pharma-51200"}, {"name": "Pharmacie Champenoise", "address": "20 Pl. Hugues Plomb, 51200 Épernay", "phone": "+33 3 26 55 22 31", "hours": "Lun-Dim 9h-19h", "ville": "Épernay", "cp": "51200", "id": "pharmacie-champenoise-51200"}, {"name": "Aprium Pharmacie de la Place des Arcades", "address": "18 Pl. Bernard-Stasi, 51200 Épernay", "phone": "+33 3 26 54 36 55", "hours": "Lun-Sam 9h-20h, Dim fermé", "ville": "Épernay", "cp": "51200", "id": "aprium-pharmacie-de-la-place-des-arcades-51200"}, {"name": "Pharmacie de la Gare", "address": "31 Rue de Reims, 51200 Épernay", "phone": "+33 3 26 55 26 07", "hours": "Lun-Sam 8h-20h, Dim fermé", "ville": "Épernay", "cp": "51200", "id": "pharmacie-de-la-gare-51200"}, {"name": "Pharmacie Saint Vincent Epernay", "address": "6 Rue Prte Lucas, 51200 Épernay", "phone": "+33 3 26 51 87 23", "hours": "Lun-Ven 8h30-19h30, Sam 8h30-12h30/13h30-19h, Dim fermé", "ville": "Épernay", "cp": "51200", "id": "pharmacie-saint-vincent-epernay-51200"}, {"name": "Pharmacie Jean Jaurès", "address": "33 Av. Jean Jaurès, 51200 Épernay", "phone": "+33 3 26 55 22 46", "hours": "Lun-Ven 8h30-12h30/14h-19h, Sam 9h-12h30, Dim fermé", "ville": "Épernay", "cp": "51200", "id": "pharmacie-jean-jaur-s-51200"}, {"name": "Pharmacie des Archers", "address": "1 Rue des Archers, 51200 Épernay", "phone": "+33 3 26 55 30 00", "hours": "Lun-Sam 8h30-19h, Dim fermé", "ville": "Épernay", "cp": "51200", "id": "pharmacie-des-archers-51200"}, {"name": "Pharmacie de la Vaute", "address": "9 Av. d'Ettlingen, 51200 Épernay", "phone": "+33 3 26 54 53 41", "hours": "Lun-Ven 9h-12h30/14h-19h, Sam-Dim fermé", "ville": "Épernay", "cp": "51200", "id": "pharmacie-de-la-vaute-51200"}, {"name": "Pharmacie Pierre De Coubertin", "address": "3 Prom. des Champs Plaisants, 89100 Sens", "phone": "+33 3 86 95 43 82", "hours": "Lun-Ven 8h30-19h30, Sam-Dim fermé", "ville": "Sens", "cp": "89100", "id": "pharmacie-pierre-de-coubertin-89100"}, {"name": "Pharmacie Lafayette de la Cathédrale", "address": "9 Pl. de la République, 89100 Sens", "phone": "+33 3 86 65 13 75", "hours": "Lun-Sam 8h30-19h30, Dim fermé", "ville": "Sens", "cp": "89100", "id": "pharmacie-lafayette-de-la-cath-drale-89100"}, {"name": "Pharmacie de l'Europe", "address": "Av. de la Marne, 89100 Sens", "phone": "+33 3 86 65 41 89", "hours": "Lun-Sam 9h-12h30/14h-19h15, Dim fermé", "ville": "Sens", "cp": "89100", "id": "pharmacie-de-l-europe-89100"}, {"name": "Pharmacie de la Grande Rue", "address": "132-134 Grande Rue, 89100 Sens", "phone": "+33 3 86 95 12 50", "hours": "Lun-Ven 9h-19h, Sam-Dim fermé", "ville": "Sens", "cp": "89100", "id": "pharmacie-de-la-grande-rue-89100"}, {"name": "PHARMACIE CROQUET - VICHERAT", "address": "84 Rue René Binet, 89100 Sens", "phone": "+33 3 86 65 07 92", "hours": "Lun-Sam 9h-20h, Dim fermé", "ville": "Sens", "cp": "89100", "id": "pharmacie-croquet-vicherat-89100"}, {"name": "Pharmacie Champbertrand - Pharmacie Blondet", "address": "Rue Champbertrand, 89100 Sens", "phone": "+33 3 86 65 12 70", "hours": "Lun-Sam 9h-19h, Dim fermé", "ville": "Sens", "cp": "89100", "id": "pharmacie-champbertrand-pharmacie-blondet-89100"}, {"name": "Pharmacy Chaillots", "address": "2 Rue Henry Dunant, 89100 Sens", "phone": "+33 3 86 65 00 12", "hours": "Lun-Ven 9h-13h/14h-19h, Sam 9h-17h, Dim fermé", "ville": "Sens", "cp": "89100", "id": "pharmacy-chaillots-89100"}, {"name": "Pharmacie d'Abraham", "address": "18 Rue de la République, 89100 Sens", "phone": "+33 3 86 65 10 76", "hours": "Lun-Ven 8h30-19h, Sam 9h-19h, Dim fermé", "ville": "Sens", "cp": "89100", "id": "pharmacie-d-abraham-89100"}, {"name": "Pharmacie Lafayette des Clairions", "address": "1 Rue des Fourneaux, 89000 Auxerre", "phone": "+33 3 86 52 26 98", "hours": "Lun-Sam 8h30-19h30, Dim fermé", "ville": "Auxerre", "cp": "89000", "id": "pharmacie-lafayette-des-clairions-89000"}, {"name": "Pharmacie Principale Auxerre", "address": "14 Pl. Charles Surugue, 89000 Auxerre", "phone": "+33 3 86 52 19 70", "hours": "Lun-Ven 8h30-19h30, Sam 9h-19h, Dim fermé", "ville": "Auxerre", "cp": "89000", "id": "pharmacie-principale-auxerre-89000"}, {"name": "Pharmacie Jean Jaurès AUXERRE", "address": "6B Pl. Jean Jaurès, 89000 Auxerre", "phone": "+33 3 86 48 26 60", "hours": "Lun-Ven 8h30-19h30, Sam 9h-19h, Dim fermé", "ville": "Auxerre", "cp": "89000", "id": "pharmacie-jean-jaur-s-auxerre-89000"}, {"name": "PHARMACIE RIVE DROITE AUXERRE", "address": "11 Rue Charles de Foucault, 89000 Auxerre", "phone": "+33 3 86 46 95 24", "hours": "Lun-Ven 8h-19h30, Sam 8h-12h30, Dim fermé", "ville": "Auxerre", "cp": "89000", "id": "pharmacie-rive-droite-auxerre-89000"}, {"name": "Pharmacie de L'Arquebuse", "address": "17 Rue du 24 Août, 89000 Auxerre", "phone": "+33 3 86 52 01 77", "hours": "Lun-Ven 8h30-20h, Sam-Dim fermé", "ville": "Auxerre", "cp": "89000", "id": "pharmacie-de-l-arquebuse-89000"}, {"name": "Pharmacie Boudykkan (Ste Genevieve)", "address": "3 Av. Delacroix, 89000 Auxerre", "phone": "+33 3 86 46 37 14", "hours": "Lun-Ven 8h30-19h30, Sam 9h-17h, Dim fermé", "ville": "Auxerre", "cp": "89000", "id": "pharmacie-boudykkan-ste-genevieve-89000"}, {"name": "PHARMACIE ST SIMEON", "address": "Centre Commercial Saint Simeon, 89000 Auxerre", "phone": "+33 3 86 46 64 99", "hours": "Lun-Sam 8h30-19h30, Dim fermé", "ville": "Auxerre", "cp": "89000", "id": "pharmacie-st-simeon-89000"}, {"name": "Pharmacie de la Baulche", "address": "17 Av. du Château, 89000 Saint-Georges-sur-Baulche", "phone": "+33 3 86 48 10 74", "hours": "Lun-Ven 8h30-20h, Sam-Dim fermé", "ville": "Auxerre (Saint-Georges-sur-Baulche)", "cp": "89000", "id": "pharmacie-de-la-baulche-89000"}, {"name": "Pharmacie du Marché", "address": "14 Quai Henri Ragobert, 89300 Joigny", "phone": "+33 3 86 62 03 12", "hours": "Lun-Ven 8h30-12h30/14h-19h30, Sam-Dim fermé", "ville": "Joigny", "cp": "89300", "id": "pharmacie-du-march-89300"}, {"name": "Pharmacie de l'Hôpital - Mediprix", "address": "14 Av. Gambetta, 89300 Joigny", "phone": "+33 3 86 62 10 58", "hours": "Lun-Ven 8h30-12h30/14h-19h30, Sam 8h30-12h30/14h-18h30, Dim fermé", "ville": "Joigny", "cp": "89300", "id": "pharmacie-de-l-h-pital-mediprix-89300"}, {"name": "Pharmacie de la Madeleine", "address": "3 Pl. Colette, 89300 Joigny", "phone": "+33 3 86 62 02 56", "hours": "Mar-Ven 9h-12h/14h-19h, Lun-Sam-Dim fermé", "ville": "Joigny", "cp": "89300", "id": "pharmacie-de-la-madeleine-89300"}, {"name": "Pharmacie François 1er | Mediprix", "address": "1 Fbg de Châlons, 51300 Vitry-le-François", "phone": "+33 3 26 74 09 23", "hours": "Lun-Ven 8h30-19h30, Sam 8h30-19h, Dim fermé", "ville": "Vitry-le-François", "cp": "51300", "id": "pharmacie-fran-ois-1er-mediprix-51300"}, {"name": "Pharmacie Régionale", "address": "4 Gd Rue de Vaux, 51300 Vitry-le-François", "phone": "+33 3 26 74 16 47", "hours": "Lun-Ven 8h30-12h30/13h30-19h30, Sam 8h30-12h30/13h30-18h, Dim fermé", "ville": "Vitry-le-François", "cp": "51300", "id": "pharmacie-r-gionale-51300"}, {"name": "Pharmacie de la Salamandre | Mediprix", "address": "42 Av. du Colonel Moll, 51300 Vitry-le-François", "phone": "+33 3 26 74 19 11", "hours": "Lun-Ven 8h45-12h30/13h45-20h, Sam 8h45-12h30/13h45-18h, Dim fermé", "ville": "Vitry-le-François", "cp": "51300", "id": "pharmacie-de-la-salamandre-mediprix-51300"}, {"name": "Pharmacie Sophie Trussart-Villemet", "address": "13 Rue Aristide Briand, 51300 Vitry-le-François", "phone": "+33 3 26 74 50 37", "hours": "Lun-Ven 8h-12h/13h30-19h, Sam 9h-15h, Dim fermé", "ville": "Vitry-le-François", "cp": "51300", "id": "pharmacie-sophie-trussart-villemet-51300"}, {"name": "Pharmacie Will", "address": "22 Av. Marcel Bailly, 51300 Vitry-le-François", "phone": "+33 3 26 74 12 99", "hours": "Lun-Sam 9h-12h/14h-19h, Dim fermé", "ville": "Vitry-le-François", "cp": "51300", "id": "pharmacie-will-51300"}, {"name": "Pharmacie Champagne Beauté Sante", "address": "18 Pl. d'Armes, 51300 Vitry-le-François", "phone": "+33 3 26 74 00 43", "hours": "Lun-Ven 8h30-12h30/13h30-19h30, Sam 8h30-12h30/13h30-19h, Dim fermé", "ville": "Vitry-le-François", "cp": "51300", "id": "pharmacie-champagne-beaut-sante-51300"}, {"name": "Pharmacie Coeur de Champagne", "address": "49 Rue Paul Doumer, 51120 Sézanne", "phone": "+33 3 26 80 64 97", "hours": "Lun-Ven 9h-12h30/14h-19h15, Sam-Dim fermé", "ville": "Sézanne", "cp": "51120", "id": "pharmacie-coeur-de-champagne-51120"}, {"name": "Pharmacie de la République", "address": "121 Av. de la République, 52000 Chaumont", "phone": "+33 3 25 03 02 90", "hours": "Lun-Ven 8h30-19h30, Sam 8h30-12h30, Dim fermé", "ville": "Chaumont", "cp": "52000", "id": "pharmacie-de-la-r-publique-52000"}, {"name": "Pharmacie Lafayette de la Rochotte", "address": "33bis Av. d'Ashton Under Lyne, 52000 Chaumont", "phone": "+33 3 25 03 22 83", "hours": "Lun-Ven 9h-19h30, Sam 9h-12h30/13h30-17h, Dim fermé", "ville": "Chaumont", "cp": "52000", "id": "pharmacie-lafayette-de-la-rochotte-52000"}, {"name": "Pharmacie wellpharma de l'Europe", "address": "3 Av. de la République, 52000 Chaumont", "phone": "+33 3 25 03 88 91", "hours": "Lun-Ven 9h-19h30, Sam 9h-19h, Dim fermé", "ville": "Chaumont", "cp": "52000", "id": "pharmacie-wellpharma-de-l-europe-52000"}, {"name": "Pharmacie Du Cavalier", "address": "48/50 Av. de la République, 52000 Chaumont", "phone": "+33 3 25 03 12 29", "hours": "Lun-Ven 8h30-19h30, Sam 8h30-18h, Dim fermé", "ville": "Chaumont", "cp": "52000", "id": "pharmacie-du-cavalier-52000"}, {"name": "Pharmacie de la concorde Anton&Willem", "address": "5 Pl. de la Concorde, 52000 Chaumont", "phone": "+33 3 25 03 34 71", "hours": "Lun-Sam 9h-12h30/14h-19h, Dim fermé", "ville": "Chaumont", "cp": "52000", "id": "pharmacie-de-la-concorde-anton-willem-52000"}, {"name": "Pharmacie de l'Agora - Chaumont", "address": "3 Av. des États Unis, 52000 Chaumont", "phone": "+33 3 25 03 54 86", "hours": "Lun-Ven 9h-19h, Sam-Dim fermé", "ville": "Chaumont", "cp": "52000", "id": "pharmacie-de-l-agora-chaumont-52000"}]</script>
<script>
const pharmacies = JSON.parse(document.getElementById('pharmacy-data').textContent);

let state = {}; // id -> {done, status, note}

async function loadState(){
  try{
    const res = await window.storage.get('pharmacy-state-region');
    if(res && res.value){
      state = JSON.parse(res.value);
    }
  }catch(e){
    state = {};
  }
}

async function saveState(){
  try{
    await window.storage.set('pharmacy-state-region', JSON.stringify(state));
  }catch(e){
    console.error('Erreur de sauvegarde', e);
  }
}

function getEntry(id){
  if(!state[id]) state[id] = {done:false, status:'todo', note:''};
  return state[id];
}

function groupByZone(list){
  const groups = {};
  list.forEach(p=>{
    const zone = p.ville || 'Autre';
    if(!groups[zone]) groups[zone] = [];
    groups[zone].push(p);
  });
  return groups;
}

function zoneName(ville){
  return ville;
}

const STATUS_LABELS = {
  todo: {label:'À faire', class:''},
  interested: {label:'Intéressée', class:'active'},
  refused: {label:'Refusé', class:'active'},
  callback: {label:'À rappeler', class:'active'}
};

function render(){
  const main = document.getElementById('main');
  const searchVal = document.getElementById('search').value.trim().toLowerCase();
  const statusFilter = document.getElementById('filter-status').value;
  const zoneFilter = document.getElementById('filter-zone').value;

  let filtered = pharmacies.filter(p=>{
    const entry = getEntry(p.id);
    if(searchVal){
      const hay = (p.name+' '+p.address+' '+p.cp+' '+p.ville).toLowerCase();
      if(!hay.includes(searchVal)) return false;
    }
    if(zoneFilter !== 'all' && p.ville !== zoneFilter) return false;
    if(statusFilter === 'done' && !entry.done) return false;
    if(statusFilter === 'todo' && entry.done) return false;
    if(statusFilter === 'interested' && entry.status !== 'interested') return false;
    if(statusFilter === 'refused' && entry.status !== 'refused') return false;
    return true;
  });

  main.innerHTML = '';

  if(filtered.length === 0){
    main.innerHTML = '<div class="empty">Aucune pharmacie ne correspond à votre recherche.</div>';
    updateStats();
    return;
  }

  const groups = groupByZone(filtered);
  const zoneKeys = Object.keys(groups).sort();

  zoneKeys.forEach(zone=>{
    const list = groups[zone];
    const section = document.createElement('div');
    section.className = 'zone-group';

    const title = document.createElement('div');
    title.className = 'zone-title';
    title.innerHTML = \`📍 \${zoneName(zone)} <span class="count">(\${list.length})</span>\`;
    section.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'grid';

    list.forEach(p=>{
      grid.appendChild(renderCard(p));
    });

    section.appendChild(grid);
    main.appendChild(section);
  });

  updateStats();
}

function renderCard(p){
  const entry = getEntry(p.id);
  const card = document.createElement('div');
  card.className = 'card' + (entry.done ? ' done' : '');

  const top = document.createElement('div');
  top.className = 'card-top';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'checkbox';
  checkbox.checked = entry.done;
  checkbox.addEventListener('change', ()=>{
    entry.done = checkbox.checked;
    if(entry.done && entry.status === 'todo') entry.status = 'interested';
    if(!entry.done) entry.status = 'todo';
    saveState();
    render();
  });

  const body = document.createElement('div');
  body.className = 'card-body';

  const name = document.createElement('p');
  name.className = 'name';
  name.textContent = p.name;

  const addr = document.createElement('p');
  addr.className = 'addr';
  addr.textContent = p.address;

  const meta = document.createElement('div');
  meta.className = 'meta';
  const phoneHTML = p.phone && p.phone !== 'Non renseigné'
    ? \`<span class="icon">📞</span><a href="tel:\${p.phone.replace(/\\s/g,'')}">\${p.phone}</a>\`
    : \`<span class="icon">📞</span>Non renseigné\`;
  meta.innerHTML = \`
    <div>\${phoneHTML}</div>
    <div><span class="icon">🕒</span>\${p.hours}</div>
  \`;

  const statusRow = document.createElement('div');
  statusRow.className = 'status-row';
  Object.keys(STATUS_LABELS).forEach(key=>{
    if(key === 'todo') return;
    const btn = document.createElement('button');
    btn.className = 'tag-btn' + (entry.status === key ? ' active' : '');
    btn.textContent = STATUS_LABELS[key].label;
    btn.addEventListener('click', ()=>{
      entry.status = entry.status === key ? 'todo' : key;
      if(entry.status !== 'todo') entry.done = true;
      saveState();
      render();
    });
    statusRow.appendChild(btn);
  });

  const note = document.createElement('textarea');
  note.className = 'note-input';
  note.placeholder = 'Note (contact, remarques...)';
  note.value = entry.note || '';
  note.addEventListener('input', ()=>{
    entry.note = note.value;
    saveState();
  });

  body.appendChild(name);
  body.appendChild(addr);
  body.appendChild(meta);
  body.appendChild(statusRow);
  body.appendChild(note);

  top.appendChild(checkbox);
  top.appendChild(body);
  card.appendChild(top);

  return card;
}

function updateStats(){
  const total = pharmacies.length;
  let done = 0, interested = 0;
  pharmacies.forEach(p=>{
    const e = getEntry(p.id);
    if(e.done) done++;
    if(e.status === 'interested') interested++;
  });
  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-done').textContent = done;
  document.getElementById('stat-interested').textContent = interested;
  document.getElementById('stat-remaining').textContent = total - done;
  document.getElementById('progress-bar').style.width = total ? ((done/total)*100)+'%' : '0%';
}

function populateZoneFilter(){
  const select = document.getElementById('filter-zone');
  const zones = [...new Set(pharmacies.map(p=>p.ville))].sort();
  zones.forEach(z=>{
    const opt = document.createElement('option');
    opt.value = z;
    opt.textContent = z;
    select.appendChild(opt);
  });
}

function exportCSV(){
  const rows = [['Nom','Adresse','Telephone','Horaires','Visitee','Statut','Note']];
  pharmacies.forEach(p=>{
    const e = getEntry(p.id);
    rows.push([p.name, p.address, p.phone||'', p.hours, e.done?'Oui':'Non', e.status, (e.note||'').replace(/\\n/g,' ')]);
  });
  const csv = rows.map(r => r.map(field => \`"\${String(field).replace(/"/g,'""')}"\`).join(',')).join('\\n');
  const blob = new Blob(['\\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prospection_pharmacies_paris.csv';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('search').addEventListener('input', render);
document.getElementById('filter-status').addEventListener('change', render);
document.getElementById('filter-zone').addEventListener('change', render);
document.getElementById('export-btn').addEventListener('click', exportCSV);
document.getElementById('reset-btn').addEventListener('click', ()=>{
  if(confirm('Réinitialiser toute la progression (cases, statuts, notes) ?')){
    state = {};
    saveState();
    render();
  }
});

(async function init(){
  await loadState();
  populateZoneFilter();
  render();
})();
</script>

</body>
</html>
`

export default function ProspectionModule({ activeSociety, profile }: Props) {
  const [tab, setTab] = useState<"paris" | "region">("paris")

  return (
    <div className="flex-1 overflow-hidden bg-[#0a0a0a] flex flex-col">
      {/* Header onglets */}
      <div className="border-b border-zinc-900 px-4 pt-4 pb-0 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-white font-bold text-xl">💊 Prospection Pharmacies</h1>
            <p className="text-zinc-500 text-xs mt-0.5">Suivi des visites · progression sauvegardée automatiquement</p>
          </div>
        </div>
        <div className="flex gap-0">
          {([
            { id: "paris",  label: "📍 Paris & Île-de-France" },
            { id: "region", label: "🗺️ Champagne & alentours"  },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-5 py-2.5 text-sm font-bold border-b-2 transition-colors"
              style={{
                color: tab === t.id ? "#eab308" : "#52525b",
                borderColor: tab === t.id ? "#eab308" : "transparent",
                backgroundColor: "transparent",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Iframe du HTML */}
      <div className="flex-1 overflow-hidden">
        <iframe
          key={tab}
          srcDoc={tab === "paris" ? PARIS_HTML : REGION_HTML}
          className="w-full h-full border-0"
          title={tab === "paris" ? "Prospection Paris" : "Prospection Région"}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads"
        />
      </div>
    </div>
  )
}
