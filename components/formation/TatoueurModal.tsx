"use client"

import { useState } from "react"
import { X } from "lucide-react"

const TATOUEURS_HTML = `<!DOCTYPE html>
<html lang="fr">
<head><script>
window.storage={
  get:async function(k){try{var v=localStorage.getItem('butt_tatoueurs_'+k);return v?{value:v}:null;}catch(e){return null;}},
  set:async function(k,v){try{localStorage.setItem('butt_tatoueurs_'+k,v);return{key:k,value:v};}catch(e){return null;}},
  delete:async function(k){try{localStorage.removeItem('butt_tatoueurs_'+k);return{key:k,deleted:true};}catch(e){return null;}}
};
</script>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Suivi prospection tatoueurs — France</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --paper:#F5F4EF; --paper-raised:#FFFFFF; --ink:#1B2A22; --ink-soft:#5B6B60; --ink-faint:#8A968D;
    --pine:#1F4D3E; --pine-deep:#153A2E; --pine-tint:#E4ECE7;
    --rose:#C9436E; --rose-deep:#A3325A; --rose-tint:#FBE8EE;
    --line:#DEDCD1; --line-soft:#EBE9E0;
    --gold:#B8863B; --gold-tint:#F5EBD8;
    --st-todo:#8A9188; --st-contacted:#3E7CB1; --st-interested:#4C9A6A; --st-client:#B8863B;
    --st-refused:#B5533F; --st-callback:#C99A3E; --st-unreachable:#9B6FA8;
    --radius:12px; --shadow:0 1px 2px rgba(27,42,34,.06), 0 4px 14px rgba(27,42,34,.05);
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{ font-family:'IBM Plex Sans',system-ui,-apple-system,sans-serif; background:var(--paper); color:var(--ink); -webkit-font-smoothing:antialiased; }
  .mono{font-family:'IBM Plex Mono',ui-monospace,monospace;}
  a{color:inherit;}

  header{ background:linear-gradient(160deg,var(--pine) 0%, var(--pine-deep) 100%); color:#F4F7F5; padding:26px 24px 20px; position:sticky; top:0; z-index:30; box-shadow:0 6px 20px rgba(21,58,46,.25); }
  .header-row{ max-width:1240px; margin:0 auto; display:flex; align-items:flex-start; justify-content:space-between; gap:20px; flex-wrap:wrap; }
  .header-title{ display:flex; align-items:center; gap:12px; }
  .header-title .badge-cross{ width:38px; height:38px; border-radius:9px; background:rgba(255,255,255,.14); display:flex; align-items:center; justify-content:center; font-size:20px; flex:none; border:1px solid rgba(255,255,255,.2); }
  header h1{ margin:0; font-size:20px; font-weight:700; letter-spacing:.1px; }
  header p.sub{ margin:2px 0 0; font-size:12.5px; color:#CFE0D7; }
  .header-stats{ display:flex; gap:8px; flex-wrap:wrap; }
  .hstat{ background:rgba(255,255,255,.1); border:1px solid rgba(255,255,255,.18); border-radius:10px; padding:6px 12px; min-width:84px; text-align:left; }
  .hstat b{ display:block; font-family:'IBM Plex Mono'; font-size:18px; line-height:1.1; }
  .hstat span{ font-size:10.5px; color:#CFE0D7; text-transform:uppercase; letter-spacing:.4px; }
  .progress-outer{ max-width:1240px; margin:14px auto 0; height:6px; background:rgba(255,255,255,.16); border-radius:5px; overflow:hidden; }
  .progress-inner{ height:100%; background:var(--rose); width:0%; transition:width .35s ease; }

  .source-banner{
    background:var(--pine-tint); border-bottom:1px solid var(--line);
    font-size:12px; color:var(--pine-deep); text-align:center; padding:7px 16px;
  }
  .source-banner b{ font-weight:700; }

  .coverage-wrap{ background:var(--paper-raised); border-bottom:1px solid var(--line); }
  .coverage-inner{ max-width:1240px; margin:0 auto; padding:12px 24px; }
  .coverage-label{ font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--ink-faint); margin-bottom:8px; display:flex; align-items:center; gap:6px; justify-content:space-between; flex-wrap:wrap; }
  .coverage-label .hint{ text-transform:none; letter-spacing:0; font-size:11.5px; color:var(--ink-faint); }
  .coverage-strip{ display:flex; gap:5px; flex-wrap:wrap; max-height:104px; overflow-y:auto; }
  .dept-chip{ font-family:'IBM Plex Mono'; font-size:11px; font-weight:600; padding:4px 7px; border-radius:6px; cursor:pointer; user-select:none; border:1px solid var(--line); background:var(--paper); color:var(--ink-faint); transition:.12s; line-height:1.3; }
  .dept-chip.has-data{ background:var(--pine); border-color:var(--pine); color:#fff; }
  .dept-chip:hover{ transform:translateY(-1px); box-shadow:var(--shadow); }
  .dept-chip.active-filter{ outline:2px solid var(--rose); outline-offset:1px; }
  .dept-chip.dept-disabled{ background:repeating-linear-gradient(135deg, var(--paper), var(--paper) 3px, var(--line-soft) 3px, var(--line-soft) 6px); color:var(--ink-faint); border-color:var(--line); text-decoration:line-through; opacity:.6; }
  .link-btn{ background:none; border:none; padding:0; margin:0; cursor:pointer; color:var(--pine); font-weight:600; text-decoration:underline; font-size:11.5px; font-family:inherit; }
  .link-btn:hover{ color:var(--rose-deep); }

  .toolbar-wrap{ background:var(--paper); border-bottom:1px solid var(--line); position:sticky; top:96px; z-index:20; }
  @media (min-width:781px){ .toolbar-wrap{ top:88px; } }
  .toolbar{ max-width:1240px; margin:0 auto; padding:12px 24px; display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
  .toolbar input[type="text"], .toolbar select{ font-family:inherit; font-size:13.5px; padding:9px 12px; border-radius:9px; border:1px solid var(--line); background:var(--paper-raised); color:var(--ink); }
  .toolbar input[type="text"]{ flex:1; min-width:200px; }
  .toolbar select{ cursor:pointer; }
  .btn{ font-family:inherit; font-size:13px; font-weight:600; padding:9px 14px; border-radius:9px; border:1px solid var(--line); background:var(--paper-raised); color:var(--ink); cursor:pointer; transition:.12s; white-space:nowrap; }
  .btn:hover{ border-color:var(--pine); color:var(--pine); }
  .btn.primary{ background:var(--rose); border-color:var(--rose); color:#fff; }
  .btn.primary:hover{ background:var(--rose-deep); border-color:var(--rose-deep); color:#fff; }
  .btn.ghost-danger{ color:#9A4636; }
  .btn.ghost-danger:hover{ border-color:#9A4636; color:#9A4636; }
  .btn.block{ width:100%; justify-content:center; display:flex; }
  .toggle-show-disabled{ display:flex; align-items:center; gap:6px; font-size:12.5px; color:var(--ink-soft); cursor:pointer; padding:9px 4px; user-select:none; }
  .toggle-show-disabled input{ accent-color:var(--rose); width:15px; height:15px; cursor:pointer; }

  .stats-bar{ max-width:1240px; margin:0 auto; padding:14px 24px 0; display:flex; gap:10px; flex-wrap:wrap; }
  .stat-pill{ display:flex; align-items:center; gap:7px; background:var(--paper-raised); border:1px solid var(--line); border-radius:20px; padding:6px 12px 6px 8px; font-size:12.5px; }
  .stat-dot{ width:9px; height:9px; border-radius:50%; flex:none; }
  .stat-pill b{ font-family:'IBM Plex Mono'; }

  main{ max-width:1240px; margin:0 auto; padding:18px 24px 100px; }
  .dept-group{ margin-top:26px; }
  .dept-header{ display:flex; align-items:baseline; gap:10px; margin:0 0 12px 2px; flex-wrap:wrap; }
  .dept-code-badge{ font-family:'IBM Plex Mono'; font-weight:600; font-size:13px; background:var(--pine); color:#fff; padding:3px 9px; border-radius:7px; }
  .dept-header h2{ font-size:16px; margin:0; font-weight:700; }
  .dept-header .region-tag{ font-size:11.5px; color:var(--ink-faint); }
  .dept-header .dept-count{ font-size:12px; color:var(--ink-faint); margin-left:auto; }

  .grid{ display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:12px; }

  .load-more-row{ text-align:center; margin-top:14px; }
  .load-more-row button{ font-family:inherit; font-size:12.5px; font-weight:600; padding:8px 16px; border-radius:20px; border:1px solid var(--line); background:var(--paper-raised); color:var(--pine); cursor:pointer; }
  .load-more-row button:hover{ background:var(--pine-tint); }
  .load-more-groups{ text-align:center; margin-top:36px; padding-top:20px; border-top:1px dashed var(--line); }
  .load-more-groups button{ font-family:inherit; font-size:13.5px; font-weight:700; padding:11px 22px; border-radius:24px; border:1.5px solid var(--pine); background:var(--pine); color:#fff; cursor:pointer; }
  .load-more-groups button:hover{ background:var(--pine-deep); }
  .load-more-groups p{ font-size:12px; color:var(--ink-faint); margin:0 0 10px; }

  .card{ background:var(--paper-raised); border:1px solid var(--line); border-radius:var(--radius); padding:14px 16px; position:relative; transition:.12s; }
  .card:hover{ box-shadow:var(--shadow); }
  .card.is-disabled{ background:var(--paper); opacity:.62; }
  .card.is-disabled .card-name{ text-decoration:line-through; }
  .disable-toggle-btn{ font-size:11px; font-weight:600; background:none; border:1px solid var(--line); border-radius:7px; padding:5px 9px; cursor:pointer; color:var(--ink-faint); }
  .disable-toggle-btn:hover{ border-color:#9A4636; color:#9A4636; }
  .disable-toggle-btn.is-reactivate{ border-color:var(--pine); color:var(--pine); }
  .disable-toggle-btn.is-reactivate:hover{ background:var(--pine-tint); }
  .dept-group.dept-is-disabled .dept-header{ opacity:.5; }
  .dept-group.dept-is-disabled .dept-header h2::after{ content:" (département désactivé)"; font-weight:400; font-size:12px; color:var(--ink-faint); }

  .card-top{ display:flex; justify-content:space-between; gap:8px; align-items:flex-start; }
  .card-name{ font-size:15px; font-weight:700; margin:0 0 2px; line-height:1.3; }
  .card-ville{ font-size:11.5px; color:var(--ink-faint); font-weight:500; text-transform:uppercase; letter-spacing:.3px; }
  .card-addr{ font-size:12.5px; color:var(--ink-soft); margin:6px 0 8px; line-height:1.4; }
  .rating-chip{ font-family:'IBM Plex Mono'; font-size:11.5px; font-weight:600; color:var(--gold); background:var(--gold-tint); border-radius:6px; padding:2px 6px; white-space:nowrap; flex:none; }
  .card-meta{ font-size:12.5px; display:flex; flex-direction:column; gap:4px; margin-bottom:10px; }
  .card-meta .row{ display:flex; gap:6px; align-items:baseline; }
  .card-meta .icon{ opacity:.65; width:14px; flex:none; }
  .card-meta a.link{ color:var(--pine); font-weight:600; text-decoration:none; }
  .card-meta a.link:hover{ text-decoration:underline; }
  .card-meta .no-hours{ color:var(--ink-faint); font-style:italic; }
  .card-links{ display:flex; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
  .card-links a{ font-size:12px; font-weight:600; color:var(--pine); text-decoration:none; display:flex; align-items:center; gap:4px; }
  .card-links a:hover{ text-decoration:underline; }

  .status-select{ width:100%; font-family:inherit; font-size:12.5px; font-weight:600; padding:7px 9px; border-radius:8px; border:1.5px solid var(--line); background:var(--paper); color:var(--ink); cursor:pointer; margin-bottom:8px; }
  .status-select.st-a-contacter{ border-color:var(--st-todo); color:var(--st-todo); }
  .status-select.st-contacte{ border-color:var(--st-contacted); color:var(--st-contacted); background:#EAF2F8; }
  .status-select.st-interesse{ border-color:var(--st-interested); color:var(--st-interested); background:#EAF5EE; }
  .status-select.st-client{ border-color:var(--st-client); color:var(--st-client); background:var(--gold-tint); }
  .status-select.st-refuse{ border-color:var(--st-refused); color:var(--st-refused); background:#F7EAE7; }
  .status-select.st-a-rappeler{ border-color:var(--st-callback); color:var(--st-callback); background:#FBF2E1; }
  .status-select.st-injoignable{ border-color:var(--st-unreachable); color:var(--st-unreachable); background:#F2EAF4; }

  .field-row{ display:flex; gap:6px; margin-bottom:6px; }
  .field-row > div{ flex:1; min-width:0; }
  .field-label{ font-size:10px; text-transform:uppercase; letter-spacing:.4px; color:var(--ink-faint); margin-bottom:2px; display:block; }
  .field-row input[type="text"], .field-row input[type="date"], .card select.priority{ width:100%; font-family:inherit; font-size:12px; padding:6px 8px; border-radius:7px; border:1px solid var(--line); background:var(--paper); color:var(--ink); }
  .note-input{ width:100%; font-size:12.5px; padding:7px 9px; border:1px solid var(--line); border-radius:8px; background:var(--paper); color:var(--ink); resize:vertical; min-height:36px; font-family:inherit; margin-top:4px; }
  .card-footer{ display:flex; justify-content:space-between; align-items:center; margin-top:8px; }
  .updated-at{ font-size:10.5px; color:var(--ink-faint); }
  .delete-btn{ font-size:11px; color:var(--ink-faint); background:none; border:none; cursor:pointer; text-decoration:underline; }
  .delete-btn:hover{ color:#9A4636; }

  .empty{ text-align:center; padding:60px 20px; color:var(--ink-faint); font-size:14px; }
  .empty b{ display:block; font-size:16px; color:var(--ink); margin-bottom:6px; }

  .fab{ position:fixed; right:22px; bottom:22px; z-index:40; background:var(--rose); color:#fff; border:none; border-radius:50%; width:54px; height:54px; font-size:26px; cursor:pointer; box-shadow:0 8px 22px rgba(169,50,90,.4); display:flex; align-items:center; justify-content:center; transition:.12s; }
  .fab:hover{ background:var(--rose-deep); transform:translateY(-2px); }

  .modal-overlay{ position:fixed; inset:0; background:rgba(27,42,34,.45); z-index:50; display:none; align-items:center; justify-content:center; padding:20px; }
  .modal-overlay.open{ display:flex; }
  .modal{ background:var(--paper-raised); border-radius:16px; max-width:520px; width:100%; max-height:88vh; overflow-y:auto; padding:22px 24px; box-shadow:0 20px 60px rgba(0,0,0,.25); }
  .modal h3{ margin:0 0 4px; font-size:17px; }
  .modal p.hint{ font-size:12.5px; color:var(--ink-faint); margin:0 0 16px; }
  .modal label{ font-size:12px; font-weight:600; color:var(--ink-soft); display:block; margin:10px 0 4px; }
  .modal input[type="text"]{ width:100%; font-family:inherit; font-size:13.5px; padding:9px 11px; border-radius:8px; border:1px solid var(--line); background:var(--paper); }
  .modal-actions{ display:flex; gap:8px; justify-content:flex-end; margin-top:20px; }
  .modal.modal-wide{ max-width:640px; }
  #dept-modal-search{ width:100%; font-family:inherit; font-size:13.5px; padding:9px 11px; margin-top:6px; border-radius:8px; border:1px solid var(--line); background:var(--paper); }
  .dept-modal-list{ margin-top:14px; max-height:50vh; overflow-y:auto; border-top:1px solid var(--line-soft); }
  .dept-modal-region{ font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--ink-faint); padding:12px 2px 6px; }
  .dept-modal-row{ display:flex; align-items:center; gap:10px; padding:8px 2px; border-bottom:1px solid var(--line-soft); }
  .dept-modal-row .code{ font-family:'IBM Plex Mono'; font-weight:600; font-size:12.5px; width:32px; flex:none; color:var(--ink-soft); }
  .dept-modal-row .name{ flex:1; font-size:13px; min-width:0; }
  .dept-modal-row .count{ font-size:11px; color:var(--ink-faint); flex:none; }
  .switch{ position:relative; width:38px; height:22px; flex:none; }
  .switch input{ opacity:0; width:0; height:0; }
  .switch .slider{ position:absolute; cursor:pointer; inset:0; background:var(--line); border-radius:22px; transition:.15s; }
  .switch .slider::before{ content:""; position:absolute; width:16px; height:16px; left:3px; top:3px; background:#fff; border-radius:50%; transition:.15s; box-shadow:0 1px 2px rgba(0,0,0,.2); }
  .switch input:checked + .slider{ background:var(--pine); }
  .switch input:checked + .slider::before{ transform:translateX(16px); }

  footer{ text-align:center; color:var(--ink-faint); font-size:11.5px; padding:22px 20px 40px; line-height:1.7; }
  footer a{ color:var(--pine); font-weight:600; }

  @media (max-width:780px){
    header{ padding:18px 16px 16px; }
    .header-row{ flex-direction:column; }
    .coverage-inner, .toolbar, .stats-bar, main{ padding-left:16px; padding-right:16px; }
    .toolbar-wrap{ top:0; position:static; }
    header{ position:static; }
    .grid{ grid-template-columns:1fr; }
  }
</style>
</head>
<body>

<header>
  <div class="header-row">
    <div class="header-title">
      <div class="badge-cross">✚</div>
      <div>
        <h1>Suivi prospection tatoueurs — France</h1>
        <p class="sub">Gamme de soin Butt Premium · studios de tatouage, échantillon en croissance</p>
      </div>
    </div>
    <div class="header-stats">
      <div class="hstat"><b id="stat-total">0</b><span>Studios</span></div>
      <div class="hstat"><b id="stat-depts">0</b><span>Départements</span></div>
      <div class="hstat"><b id="stat-done">0</b><span>Traitées</span></div>
      <div class="hstat"><b id="stat-interested">0</b><span>Intéressées / clientes</span></div>
    </div>
  </div>
  <div class="progress-outer"><div class="progress-inner" id="progress-bar"></div></div>
</header>

<div class="source-banner">⚠️ <b>168 studios</b> — échantillon constitué via recherche (Google) + votre prospection Paris/IDF/Troyes déjà réalisée. <b>Aucun registre officiel exhaustif n'existe pour cette activité</b> (contrairement aux pharmacies) — voir le détail en pied de page.</div>

<div class="coverage-wrap">
  <div class="coverage-inner">
    <div class="coverage-label">
      <span>Couverture — 18 départements alimentés sur 102 possibles</span>
      <span class="hint" id="coverage-hint">clic = filtrer · <button class="link-btn" id="manage-depts-btn">gérer les départements</button></span>
    </div>
    <div class="coverage-strip" id="coverage-strip"></div>
  </div>
</div>

<div class="toolbar-wrap">
  <div class="toolbar">
    <input type="text" id="search" placeholder="Rechercher (nom, ville, adresse, département...)">
    <select id="filter-region"><option value="all">Toutes les régions</option></select>
    <select id="filter-dept"><option value="all">Tous les départements</option></select>
    <select id="filter-status">
      <option value="all">Tous les statuts</option>
      <option value="a_contacter">À contacter</option>
      <option value="contacte">Contacté</option>
      <option value="interesse">Intéressé</option>
      <option value="client">Client</option>
      <option value="a_rappeler">À rappeler</option>
      <option value="injoignable">Injoignable</option>
      <option value="refuse">Refusé</option>
    </select>
    <select id="filter-priority">
      <option value="all">Toutes priorités</option>
      <option value="haute">Priorité haute</option>
      <option value="moyenne">Priorité moyenne</option>
      <option value="basse">Priorité basse</option>
    </select>
    <select id="sort-by">
      <option value="dept">Trier : département</option>
      <option value="nom">Trier : nom A-Z</option>
      <option value="note">Trier : note Google</option>
      <option value="statut">Trier : statut</option>
      <option value="rappel">Trier : date de rappel</option>
    </select>
    <label class="toggle-show-disabled">
      <input type="checkbox" id="show-disabled-toggle">
      <span>Afficher les désactivées</span>
    </label>
    <button class="btn" id="export-btn">Exporter CSV</button>
    <button class="btn" id="import-btn">Importer CSV</button>
    <input type="file" id="import-file" accept=".csv" style="display:none">
    <button class="btn ghost-danger" id="reset-btn">Réinitialiser</button>
  </div>
  <div class="stats-bar" id="stats-bar"></div>
</div>

<main id="main">
  <div class="empty" id="loading"><b>Chargement…</b></div>
</main>

<button class="fab" id="add-fab" title="Ajouter un studio">+</button>

<div class="modal-overlay" id="modal-overlay">
  <div class="modal">
    <h3>Ajouter un studio de tatouage</h3>
    <p class="hint">Pour un studio repéré sur le terrain ou via Instagram/Google, absent de la liste.</p>
    <label>Nom *</label>
    <input type="text" id="new-name" placeholder="Studio Ink Paradise">
    <label>Adresse complète (avec code postal) *</label>
    <input type="text" id="new-address" placeholder="12 Rue de la République, 21000 Dijon">
    <label>Ville</label>
    <input type="text" id="new-ville" placeholder="Dijon">
    <label>Téléphone</label>
    <input type="text" id="new-phone" placeholder="+33 3 80 00 00 00">
    <label>Horaires</label>
    <input type="text" id="new-hours" placeholder="Lun-Sam 9h-19h, Dim fermé">
    <div class="modal-actions">
      <button class="btn" id="cancel-add">Annuler</button>
      <button class="btn primary" id="confirm-add">Ajouter</button>
    </div>
  </div>
</div>

<div class="modal-overlay" id="dept-modal-overlay">
  <div class="modal modal-wide">
    <h3>Gérer les départements</h3>
    <p class="hint">Désactivez un département pour masquer tous ses studios de la vue principale (les données sont conservées, rien n'est supprimé). Réactivez-le à tout moment.</p>
    <input type="text" id="dept-modal-search" placeholder="Rechercher un département ou une région...">
    <div id="dept-modal-list" class="dept-modal-list"></div>
    <div class="modal-actions">
      <button class="btn" id="dept-modal-close">Fermer</button>
    </div>
  </div>
</div>

<footer>
  <b>Pourquoi ce n'est pas exhaustif, contrairement à l'outil pharmacies :</b> les tatoueurs n'ont pas de registre national ouvert. Ils déclarent leur activité à l'ARS de leur région (obligatoire pour exercer), mais cette liste n'est publiée que pour les professionnels qui donnent leur accord explicite, région par région, en PDF non structuré — pas de fichier national téléchargeable. Le code NAF le plus proche (9609Z) mélange tatoueurs, astrologues, sophrologues et toiletteurs pour animaux sans distinction possible.<br>
  Origine des données : recherche Google Places (villes majeures) + votre prospection Paris/Île-de-France/Troyes déjà réalisée (notes d'origine conservées dans le champ Notes de chaque fiche).<br>
  Utilisez « Ajouter un studio » ou l'import CSV pour compléter au fil de votre prospection.
</footer>

<script id="pharmacy-data" type="application/json">[{"name": "American Body Art – Innocents", "address": "7 rue des Innocents, 75001 Paris", "ville": "Paris", "cp": "75001", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Chaîne 4 salons, walk-in, multi-styles, depuis +24 ans", "source": "prospection_precedente", "id": "american-body-art-innocents-75001"}, {"name": "American Body Art – St-Michel", "address": "35 bd Saint-Michel, 75006 Paris", "ville": "Paris", "cp": "75006", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Walk-in, fineline/réalisme/floral/graphique", "source": "prospection_precedente", "id": "american-body-art-st-michel-75006"}, {"name": "Abraxas Saint-Honoré", "address": "5 rue du Marché Saint-Honoré, 75001 Paris", "ville": "Paris", "cp": "75001", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Filiale Abraxas, japonisant/floral/tribal", "source": "prospection_precedente", "id": "abraxas-saint-honor-75001"}, {"name": "Showtime Tattoo Paris", "address": "23 rue Berger, 75001 Paris", "ville": "Paris", "cp": "75001", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Walk-in, fin/minimaliste/réaliste/floral/tribal/japonais", "source": "prospection_precedente", "id": "showtime-tattoo-paris-75001"}, {"name": "109 Tattoo", "address": "9 rue Tiquetonne, 75002 Paris", "ville": "Paris", "cp": "75002", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Classique, multi-styles", "source": "prospection_precedente", "id": "109-tattoo-75002"}, {"name": "Tattoo Ciel Bleu", "address": "4 rue Tiquetonne, 75002 Paris", "ville": "Paris", "cp": "75002", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Traditionnel/réaliste/graphique", "source": "prospection_precedente", "id": "tattoo-ciel-bleu-75002"}, {"name": "Art Corpus", "address": "49 rue Greneta, 75002 Paris", "ville": "Paris", "cp": "75002", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Référence depuis 2004, ~6 artistes, old school/réalisme", "source": "prospection_precedente", "id": "art-corpus-75002"}, {"name": "75 Tattoo Paris", "address": "35 rue Réaumur, 75003 Paris", "ville": "Paris", "cp": "75003", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Spécialité asiatique/japonais/chinois, formation", "source": "prospection_precedente", "id": "75-tattoo-paris-75003"}, {"name": "Walkin Tattoo", "address": "77 rue des Archives, 75003 Paris", "ville": "Paris", "cp": "75003", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Walk-in, très bien noté", "source": "prospection_precedente", "id": "walkin-tattoo-75003"}, {"name": "American Body Art – Sébastopol", "address": "24 bd Sébastopol, 75004 Paris", "ville": "Paris", "cp": "75004", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Chaîne walk-in, 3177 avis Google 4.7★, multi-styles", "source": "prospection_precedente", "id": "american-body-art-s-bastopol-75004"}, {"name": "Abraxas Beaubourg", "address": "9 rue Saint-Merri, 75004 Paris", "ville": "Paris", "cp": "75004", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Ultra-réputé, japonisant/floral/tribal, hygiène top", "source": "prospection_precedente", "id": "abraxas-beaubourg-75004"}, {"name": "Kalie Art Tattoo", "address": "3 rue Nicolas Flamel, 75004 Paris", "ville": "Paris", "cp": "75004", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "816 avis Google, graphique/animalier/fineline", "source": "prospection_precedente", "id": "kalie-art-tattoo-75004"}, {"name": "Matière Noire", "address": "6-8 rue Quincampoix, 75004 Paris", "ville": "Paris", "cp": "75004", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Fine line, réalisme, portraiture (Davide Pascarella)", "source": "prospection_precedente", "id": "mati-re-noire-75004"}, {"name": "Anomaly Tattoo", "address": "20 rue Beaubourg, 75004 Paris", "ville": "Paris", "cp": "75004", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Fondé 2008, multi-styles — à vérifier si toujours ouvert", "source": "prospection_precedente", "id": "anomaly-tattoo-75004"}, {"name": "Downtown Paris Tattoo", "address": "25 bd du Montparnasse, 75006 Paris", "ville": "Paris", "cp": "75006", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Fresko (fine line floral romantique)", "source": "prospection_precedente", "id": "downtown-paris-tattoo-75006"}, {"name": "Tin-Tin Tatouages", "address": "37 rue de Douai, 75009 Paris", "ville": "Paris", "cp": "75009", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Star nationale, 25 ans, multi-artistes, très réputé", "source": "prospection_precedente", "id": "tin-tin-tatouages-75009"}, {"name": "American Body Art – Opéra", "address": "75009 Paris (adresse précise à confirmer sur place)", "ville": "Paris", "cp": "75009", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Walk-in, 4e salon de la chaîne", "source": "prospection_precedente", "id": "american-body-art-op-ra-75009"}, {"name": "Piercing Prince Tattoo", "address": "35 bd Marguerite de Rochechouart, 75009 Paris", "ville": "Paris", "cp": "75009", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Tatouage et piercing, sur-mesure", "source": "prospection_precedente", "id": "piercing-prince-tattoo-75009"}, {"name": "L'Encre du Kraken", "address": "75011 Paris (adresse précise à confirmer sur place)", "ville": "Paris", "cp": "75011", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Walk-in, multi-styles, hygiénique", "source": "prospection_precedente", "id": "l-encre-du-kraken-75011"}, {"name": "La Bête Humaine", "address": "5 rue Pierre Chausson, 75010 Paris", "ville": "Paris", "cp": "75010", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "20 ans d'existence, réalisme/blackwork/biomécanique", "source": "prospection_precedente", "id": "la-b-te-humaine-75010"}, {"name": "Foutu pour Foutu", "address": "Canal Saint-Martin, 75010 Paris", "ville": "Paris", "cp": "75010", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Épuré, original, dessins forts", "source": "prospection_precedente", "id": "foutu-pour-foutu-75010"}, {"name": "23'Keller Tattoo", "address": "23 rue Keller, 75011 Paris", "ville": "Paris", "cp": "75011", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Depuis 1994, multi-styles, chaleureux", "source": "prospection_precedente", "id": "23-keller-tattoo-75011"}, {"name": "French Kiss Tattoo", "address": "9 rue des Trois Bornes, 75011 Paris", "ville": "Paris", "cp": "75011", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Fine line haut de gamme, Flavie Delaporte", "source": "prospection_precedente", "id": "french-kiss-tattoo-75011"}, {"name": "Tribal Act", "address": "161 rue Amelot, 75011 Paris", "ville": "Paris", "cp": "75011", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Incontournable 11e, coloré, piercing, bijoux dentaires", "source": "prospection_precedente", "id": "tribal-act-75011"}, {"name": "Tattoo Addict", "address": "13 rue Pétion, 75011 Paris", "ville": "Paris", "cp": "75011", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Réaliste, cover, piercing, sourcils", "source": "prospection_precedente", "id": "tattoo-addict-75011"}, {"name": "Bleu Noir", "address": "75011 Paris (adresse précise à confirmer sur place)", "ville": "Paris", "cp": "75011", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Galerie et studio, blackwork unique, fondé 2010", "source": "prospection_precedente", "id": "bleu-noir-75011"}, {"name": "Soul Vision Tattoo", "address": "28 rue Orfila, 75020 Paris", "ville": "Paris", "cp": "75020", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Artiste indépendant, recommandé", "source": "prospection_precedente", "id": "soul-vision-tattoo-75020"}, {"name": "CO Creative Factory", "address": "17 rue Esquirol, 75013 Paris", "ville": "Paris", "cp": "75013", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Réaliste/graphique, walk-in, très bien noté", "source": "prospection_precedente", "id": "co-creative-factory-75013"}, {"name": "La Signature", "address": "108 rue de Longchamp, 75016 Paris", "ville": "Paris", "cp": "75016", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Réaliste/portrait/japonais/cover, couleurs et N&B", "source": "prospection_precedente", "id": "la-signature-75016"}, {"name": "Ataraxie", "address": "5 rue Gustave Courbet, 75016 Paris", "ville": "Paris", "cp": "75016", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Petit tatouage, fineline permanente", "source": "prospection_precedente", "id": "ataraxie-75016"}, {"name": "Bernard Soufflet", "address": "18 rue de l'Abbé Groult, 75015 Paris", "ville": "Paris", "cp": "75015", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Artiste indépendant fidélisé, expérimenté", "source": "prospection_precedente", "id": "bernard-soufflet-75015"}, {"name": "Nautica Tattoo Paris", "address": "152 rue Saint-Charles, 75015 Paris", "ville": "Paris", "cp": "75015", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Multi-styles, dotwork/maori/japonais, piercing", "source": "prospection_precedente", "id": "nautica-tattoo-paris-75015"}, {"name": "Yael Tatoo", "address": "Rue Théodore Deck, 75015 Paris", "ville": "Paris", "cp": "75015", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Artiste indépendante, fine et douce", "source": "prospection_precedente", "id": "yael-tatoo-75015"}, {"name": "T.S Paris Joaillerie-Piercing-Tatouage", "address": "171 bd Pereire, 75017 Paris", "ville": "Paris", "cp": "75017", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "265 avis Google 4.9★, joaillerie + tatouage asiatique", "source": "prospection_precedente", "id": "t-s-paris-joaillerie-piercing-tatouage-75017"}, {"name": "La Main à Six Doigts", "address": "141 rue de Clignancourt, 75018 Paris", "ville": "Paris", "cp": "75018", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Ex Noir Mécanique, blackwork exclusif, cyber-punk", "source": "prospection_precedente", "id": "la-main-six-doigts-75018"}, {"name": "Maison Python", "address": "75019 Paris (adresse précise à confirmer sur place)", "ville": "Paris", "cp": "75019", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Artistes internationaux, créatif, ambiance douce", "source": "prospection_precedente", "id": "maison-python-75019"}, {"name": "Rouge Tattoo", "address": "74 rue Mouzaïa, 75019 Paris", "ville": "Paris", "cp": "75019", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Artiste indépendant, très professionnel", "source": "prospection_precedente", "id": "rouge-tattoo-75019"}, {"name": "Désolé Papa", "address": "75020 Paris (adresse précise à confirmer sur place)", "ville": "Paris", "cp": "75020", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Eva Edelstein, aquarelle florale/botanical, full body", "source": "prospection_precedente", "id": "d-sol-papa-75020"}, {"name": "Zazen Tattoo", "address": "75020 Paris (adresse précise à confirmer sur place)", "ville": "Paris", "cp": "75020", "dept": "75", "deptNom": "Paris", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Art asiatique/animalier, personnalisé", "source": "prospection_precedente", "id": "zazen-tattoo-75020"}, {"name": "Frontera 141", "address": "92100 Boulogne-Billancourt (adresse précise à confirmer sur place)", "ville": "Boulogne-Billancourt", "cp": "92100", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "7 tatoueurs, haut de gamme, piercing, strass dentaires", "source": "prospection_precedente", "id": "frontera-141-92100"}, {"name": "Le Diable au Corps", "address": "Salon privé, 92100 Boulogne-Billancourt", "ville": "Boulogne-Billancourt", "cp": "92100", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Virginie Diable, pin-up/floral/mandala, sur RDV", "source": "prospection_precedente", "id": "le-diable-au-corps-92100"}, {"name": "Marco Zilveti", "address": "92100 Boulogne-Billancourt (adresse précise à confirmer sur place)", "ville": "Boulogne-Billancourt", "cp": "92100", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Artiste graphiste et tatoueur", "source": "prospection_precedente", "id": "marco-zilveti-92100"}, {"name": "Black Ink Story", "address": "92300 Levallois-Perret (adresse précise à confirmer sur place)", "ville": "Levallois-Perret", "cp": "92300", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Depuis 2012, milieu hip-hop, tatouages uniques", "source": "prospection_precedente", "id": "black-ink-story-92300"}, {"name": "Le Papillon Tattoo", "address": "92300 Levallois-Perret (adresse précise à confirmer sur place)", "ville": "Levallois-Perret", "cp": "92300", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Aquarelle, tribal couleurs", "source": "prospection_precedente", "id": "le-papillon-tattoo-92300"}, {"name": "RakTattoo", "address": "92200 Neuilly-sur-Seine (adresse précise à confirmer sur place)", "ville": "Neuilly-sur-Seine", "cp": "92200", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Très bien noté, à l'écoute", "source": "prospection_precedente", "id": "raktattoo-92200"}, {"name": "L'Atelier Katattoo", "address": "92110 Clichy (adresse précise à confirmer sur place)", "ville": "Clichy", "cp": "92110", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Tribal, cartoons, créatif", "source": "prospection_precedente", "id": "l-atelier-katattoo-92110"}, {"name": "La Brulerie Tattoo", "address": "92000 Nanterre (adresse précise à confirmer sur place)", "ville": "Nanterre", "cp": "92000", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Studio privé sur RDV, cadre confortable", "source": "prospection_precedente", "id": "la-brulerie-tattoo-92000"}, {"name": "LV Tattoo", "address": "92000 Nanterre (adresse précise à confirmer sur place)", "ville": "Nanterre", "cp": "92000", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Couleurs et aquarelle", "source": "prospection_precedente", "id": "lv-tattoo-92000"}, {"name": "Harmony Tattoo", "address": "92500 Rueil-Malmaison (adresse précise à confirmer sur place)", "ville": "Rueil-Malmaison", "cp": "92500", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Studio privé, matériel stérile usage unique", "source": "prospection_precedente", "id": "harmony-tattoo-92500"}, {"name": "Tatoueur Nanterre (R. Barbet)", "address": "76 rue Raymond Barbet, 92000 Nanterre", "ville": "Nanterre", "cp": "92000", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Tatouage et piercing", "source": "prospection_precedente", "id": "tatoueur-nanterre-r-barbet-92000"}, {"name": "Tatoueur Courbevoie (bd Verdun)", "address": "54 bd de Verdun, 92400 Courbevoie", "ville": "Courbevoie", "cp": "92400", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Tatouage et piercing", "source": "prospection_precedente", "id": "tatoueur-courbevoie-bd-verdun-92400"}, {"name": "Tatoueur Puteaux (sq. Léon Blum)", "address": "10 square Léon Blum, 92800 Puteaux", "ville": "Puteaux", "cp": "92800", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Multi-prestations", "source": "prospection_precedente", "id": "tatoueur-puteaux-sq-l-on-blum-92800"}, {"name": "Tatoueur La Garenne (r. Médéric)", "address": "83 rue Médéric, 92250 La Garenne-Colombes", "ville": "La Garenne-Colombes", "cp": "92250", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Salon tatouage", "source": "prospection_precedente", "id": "tatoueur-la-garenne-r-m-d-ric-92250"}, {"name": "Tatoueur Suresnes (Espl. Courtieux)", "address": "18 Esplanade des Courtieux, 92150 Suresnes", "ville": "Suresnes", "cp": "92150", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Tattoo, piercing, éphémère", "source": "prospection_precedente", "id": "tatoueur-suresnes-espl-courtieux-92150"}, {"name": "Tatoueur Suresnes (r. St-Cloud)", "address": "11 rue de Saint-Cloud, 92150 Suresnes", "ville": "Suresnes", "cp": "92150", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Studio tatouage", "source": "prospection_precedente", "id": "tatoueur-suresnes-r-st-cloud-92150"}, {"name": "Tatoueur Boulogne (r. Belle Feuille)", "address": "44 rue de la Belle Feuille, 92100 Boulogne-Billancourt", "ville": "Boulogne-Billancourt", "cp": "92100", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Tatouage et piercing", "source": "prospection_precedente", "id": "tatoueur-boulogne-r-belle-feuille-92100"}, {"name": "Black Bouddha", "address": "34 av. Maurice Berteaux, 78500 Sartrouville", "ville": "Sartrouville", "cp": "78500", "dept": "78", "deptNom": "Yvelines", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Salon privé sur RDV, spécialisé", "source": "prospection_precedente", "id": "black-bouddha-78500"}, {"name": "Deux Mains", "address": "17 rue de l'Orangerie, 78000 Versailles", "ville": "Versailles", "cp": "78000", "dept": "78", "deptNom": "Yvelines", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "5 artistes, 329 avis Google 5★, multi-styles + expo", "source": "prospection_precedente", "id": "deux-mains-78000"}, {"name": "Choub Tattoo", "address": "57 rue Angiviller, 78120 Rambouillet", "ville": "Rambouillet", "cp": "78120", "dept": "78", "deptNom": "Yvelines", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "4.9 Google / 56 avis, réaliste/graphique/mandala", "source": "prospection_precedente", "id": "choub-tattoo-78120"}, {"name": "Denis Tattoo – Since 89", "address": "78150 Le Chesnay-Rocquencourt (adresse précise à confirmer sur place)", "ville": "Le Chesnay-Rocquencourt", "cp": "78150", "dept": "78", "deptNom": "Yvelines", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Enseigne historique depuis 1989", "source": "prospection_precedente", "id": "denis-tattoo-since-89-78150"}, {"name": "Sixtine Tattoo Shop", "address": "1 av. Georges Clémenceau, 95250 Beauchamp", "ville": "Beauchamp", "cp": "95250", "dept": "95", "deptNom": "Val-d'Oise", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "236 avis Google 4.9★, 10 ans, multi-styles, piercing titane", "source": "prospection_precedente", "id": "sixtine-tattoo-shop-95250"}, {"name": "Skull N Soul", "address": "44 av. Jean Jaurès, 93000 Bobigny", "ville": "Bobigny", "cp": "93000", "dept": "93", "deptNom": "Seine-Saint-Denis", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Studio expert, créatif, convivial", "source": "prospection_precedente", "id": "skull-n-soul-93000"}, {"name": "Reshana-Henne", "address": "17 av. Jean Moulin, 93100 Montreuil", "ville": "Montreuil", "cp": "93100", "dept": "93", "deptNom": "Seine-Saint-Denis", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Multi-styles, pro, matériel haut de gamme", "source": "prospection_precedente", "id": "reshana-henne-93100"}, {"name": "LAMARQUE Tatoo", "address": "93200 Saint-Denis (adresse précise à confirmer sur place)", "ville": "Saint-Denis", "cp": "93200", "dept": "93", "deptNom": "Seine-Saint-Denis", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Salon privé, dessins originaux hors sentiers battus", "source": "prospection_precedente", "id": "lamarque-tatoo-93200"}, {"name": "Zazen Tattoo Saint-Denis", "address": "93200 Saint-Denis (adresse précise à confirmer sur place)", "ville": "Saint-Denis", "cp": "93200", "dept": "93", "deptNom": "Seine-Saint-Denis", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Art asiatique, animalier, personnalisé", "source": "prospection_precedente", "id": "zazen-tattoo-saint-denis-93200"}, {"name": "Saint Maur Ink", "address": "13 bd Maurice Berteaux, 94100 Saint-Maur-des-Fossés", "ville": "Saint-Maur-des-Fossés", "cp": "94100", "dept": "94", "deptNom": "Val-de-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "192 avis Google 4.8★, néo-trad/maori/asiatique, RDV+devis", "source": "prospection_precedente", "id": "saint-maur-ink-94100"}, {"name": "Stamp'ink Tattoo", "address": "57 av. Victor Hugo, 94600 Choisy-le-Roi", "ville": "Choisy-le-Roi", "cp": "94600", "dept": "94", "deptNom": "Val-de-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "91 avis Google 5★, 12 ans, mandala/calligraphie/sur-mesure", "source": "prospection_precedente", "id": "stamp-ink-tattoo-94600"}, {"name": "Pierce Fusion", "address": "Centre-ville, 94300 Vincennes", "ville": "Vincennes", "cp": "94300", "dept": "94", "deptNom": "Val-de-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Tatouage et bijoux piercing", "source": "prospection_precedente", "id": "pierce-fusion-94300"}, {"name": "Kenza Iskounene", "address": "135 rue Dalayrac, 94120 Fontenay-sous-Bois", "ville": "Fontenay-sous-Bois", "cp": "94120", "dept": "94", "deptNom": "Val-de-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Studio privé chaleureux, personnalisé, hygiène stricte", "source": "prospection_precedente", "id": "kenza-iskounene-94120"}, {"name": "Chris I Ink Tattoo", "address": "18 imp. des Mûriers, 94210 La Varenne-Saint-Hilaire", "ville": "La Varenne-Saint-Hilaire", "cp": "94210", "dept": "94", "deptNom": "Val-de-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Chris, expérimenté, propre, prix raisonnables", "source": "prospection_precedente", "id": "chris-i-ink-tattoo-94210"}, {"name": "Skin Tattoo", "address": "94500 Champigny-sur-Marne (adresse précise à confirmer sur place)", "ville": "Champigny-sur-Marne", "cp": "94500", "dept": "94", "deptNom": "Val-de-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Expert japonais, tatouage dos", "source": "prospection_precedente", "id": "skin-tattoo-94500"}, {"name": "Croodz Ink", "address": "92220 Bagneux (adresse précise à confirmer sur place)", "ville": "Bagneux", "cp": "92220", "dept": "92", "deptNom": "Hauts-de-Seine", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Permanent, qualité première", "source": "prospection_precedente", "id": "croodz-ink-92220"}, {"name": "Ink'Head Needles", "address": "11 rue de la Cordonnerie, 77100 Meaux", "ville": "Meaux", "cp": "77100", "dept": "77", "deptNom": "Seine-et-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "585 avis Google 5★, 105m², showroom, bijoux artisanaux, formation", "source": "prospection_precedente", "id": "ink-head-needles-77100"}, {"name": "Angel's Art Studio", "address": "40 rue du Grand Cerf, 77100 Meaux", "ville": "Meaux", "cp": "77100", "dept": "77", "deptNom": "Seine-et-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "376 avis Google 4.7★, 22 ans d'expérience, tous styles", "source": "prospection_precedente", "id": "angel-s-art-studio-77100"}, {"name": "Ace's Tattoo Shop", "address": "77170 Brie-Comte-Robert (adresse précise à confirmer sur place)", "ville": "Brie-Comte-Robert", "cp": "77170", "dept": "77", "deptNom": "Seine-et-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Sérieux, qualité, avis clients positifs", "source": "prospection_precedente", "id": "ace-s-tattoo-shop-77170"}, {"name": "La Piqûre", "address": "91 rue de Sommeville, 77380 Combs-la-Ville", "ville": "Combs-la-Ville", "cp": "77380", "dept": "77", "deptNom": "Seine-et-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Fine line, micro-réaliste, minimaliste, sur RDV", "source": "prospection_precedente", "id": "la-piq-re-77380"}, {"name": "Monstres et Merveilles", "address": "77200 Torcy (adresse précise à confirmer sur place)", "ville": "Torcy", "cp": "77200", "dept": "77", "deptNom": "Seine-et-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Salon privé, recouvrement, repigmentation mammaire, art et sculpture", "source": "prospection_precedente", "id": "monstres-et-merveilles-77200"}, {"name": "Noirpink", "address": "77450 Marne-la-Vallée (adresse précise à confirmer sur place)", "ville": "Marne-la-Vallée", "cp": "77450", "dept": "77", "deptNom": "Seine-et-Marne", "region": "Île-de-France", "phone": null, "hours": null, "rating": null, "notes_seed": "Privé sur RDV, multi-styles, guests internationaux, proche Disney", "source": "prospection_precedente", "id": "noirpink-77450"}, {"name": "Black Side Tattoo", "address": "10000 Troyes (adresse précise à confirmer sur place)", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "PRIORITÉ 1 — Multi-primés conventions nationales, Anthony et Candy", "source": "prospection_precedente", "id": "black-side-tattoo-10000"}, {"name": "CDC Ink / Le Petit Gredin", "address": "4 rue des Quinze Vingts, 10000 Troyes", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "PRIORITÉ 1 — Studio privé, blackwork/micro-réalisme, 5★, profil Butt Premium idéal", "source": "prospection_precedente", "id": "cdc-ink-le-petit-gredin-10000"}, {"name": "Leonie Kats Tattoo & Piercing", "address": "35 rue Louis Mony, 10000 Troyes", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "PRIORITÉ 1 — 5★ / 22 avis Google, à contacter en premier", "source": "prospection_precedente", "id": "leonie-kats-tattoo-piercing-10000"}, {"name": "Chatman Tattoo-Shop", "address": "25 rue des Quinze Vingts, 10000 Troyes", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "Sur-mesure, D-lan diplômé, avis 5★", "source": "prospection_precedente", "id": "chatman-tattoo-shop-10000"}, {"name": "Srize Arts Tattoo", "address": "35 rue Turenne, 10000 Troyes", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "Qualité supérieure, accueil chaleureux", "source": "prospection_precedente", "id": "srize-arts-tattoo-10000"}, {"name": "Carlo Tattoo", "address": "10000 Troyes (adresse précise à confirmer sur place)", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "Répertorié Petit Futé", "source": "prospection_precedente", "id": "carlo-tattoo-10000"}, {"name": "Tea Time Tattoo", "address": "7 rue des Terrasses, 10000 Troyes", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "Studio récent", "source": "prospection_precedente", "id": "tea-time-tattoo-10000"}, {"name": "VIPiercing", "address": "16 rue du Général Saussier, 10000 Troyes", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "Tatouage et piercing, rapport qualité/prix imbattable", "source": "prospection_precedente", "id": "vipiercing-10000"}, {"name": "Le Manoir Tattoo Shop", "address": "10000 Troyes (adresse précise à confirmer sur place)", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "Avis 5★ récent", "source": "prospection_precedente", "id": "le-manoir-tattoo-shop-10000"}, {"name": "Miesch Joël", "address": "8 rue des Écrevolles, 10000 Troyes", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "Artiste indépendant, créations personnalisées", "source": "prospection_precedente", "id": "miesch-jo-l-10000"}, {"name": "Salon 9 bd du 1er RAM", "address": "9 bd du 1er RAM, 10000 Troyes", "ville": "Troyes", "cp": "10000", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "Rapport qualité/prix imbattable selon avis clients", "source": "prospection_precedente", "id": "salon-9-bd-du-1er-ram-10000"}, {"name": "Salon Romilly-sur-Seine", "address": "11 rue de la Boule d'Or, 10290 Romilly-sur-Seine", "ville": "Romilly-sur-Seine", "cp": "10290", "dept": "10", "deptNom": "Aube", "region": "Grand Est", "phone": null, "hours": null, "rating": null, "notes_seed": "36 km de Troyes — à inclure en tournée Aube", "source": "prospection_precedente", "id": "salon-romilly-sur-seine-10290"}, {"name": "Pick Tattoo Studio", "address": "7 Rue du Jardin des Plantes, 69001 Lyon", "phone": "+33 4 78 27 73 50", "hours": "Lun fermé, Mar-Ven 13h-19h, Sam 10h-19h, Dim fermé", "rating": 4.9, "ville": "Lyon", "cp": "69001", "dept": "69", "deptNom": "Rhône", "region": "Auvergne-Rhône-Alpes", "notes_seed": null, "source": "google_places", "id": "pick-tattoo-studio-69001"}, {"name": "Phoenix Tattoo Studio", "address": "8 Rue Joseph Serlin, 69001 Lyon", "phone": "+33 4 87 78 37 80", "hours": "Lun-Sam 9h-19h, Dim fermé", "rating": 5.0, "ville": "Lyon", "cp": "69001", "dept": "69", "deptNom": "Rhône", "region": "Auvergne-Rhône-Alpes", "notes_seed": null, "source": "google_places", "id": "phoenix-tattoo-studio-69001"}, {"name": "MBA - My Body Art Tatouage et piercing", "address": "22 Rue Terme, 69001 Lyon", "phone": "+33 4 28 29 27 77", "hours": "Lun-Sam 10h-20h, Dim fermé", "rating": 4.6, "ville": "Lyon", "cp": "69001", "dept": "69", "deptNom": "Rhône", "region": "Auvergne-Rhône-Alpes", "notes_seed": null, "source": "google_places", "id": "mba-my-body-art-tatouage-et-piercing-69001"}, {"name": "L'Atelier Tattoo", "address": "9 Bd des Brotteaux, 69006 Lyon", "phone": "+33 4 37 24 45 69", "hours": "Lun/Mer/Jeu/Sam 10h30-16h, Mar-Ven fermé, Dim fermé", "rating": 4.8, "ville": "Lyon", "cp": "69006", "dept": "69", "deptNom": "Rhône", "region": "Auvergne-Rhône-Alpes", "notes_seed": null, "source": "google_places", "id": "l-atelier-tattoo-69006"}, {"name": "681 Tattoos", "address": "158 Rue Vendôme, 69003 Lyon", "phone": "+33 4 82 31 17 60", "hours": "Lun fermé, Mar-Sam 11h-13h/14h-18h, Dim fermé", "rating": 4.9, "ville": "Lyon", "cp": "69003", "dept": "69", "deptNom": "Rhône", "region": "Auvergne-Rhône-Alpes", "notes_seed": null, "source": "google_places", "id": "681-tattoos-69003"}, {"name": "Savoir Faire Tatouage - Lyon", "address": "9 Mnt de la Grande-Côte, 69001 Lyon", "phone": "+33 9 75 36 98 45", "hours": "Lun-Sam 11h-19h, Dim fermé", "rating": 5.0, "ville": "Lyon", "cp": "69001", "dept": "69", "deptNom": "Rhône", "region": "Auvergne-Rhône-Alpes", "notes_seed": null, "source": "google_places", "id": "savoir-faire-tatouage-lyon-69001"}, {"name": "Piercing Lyon & Tattoo - MaPetiteImprimerie", "address": "79 Cr Lafayette, 69006 Lyon", "phone": "+33 6 81 35 34 91", "hours": "Lun-Ven 10h-21h, Sam 12h-21h, Dim 14h-18h", "rating": 5.0, "ville": "Lyon", "cp": "69006", "dept": "69", "deptNom": "Rhône", "region": "Auvergne-Rhône-Alpes", "notes_seed": null, "source": "google_places", "id": "piercing-lyon-tattoo-mapetiteimprimerie-69006"}, {"name": "Flamingo Tattoo Club", "address": "22 Rue Longue, 69001 Lyon", "phone": null, "hours": "Lun fermé, Mar-Ven 11h-19h, Sam 10h-19h, Dim fermé", "rating": 5.0, "ville": "Lyon", "cp": "69001", "dept": "69", "deptNom": "Rhône", "region": "Auvergne-Rhône-Alpes", "notes_seed": null, "source": "google_places", "id": "flamingo-tattoo-club-69001"}, {"name": "Prisme Tattoo Marseille", "address": "75 Rue des Vertus, 13005 Marseille", "phone": "+33 9 87 00 78 60", "hours": "Lun fermé, Mar-Sam 12h-19h, Dim fermé", "rating": 5.0, "ville": "Marseille", "cp": "13005", "dept": "13", "deptNom": "Bouches-du-Rhône", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "prisme-tattoo-marseille-13005"}, {"name": "Jolie Fleur Tattoo", "address": "7 Rue Tapis Vert, 13001 Marseille", "phone": "+33 6 95 99 46 15", "hours": "Lun-Dim 10h-18h", "rating": 4.8, "ville": "Marseille", "cp": "13001", "dept": "13", "deptNom": "Bouches-du-Rhône", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "jolie-fleur-tattoo-13001"}, {"name": "Tattoo Art Club", "address": "51 Rue Edmond Rostand, 13006 Marseille", "phone": "+33 6 68 99 89 34", "hours": "Lun-Mar/Jeu 9h-19h, Sam 13h-19h, Dim 14h-19h, Mer/Ven fermé", "rating": 5.0, "ville": "Marseille", "cp": "13006", "dept": "13", "deptNom": "Bouches-du-Rhône", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "tattoo-art-club-13006"}, {"name": "The Hive Tattoo Marseille", "address": "5 Rue Pisançon, 13001 Marseille", "phone": "+33 9 82 38 93 44", "hours": "Lun fermé, Mar-Sam 11h-19h, Dim fermé", "rating": 5.0, "ville": "Marseille", "cp": "13001", "dept": "13", "deptNom": "Bouches-du-Rhône", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "the-hive-tattoo-marseille-13001"}, {"name": "Cobalt Studio - Tatouage Marseille", "address": "59 Bd Camille Flammarion, 13001 Marseille", "phone": null, "hours": "Lun fermé, Mar-Sam 11h-18h, Dim fermé", "rating": 5.0, "ville": "Marseille", "cp": "13001", "dept": "13", "deptNom": "Bouches-du-Rhône", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "cobalt-studio-tatouage-marseille-13001"}, {"name": "L'Aiguille Tatouage Marseille", "address": "120 Rue de Lodi, 13006 Marseille", "phone": "+33 4 91 71 32 76", "hours": "Lun fermé, Mar-Sam 10h-19h, Dim fermé", "rating": 4.8, "ville": "Marseille", "cp": "13006", "dept": "13", "deptNom": "Bouches-du-Rhône", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "l-aiguille-tatouage-marseille-13006"}, {"name": "Studio13 TattooBar", "address": "62 Rue Breteuil, 13006 Marseille", "phone": "+33 4 96 10 38 59", "hours": "Lun fermé, Mar-Sam 12h30-18h30, Dim fermé", "rating": 4.9, "ville": "Marseille", "cp": "13006", "dept": "13", "deptNom": "Bouches-du-Rhône", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "studio13-tattoobar-13006"}, {"name": "Kronos Studio", "address": "44 Rue Edouard Delanglade, 13006 Marseille", "phone": "+33 7 49 03 72 93", "hours": "Lun-Dim 9h-19h", "rating": 5.0, "ville": "Marseille", "cp": "13006", "dept": "13", "deptNom": "Bouches-du-Rhône", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "kronos-studio-13006"}, {"name": "Sorry Mom Tattoo", "address": "6 Rue Jacques-Matthieu Delpech, 31000 Toulouse", "phone": "+33 5 62 84 64 72", "hours": "Lun-Sam 10h-19h, Dim fermé", "rating": 4.9, "ville": "Toulouse", "cp": "31000", "dept": "31", "deptNom": "Haute-Garonne", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "sorry-mom-tattoo-31000"}, {"name": "La Promenade", "address": "233 Av. de Muret, 31300 Toulouse", "phone": null, "hours": "Lun-Sam 10h-19h, Dim fermé", "rating": 5.0, "ville": "Toulouse", "cp": "31300", "dept": "31", "deptNom": "Haute-Garonne", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "la-promenade-31300"}, {"name": "Tizia Tal", "address": "19 Gd Rue Nazareth, 31000 Toulouse", "phone": "+33 6 11 74 59 70", "hours": "Lun-Sam 8h-20h, Dim fermé", "rating": 5.0, "ville": "Toulouse", "cp": "31000", "dept": "31", "deptNom": "Haute-Garonne", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "tizia-tal-31000"}, {"name": "La Cour des Miracles", "address": "20 Rue des Changes, 31000 Toulouse", "phone": "+33 5 61 53 92 55", "hours": "Lun fermé, Mar-Sam 10h-19h, Dim fermé", "rating": 4.6, "ville": "Toulouse", "cp": "31000", "dept": "31", "deptNom": "Haute-Garonne", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "la-cour-des-miracles-31000"}, {"name": "Bisque Rage - Salon de Tatouage et Piercing", "address": "4 Rue du Puits Vert, 31000 Toulouse", "phone": "+33 7 82 59 18 35", "hours": "Lun 14h-19h, Mar-Sam 11h-19h, Dim fermé", "rating": 5.0, "ville": "Toulouse", "cp": "31000", "dept": "31", "deptNom": "Haute-Garonne", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "bisque-rage-salon-de-tatouage-et-piercing-31000"}, {"name": "Blessed Coast Tattoo", "address": "89bis All. Charles de Fitte, 31300 Toulouse", "phone": null, "hours": "Lun fermé, Mar-Sam 12h-19h, Dim fermé", "rating": 5.0, "ville": "Toulouse", "cp": "31300", "dept": "31", "deptNom": "Haute-Garonne", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "blessed-coast-tattoo-31300"}, {"name": "By O' Tattoo", "address": "3 Rue Saint-Germier, 31000 Toulouse", "phone": "+33 7 80 94 72 73", "hours": "Lun fermé, Mar-Sam 13h-19h, Dim fermé", "rating": 5.0, "ville": "Toulouse", "cp": "31000", "dept": "31", "deptNom": "Haute-Garonne", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "by-o-tattoo-31000"}, {"name": "Body and Soul Tattoo", "address": "81 Av. de Muret, 31300 Toulouse", "phone": "+33 5 34 63 91 88", "hours": "Lun fermé, Mar-Sam 10h-18h, Dim fermé", "rating": 4.9, "ville": "Toulouse", "cp": "31300", "dept": "31", "deptNom": "Haute-Garonne", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "body-and-soul-tattoo-31300"}, {"name": "Tattoo Family Bordeaux", "address": "11 Rue de Guienne, 33000 Bordeaux", "phone": "+33 9 52 84 13 04", "hours": "Lun-Sam 10h30-19h, Dim fermé", "rating": 4.9, "ville": "Bordeaux", "cp": "33000", "dept": "33", "deptNom": "Gironde", "region": "Nouvelle-Aquitaine", "notes_seed": null, "source": "google_places", "id": "tattoo-family-bordeaux-33000"}, {"name": "The Grocery Tattoo Gallery", "address": "21 Cr de l'Argonne, 33000 Bordeaux", "phone": "+33 5 56 20 73 42", "hours": "Lun fermé, Mar-Sam 11h-18h30, Dim fermé", "rating": 4.9, "ville": "Bordeaux", "cp": "33000", "dept": "33", "deptNom": "Gironde", "region": "Nouvelle-Aquitaine", "notes_seed": null, "source": "google_places", "id": "the-grocery-tattoo-gallery-33000"}, {"name": "Le Terrier", "address": "5-6 Rue Ausone, 33000 Bordeaux", "phone": "+33 5 56 38 95 65", "hours": "Lun-Dim 11h-19h", "rating": 4.9, "ville": "Bordeaux", "cp": "33000", "dept": "33", "deptNom": "Gironde", "region": "Nouvelle-Aquitaine", "notes_seed": null, "source": "google_places", "id": "le-terrier-33000"}, {"name": "L'Arcane Sans Nom", "address": "26 Rue de Cursol, 33000 Bordeaux", "phone": "+33 7 49 75 96 49", "hours": "Lun fermé, Mar-Sam 11h-19h, Dim fermé", "rating": 5.0, "ville": "Bordeaux", "cp": "33000", "dept": "33", "deptNom": "Gironde", "region": "Nouvelle-Aquitaine", "notes_seed": null, "source": "google_places", "id": "l-arcane-sans-nom-33000"}, {"name": "FTC Bordeaux", "address": "77 Cr Victor Hugo, 33000 Bordeaux", "phone": "+33 5 56 38 41 66", "hours": "Lun-Sam 10h30-19h, Dim fermé", "rating": 4.9, "ville": "Bordeaux", "cp": "33000", "dept": "33", "deptNom": "Gironde", "region": "Nouvelle-Aquitaine", "notes_seed": null, "source": "google_places", "id": "ftc-bordeaux-33000"}, {"name": "Bodyfikation - Tatoueur Piercing Bordeaux", "address": "90 Cr Gambetta, 33400 Talence", "phone": "+33 9 52 35 04 75", "hours": "Lun-Sam 10h-18h, Dim fermé", "rating": 4.9, "ville": "Talence (Bordeaux)", "cp": "33400", "dept": "33", "deptNom": "Gironde", "region": "Nouvelle-Aquitaine", "notes_seed": null, "source": "google_places", "id": "bodyfikation-tatoueur-piercing-bordeaux-33400"}, {"name": "Fatline Tattoo Club", "address": "3 Rue Paul Berthelot, 33300 Bordeaux", "phone": null, "hours": "Lun-Sam 11h-18h, Dim fermé", "rating": 4.9, "ville": "Bordeaux", "cp": "33300", "dept": "33", "deptNom": "Gironde", "region": "Nouvelle-Aquitaine", "notes_seed": null, "source": "google_places", "id": "fatline-tattoo-club-33300"}, {"name": "Baron Noir - Tatoueur Bordeaux", "address": "32 Av. Thiers, 33100 Bordeaux", "phone": "+33 5 57 61 64 96", "hours": "Lun-Sam 10h-18h, Dim fermé", "rating": 5.0, "ville": "Bordeaux", "cp": "33100", "dept": "33", "deptNom": "Gironde", "region": "Nouvelle-Aquitaine", "notes_seed": null, "source": "google_places", "id": "baron-noir-tatoueur-bordeaux-33100"}, {"name": "Tattoo Tek Studio", "address": "30 Pl. du Lion d'Or, 59800 Lille", "phone": "+33 9 88 33 79 66", "hours": "Lun fermé, Mar-Sam 11h-18h, Dim fermé", "rating": 5.0, "ville": "Lille", "cp": "59800", "dept": "59", "deptNom": "Nord", "region": "Hauts-de-France", "notes_seed": null, "source": "google_places", "id": "tattoo-tek-studio-59800"}, {"name": "Le Cercle d'Or - Lille", "address": "55 Bd de la Liberté, 59800 Lille", "phone": "+33 3 20 86 95 44", "hours": "Lun-Sam 11h-19h, Dim fermé", "rating": 5.0, "ville": "Lille", "cp": "59800", "dept": "59", "deptNom": "Nord", "region": "Hauts-de-France", "notes_seed": null, "source": "google_places", "id": "le-cercle-d-or-lille-59800"}, {"name": "Kawaii Place Tattoo Piercing", "address": "38 Rue des Postes, 59000 Lille", "phone": "+33 6 59 00 24 36", "hours": "Lun-Sam 10h-12h/14h-19h, Dim fermé", "rating": 4.8, "ville": "Lille", "cp": "59000", "dept": "59", "deptNom": "Nord", "region": "Hauts-de-France", "notes_seed": null, "source": "google_places", "id": "kawaii-place-tattoo-piercing-59000"}, {"name": "Tit For Tat", "address": "53 Rue Saint-André, 59800 Lille", "phone": "+33 9 87 08 62 63", "hours": "Lun 14h-19h, Mar-Sam 11h-19h, Dim fermé", "rating": 4.9, "ville": "Lille", "cp": "59800", "dept": "59", "deptNom": "Nord", "region": "Hauts-de-France", "notes_seed": null, "source": "google_places", "id": "tit-for-tat-59800"}, {"name": "Love Arte Tattoo Studio Lille", "address": "5 Rue de la Monnaie, 59800 Lille", "phone": "+33 7 44 41 12 91", "hours": "Lun-Dim 11h-19h", "rating": 4.9, "ville": "Lille", "cp": "59800", "dept": "59", "deptNom": "Nord", "region": "Hauts-de-France", "notes_seed": null, "source": "google_places", "id": "love-arte-tattoo-studio-lille-59800"}, {"name": "Sweet'Ink Studio", "address": "208 Rue du Faubourg d'Arras, 59000 Lille", "phone": null, "hours": "Lun fermé, Mar-Sam 11h-19h, Dim fermé", "rating": 4.8, "ville": "Lille", "cp": "59000", "dept": "59", "deptNom": "Nord", "region": "Hauts-de-France", "notes_seed": null, "source": "google_places", "id": "sweet-ink-studio-59000"}, {"name": "Old Blue Tattoo", "address": "20 Pl. Sébastopol, 59000 Lille", "phone": "+33 6 15 26 94 40", "hours": "Lun 12h-18h, Mar-Sam 10h-18h, Dim fermé", "rating": 4.9, "ville": "Lille", "cp": "59000", "dept": "59", "deptNom": "Nord", "region": "Hauts-de-France", "notes_seed": null, "source": "google_places", "id": "old-blue-tattoo-59000"}, {"name": "Freaky Family Tattoo - Piercing", "address": "16 Rue Gombert, 59800 Lille", "phone": "+33 7 59 63 60 83", "hours": "Lun-Mar fermé, Mer-Sam 11h-18h30, Dim fermé", "rating": 4.7, "ville": "Lille", "cp": "59800", "dept": "59", "deptNom": "Nord", "region": "Hauts-de-France", "notes_seed": null, "source": "google_places", "id": "freaky-family-tattoo-piercing-59800"}, {"name": "Corpus Memori Tattoo and Piercing", "address": "6 Rue des Chapeliers, 44000 Nantes", "phone": "+33 9 80 54 16 38", "hours": "Lun 14h-19h, Mar/Mer/Ven 11h-12h/14h-19h, Jeu 14h-19h, Sam-Dim fermé", "rating": 4.8, "ville": "Nantes", "cp": "44000", "dept": "44", "deptNom": "Loire-Atlantique", "region": "Pays de la Loire", "notes_seed": null, "source": "google_places", "id": "corpus-memori-tattoo-and-piercing-44000"}, {"name": "L'Art au Gant Tattoo Piercing Shop", "address": "8 All. d'Orléans, 44000 Nantes", "phone": "+33 2 40 47 97 09", "hours": "Lun 14h-19h, Mar-Sam 11h-19h, Dim fermé", "rating": 4.8, "ville": "Nantes", "cp": "44000", "dept": "44", "deptNom": "Loire-Atlantique", "region": "Pays de la Loire", "notes_seed": null, "source": "google_places", "id": "l-art-au-gant-tattoo-piercing-shop-44000"}, {"name": "Casa de Leões", "address": "5 Rue la Pérouse, 44000 Nantes", "phone": "+33 2 28 44 57 61", "hours": "Lun-Sam 11h-19h15, Dim fermé", "rating": 4.8, "ville": "Nantes", "cp": "44000", "dept": "44", "deptNom": "Loire-Atlantique", "region": "Pays de la Loire", "notes_seed": null, "source": "google_places", "id": "casa-de-le-es-44000"}, {"name": "Nantes Studio 54", "address": "18 Rue de la Juiverie, 44000 Nantes", "phone": "+33 2 51 82 45 76", "hours": "Lun 14h-19h, Mar-Sam 11h-19h, Dim fermé", "rating": 4.5, "ville": "Nantes", "cp": "44000", "dept": "44", "deptNom": "Loire-Atlantique", "region": "Pays de la Loire", "notes_seed": null, "source": "google_places", "id": "nantes-studio-54-44000"}, {"name": "L'Atelier des Métamorphoses", "address": "18 Pass. d'Orléans, 44000 Nantes", "phone": "+33 2 51 72 18 52", "hours": "Sur rendez-vous", "rating": 5.0, "ville": "Nantes", "cp": "44000", "dept": "44", "deptNom": "Loire-Atlantique", "region": "Pays de la Loire", "notes_seed": null, "source": "google_places", "id": "l-atelier-des-m-tamorphoses-44000"}, {"name": "Le Spot - Tattoo Studio", "address": "6 Rue de la Juiverie, 44000 Nantes", "phone": "+33 2 40 84 39 66", "hours": "Lun 14h-19h, Mar 12h-19h, Mer 14h30-19h, Jeu-Sam 10h-19h, Dim fermé", "rating": 4.9, "ville": "Nantes", "cp": "44000", "dept": "44", "deptNom": "Loire-Atlantique", "region": "Pays de la Loire", "notes_seed": null, "source": "google_places", "id": "le-spot-tattoo-studio-44000"}, {"name": "Minuit Soleil", "address": "6bis Rue du Chapeau Rouge, 44000 Nantes", "phone": null, "hours": "Lun-Sam 11h-19h, Dim fermé", "rating": 5.0, "ville": "Nantes", "cp": "44000", "dept": "44", "deptNom": "Loire-Atlantique", "region": "Pays de la Loire", "notes_seed": null, "source": "google_places", "id": "minuit-soleil-44000"}, {"name": "Studio Fleur Bleue", "address": "14 Rue Paul Bellamy, 44000 Nantes", "phone": "+33 6 72 57 32 37", "hours": "Lun-Ven 10h-18h, Sam 10h-18h, Dim fermé", "rating": 5.0, "ville": "Nantes", "cp": "44000", "dept": "44", "deptNom": "Loire-Atlantique", "region": "Pays de la Loire", "notes_seed": null, "source": "google_places", "id": "studio-fleur-bleue-44000"}, {"name": "JessyInk Tattoo Strasbourg", "address": "17 Rue du Bain-aux-Plantes, 67000 Strasbourg", "phone": "+33 3 69 81 64 19", "hours": "Lun fermé, Mar-Sam 10h-18h, Dim fermé", "rating": 4.9, "ville": "Strasbourg", "cp": "67000", "dept": "67", "deptNom": "Bas-Rhin", "region": "Grand Est", "notes_seed": null, "source": "google_places", "id": "jessyink-tattoo-strasbourg-67000"}, {"name": "Two Aces Tattoo", "address": "15 Rue du Commandant Reibel, 67000 Strasbourg", "phone": "+33 9 77 82 46 52", "hours": "Lun fermé, Mar/Jeu/Ven 14h-19h, Mer 16h-19h, Sam 14h-18h, Dim fermé", "rating": 4.9, "ville": "Strasbourg", "cp": "67000", "dept": "67", "deptNom": "Bas-Rhin", "region": "Grand Est", "notes_seed": null, "source": "google_places", "id": "two-aces-tattoo-67000"}, {"name": "Cévelyne Tattoo", "address": "6 Rue Sainte-Madeleine, 67000 Strasbourg", "phone": null, "hours": "Sur rendez-vous", "rating": 4.9, "ville": "Strasbourg", "cp": "67000", "dept": "67", "deptNom": "Bas-Rhin", "region": "Grand Est", "notes_seed": null, "source": "google_places", "id": "c-velyne-tattoo-67000"}, {"name": "TINTA - Tattoo & Coiffeur-Barber Shop", "address": "21 Rue de la Krutenau, 67000 Strasbourg", "phone": "+33 9 86 42 74 74", "hours": "Lun fermé, Mar-Sam 10h-18h, Dim fermé", "rating": 4.9, "ville": "Strasbourg", "cp": "67000", "dept": "67", "deptNom": "Bas-Rhin", "region": "Grand Est", "notes_seed": null, "source": "google_places", "id": "tinta-tattoo-coiffeur-barber-shop-67000"}, {"name": "Underground Ink Family", "address": "12 Rue Sainte-Hélène, 67000 Strasbourg", "phone": "+33 3 88 22 34 89", "hours": "Lun 14h-18h, Mar-Sam 11h-18h, Dim fermé", "rating": 4.8, "ville": "Strasbourg", "cp": "67000", "dept": "67", "deptNom": "Bas-Rhin", "region": "Grand Est", "notes_seed": null, "source": "google_places", "id": "underground-ink-family-67000"}, {"name": "Nuevo Mundo - Tatouage Japonais Irezumi", "address": "11 Rue de la 1ère Armée, 67000 Strasbourg", "phone": "+33 6 38 19 19 86", "hours": "Sur rendez-vous", "rating": 4.9, "ville": "Strasbourg", "cp": "67000", "dept": "67", "deptNom": "Bas-Rhin", "region": "Grand Est", "notes_seed": null, "source": "google_places", "id": "nuevo-mundo-tatouage-japonais-irezumi-67000"}, {"name": "Oxy Studio - Piercing et Tatouage", "address": "1 Rue des Chandelles, 67000 Strasbourg", "phone": "+33 3 88 22 29 70", "hours": "Lun fermé, Mar-Ven 10h-17h30, Sam-Dim fermé", "rating": 4.5, "ville": "Strasbourg", "cp": "67000", "dept": "67", "deptNom": "Bas-Rhin", "region": "Grand Est", "notes_seed": null, "source": "google_places", "id": "oxy-studio-piercing-et-tatouage-67000"}, {"name": "GD Tattoo", "address": "24 Av. de Vitry-le-François, 67000 Strasbourg", "phone": "+33 7 60 66 60 60", "hours": "Lun-Dim 12h-18h", "rating": 5.0, "ville": "Strasbourg", "cp": "67000", "dept": "67", "deptNom": "Bas-Rhin", "region": "Grand Est", "notes_seed": null, "source": "google_places", "id": "gd-tattoo-67000"}, {"name": "The Bachelor - Tattoo Salon", "address": "18 Rue de Massingy, 06000 Nice", "phone": "+33 4 83 39 17 64", "hours": "Lun-Dim 9h30-19h (Lun/Dim 10h-19h)", "rating": 4.9, "ville": "Nice", "cp": "06000", "dept": "06", "deptNom": "Alpes-Maritimes", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "the-bachelor-tattoo-salon-06000"}, {"name": "Alex Anderson Ink Nice", "address": "2 Rue Pertinax, 06000 Nice", "phone": "+33 6 61 28 73 16", "hours": "Lun-Dim 9h-20h", "rating": 4.9, "ville": "Nice", "cp": "06000", "dept": "06", "deptNom": "Alpes-Maritimes", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "alex-anderson-ink-nice-06000"}, {"name": "AB Tattoo Nice - Salon de Tatouage", "address": "63 Rue Rossini, 06000 Nice", "phone": "+33 9 52 10 12 82", "hours": "Lun-Ven 8h30-19h (Jeu 9h), Sam 8h30-19h, Dim fermé", "rating": 5.0, "ville": "Nice", "cp": "06000", "dept": "06", "deptNom": "Alpes-Maritimes", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "ab-tattoo-nice-salon-de-tatouage-06000"}, {"name": "Frères d'Encre Nice", "address": "42 Rue Arson, 06300 Nice", "phone": "+33 4 93 31 68 50", "hours": "Lun-Sam 11h-19h, Dim fermé", "rating": 5.0, "ville": "Nice", "cp": "06300", "dept": "06", "deptNom": "Alpes-Maritimes", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "fr-res-d-encre-nice-06300"}, {"name": "Flagrant Delit Tattoo", "address": "8 Rue Auguste Gal, 06300 Nice", "phone": "+33 4 89 05 23 40", "hours": "Lun-Sam 10h-18h, Dim fermé", "rating": 5.0, "ville": "Nice", "cp": "06300", "dept": "06", "deptNom": "Alpes-Maritimes", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "flagrant-delit-tattoo-06300"}, {"name": "La Petite Garçonnière", "address": "4 Rue Barla, 06300 Nice", "phone": "+33 9 83 60 42 46", "hours": "Lun fermé, Mar-Sam 11h-19h, Dim fermé", "rating": 4.9, "ville": "Nice", "cp": "06300", "dept": "06", "deptNom": "Alpes-Maritimes", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "la-petite-gar-onni-re-06300"}, {"name": "Angel Tattoo & Piercing - Nice", "address": "20 Av. de la Californie, 06200 Nice", "phone": "+33 4 93 86 93 00", "hours": "Lun/Mer/Ven 10h-18h30, Mar 10h-18h, Jeu/Sam-Dim fermé", "rating": 4.7, "ville": "Nice", "cp": "06200", "dept": "06", "deptNom": "Alpes-Maritimes", "region": "Provence-Alpes-Côte d'Azur", "notes_seed": null, "source": "google_places", "id": "angel-tattoo-piercing-nice-06200"}, {"name": "Spirit Tattoo Rennes", "address": "65 Bd de la Tour d'Auvergne, 35000 Rennes", "phone": "+33 2 99 67 27 18", "hours": "Lun-Sam 10h-18h, Dim fermé", "rating": 4.9, "ville": "Rennes", "cp": "35000", "dept": "35", "deptNom": "Ille-et-Vilaine", "region": "Bretagne", "notes_seed": null, "source": "google_places", "id": "spirit-tattoo-rennes-35000"}, {"name": "Touche Perso", "address": "27 Rue Maréchal Joffre, 35000 Rennes", "phone": "+33 2 99 78 59 91", "hours": "Lun fermé, Mar-Ven 10h30-19h, Sam 10h30-18h, Dim fermé", "rating": 4.8, "ville": "Rennes", "cp": "35000", "dept": "35", "deptNom": "Ille-et-Vilaine", "region": "Bretagne", "notes_seed": null, "source": "google_places", "id": "touche-perso-35000"}, {"name": "Le Studio Tatouages", "address": "18 Rue d'Antrain, 35000 Rennes", "phone": "+33 2 99 63 35 73", "hours": "Lun fermé, Mar-Sam 11h15-18h30, Dim fermé", "rating": 4.6, "ville": "Rennes", "cp": "35000", "dept": "35", "deptNom": "Ille-et-Vilaine", "region": "Bretagne", "notes_seed": null, "source": "google_places", "id": "le-studio-tatouages-35000"}, {"name": "Inkognito Tattoo", "address": "3 Rue Victor Hugo, 35000 Rennes", "phone": "+33 6 58 81 15 51", "hours": "Lun fermé, Mar-Ven 11h-18h30, Sam 11h-19h, Dim fermé", "rating": 4.9, "ville": "Rennes", "cp": "35000", "dept": "35", "deptNom": "Ille-et-Vilaine", "region": "Bretagne", "notes_seed": null, "source": "google_places", "id": "inkognito-tattoo-35000"}, {"name": "Inkerman Tattoo Shop", "address": "61b Rue Saint-Hélier, 35000 Rennes", "phone": "+33 2 99 99 99 99", "hours": "Lun fermé, Mar-Ven 11h-19h, Sam 11h-18h, Dim fermé", "rating": 5.0, "ville": "Rennes", "cp": "35000", "dept": "35", "deptNom": "Ille-et-Vilaine", "region": "Bretagne", "notes_seed": null, "source": "google_places", "id": "inkerman-tattoo-shop-35000"}, {"name": "Kalil Tattoo Family - Tattoo and Piercing", "address": "1 Rue du Breil, 35000 Rennes", "phone": "+33 2 99 41 97 32", "hours": "Lun-Ven 9h30-18h, Sam-Dim fermé", "rating": 4.8, "ville": "Rennes", "cp": "35000", "dept": "35", "deptNom": "Ille-et-Vilaine", "region": "Bretagne", "notes_seed": null, "source": "google_places", "id": "kalil-tattoo-family-tattoo-and-piercing-35000"}, {"name": "Bisou Tattoo - Rennes", "address": "4 Rue du Lieutenant Colonel Dubois, 35000 Rennes", "phone": "+33 9 82 01 36 07", "hours": "Lun-Sam 10h-22h, Dim 13h-16h", "rating": 5.0, "ville": "Rennes", "cp": "35000", "dept": "35", "deptNom": "Ille-et-Vilaine", "region": "Bretagne", "notes_seed": null, "source": "google_places", "id": "bisou-tattoo-rennes-35000"}, {"name": "Excess Tattoo Piercing", "address": "12 Bd Victor Hugo, 34000 Montpellier", "phone": "+33 9 82 43 34 31", "hours": "Lun-Ven 10h30-19h, Sam 10h30-19h30, Dim fermé", "rating": 4.9, "ville": "Montpellier", "cp": "34000", "dept": "34", "deptNom": "Hérault", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "excess-tattoo-piercing-34000"}, {"name": "Hasta Siempre Tattoo Shop", "address": "5 Rue Anatole France, 34000 Montpellier", "phone": "+33 4 99 67 13 68", "hours": "Lun-Sam 10h-19h, Dim fermé", "rating": 4.8, "ville": "Montpellier", "cp": "34000", "dept": "34", "deptNom": "Hérault", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "hasta-siempre-tattoo-shop-34000"}, {"name": "MDS Tattoo Piercing", "address": "15 Rue des Trésoriers de la Bourse, 34000 Montpellier", "phone": "+33 4 67 66 87 55", "hours": "Lun-Mar fermé, Mer-Sam 11h-18h, Dim fermé", "rating": 4.8, "ville": "Montpellier", "cp": "34000", "dept": "34", "deptNom": "Hérault", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "mds-tattoo-piercing-34000"}, {"name": "Piercing Montpellier, Salon Tatouage - MaPetiteImprimerie", "address": "170 Rue Léon Blum, 34000 Montpellier", "phone": "+33 6 72 35 52 04", "hours": "Lun-Ven 10h-21h, Sam 12h-21h, Dim 14h-18h", "rating": 5.0, "ville": "Montpellier", "cp": "34000", "dept": "34", "deptNom": "Hérault", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "piercing-montpellier-salon-tatouage-mapetiteimprimerie-34000"}, {"name": "Timeless Tattoo Montpellier", "address": "19 Rue de l'Université, 34000 Montpellier", "phone": "+33 4 99 67 40 48", "hours": "Lun fermé, Mar-Sam 12h-18h30, Dim fermé", "rating": 4.8, "ville": "Montpellier", "cp": "34000", "dept": "34", "deptNom": "Hérault", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "timeless-tattoo-montpellier-34000"}, {"name": "L'Oeil du Tigre Tatouage", "address": "1 Rue de la Friperie, 34000 Montpellier", "phone": "+33 4 34 43 60 91", "hours": "Lun-Sam 11h-19h, Dim fermé", "rating": 4.9, "ville": "Montpellier", "cp": "34000", "dept": "34", "deptNom": "Hérault", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "l-oeil-du-tigre-tatouage-34000"}, {"name": "Amalgame Tattoo Shop", "address": "45 Rue Chaptal, 34000 Montpellier", "phone": "+33 4 49 07 92 67", "hours": "Lun fermé, Mar-Ven 11h-18h30, Sam 10h30-19h, Dim fermé", "rating": 4.9, "ville": "Montpellier", "cp": "34000", "dept": "34", "deptNom": "Hérault", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "amalgame-tattoo-shop-34000"}, {"name": "Lowbrow Tattoo", "address": "2 Rue Glaize, 34000 Montpellier", "phone": "+33 4 67 02 85 49", "hours": "Lun-Sam 11h-19h, Dim fermé", "rating": 4.8, "ville": "Montpellier", "cp": "34000", "dept": "34", "deptNom": "Hérault", "region": "Occitanie", "notes_seed": null, "source": "google_places", "id": "lowbrow-tattoo-34000"}]</script>
<script id="dept-data" type="application/json">[{"code": "01", "nom": "Ain", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "02", "nom": "Aisne", "region": "Hauts-de-France", "count": 0}, {"code": "03", "nom": "Allier", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "04", "nom": "Alpes-de-Haute-Provence", "region": "Provence-Alpes-Côte d'Azur", "count": 0}, {"code": "05", "nom": "Hautes-Alpes", "region": "Provence-Alpes-Côte d'Azur", "count": 0}, {"code": "06", "nom": "Alpes-Maritimes", "region": "Provence-Alpes-Côte d'Azur", "count": 7}, {"code": "07", "nom": "Ardèche", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "08", "nom": "Ardennes", "region": "Grand Est", "count": 0}, {"code": "09", "nom": "Ariège", "region": "Occitanie", "count": 0}, {"code": "10", "nom": "Aube", "region": "Grand Est", "count": 12}, {"code": "11", "nom": "Aude", "region": "Occitanie", "count": 0}, {"code": "12", "nom": "Aveyron", "region": "Occitanie", "count": 0}, {"code": "13", "nom": "Bouches-du-Rhône", "region": "Provence-Alpes-Côte d'Azur", "count": 8}, {"code": "14", "nom": "Calvados", "region": "Normandie", "count": 0}, {"code": "15", "nom": "Cantal", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "16", "nom": "Charente", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "17", "nom": "Charente-Maritime", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "18", "nom": "Cher", "region": "Centre-Val de Loire", "count": 0}, {"code": "19", "nom": "Corrèze", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "2A", "nom": "Corse-du-Sud", "region": "Corse", "count": 0}, {"code": "2B", "nom": "Haute-Corse", "region": "Corse", "count": 0}, {"code": "21", "nom": "Côte-d'Or", "region": "Bourgogne-Franche-Comté", "count": 0}, {"code": "22", "nom": "Côtes-d'Armor", "region": "Bretagne", "count": 0}, {"code": "23", "nom": "Creuse", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "24", "nom": "Dordogne", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "25", "nom": "Doubs", "region": "Bourgogne-Franche-Comté", "count": 0}, {"code": "26", "nom": "Drôme", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "27", "nom": "Eure", "region": "Normandie", "count": 0}, {"code": "28", "nom": "Eure-et-Loir", "region": "Centre-Val de Loire", "count": 0}, {"code": "29", "nom": "Finistère", "region": "Bretagne", "count": 0}, {"code": "30", "nom": "Gard", "region": "Occitanie", "count": 0}, {"code": "31", "nom": "Haute-Garonne", "region": "Occitanie", "count": 8}, {"code": "32", "nom": "Gers", "region": "Occitanie", "count": 0}, {"code": "33", "nom": "Gironde", "region": "Nouvelle-Aquitaine", "count": 8}, {"code": "34", "nom": "Hérault", "region": "Occitanie", "count": 8}, {"code": "35", "nom": "Ille-et-Vilaine", "region": "Bretagne", "count": 7}, {"code": "36", "nom": "Indre", "region": "Centre-Val de Loire", "count": 0}, {"code": "37", "nom": "Indre-et-Loire", "region": "Centre-Val de Loire", "count": 0}, {"code": "38", "nom": "Isère", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "39", "nom": "Jura", "region": "Bourgogne-Franche-Comté", "count": 0}, {"code": "40", "nom": "Landes", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "41", "nom": "Loir-et-Cher", "region": "Centre-Val de Loire", "count": 0}, {"code": "42", "nom": "Loire", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "43", "nom": "Haute-Loire", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "44", "nom": "Loire-Atlantique", "region": "Pays de la Loire", "count": 8}, {"code": "45", "nom": "Loiret", "region": "Centre-Val de Loire", "count": 0}, {"code": "46", "nom": "Lot", "region": "Occitanie", "count": 0}, {"code": "47", "nom": "Lot-et-Garonne", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "48", "nom": "Lozère", "region": "Occitanie", "count": 0}, {"code": "49", "nom": "Maine-et-Loire", "region": "Pays de la Loire", "count": 0}, {"code": "50", "nom": "Manche", "region": "Normandie", "count": 0}, {"code": "51", "nom": "Marne", "region": "Grand Est", "count": 0}, {"code": "52", "nom": "Haute-Marne", "region": "Grand Est", "count": 0}, {"code": "53", "nom": "Mayenne", "region": "Pays de la Loire", "count": 0}, {"code": "54", "nom": "Meurthe-et-Moselle", "region": "Grand Est", "count": 0}, {"code": "55", "nom": "Meuse", "region": "Grand Est", "count": 0}, {"code": "56", "nom": "Morbihan", "region": "Bretagne", "count": 0}, {"code": "57", "nom": "Moselle", "region": "Grand Est", "count": 0}, {"code": "58", "nom": "Nièvre", "region": "Bourgogne-Franche-Comté", "count": 0}, {"code": "59", "nom": "Nord", "region": "Hauts-de-France", "count": 8}, {"code": "60", "nom": "Oise", "region": "Hauts-de-France", "count": 0}, {"code": "61", "nom": "Orne", "region": "Normandie", "count": 0}, {"code": "62", "nom": "Pas-de-Calais", "region": "Hauts-de-France", "count": 0}, {"code": "63", "nom": "Puy-de-Dôme", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "64", "nom": "Pyrénées-Atlantiques", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "65", "nom": "Hautes-Pyrénées", "region": "Occitanie", "count": 0}, {"code": "66", "nom": "Pyrénées-Orientales", "region": "Occitanie", "count": 0}, {"code": "67", "nom": "Bas-Rhin", "region": "Grand Est", "count": 8}, {"code": "68", "nom": "Haut-Rhin", "region": "Grand Est", "count": 0}, {"code": "69", "nom": "Rhône", "region": "Auvergne-Rhône-Alpes", "count": 8}, {"code": "70", "nom": "Haute-Saône", "region": "Bourgogne-Franche-Comté", "count": 0}, {"code": "71", "nom": "Saône-et-Loire", "region": "Bourgogne-Franche-Comté", "count": 0}, {"code": "72", "nom": "Sarthe", "region": "Pays de la Loire", "count": 0}, {"code": "73", "nom": "Savoie", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "74", "nom": "Haute-Savoie", "region": "Auvergne-Rhône-Alpes", "count": 0}, {"code": "75", "nom": "Paris", "region": "Île-de-France", "count": 39}, {"code": "76", "nom": "Seine-Maritime", "region": "Normandie", "count": 0}, {"code": "77", "nom": "Seine-et-Marne", "region": "Île-de-France", "count": 6}, {"code": "78", "nom": "Yvelines", "region": "Île-de-France", "count": 4}, {"code": "79", "nom": "Deux-Sèvres", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "80", "nom": "Somme", "region": "Hauts-de-France", "count": 0}, {"code": "81", "nom": "Tarn", "region": "Occitanie", "count": 0}, {"code": "82", "nom": "Tarn-et-Garonne", "region": "Occitanie", "count": 0}, {"code": "83", "nom": "Var", "region": "Provence-Alpes-Côte d'Azur", "count": 0}, {"code": "84", "nom": "Vaucluse", "region": "Provence-Alpes-Côte d'Azur", "count": 0}, {"code": "85", "nom": "Vendée", "region": "Pays de la Loire", "count": 0}, {"code": "86", "nom": "Vienne", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "87", "nom": "Haute-Vienne", "region": "Nouvelle-Aquitaine", "count": 0}, {"code": "88", "nom": "Vosges", "region": "Grand Est", "count": 0}, {"code": "89", "nom": "Yonne", "region": "Bourgogne-Franche-Comté", "count": 0}, {"code": "90", "nom": "Territoire de Belfort", "region": "Bourgogne-Franche-Comté", "count": 0}, {"code": "91", "nom": "Essonne", "region": "Île-de-France", "count": 0}, {"code": "92", "nom": "Hauts-de-Seine", "region": "Île-de-France", "count": 18}, {"code": "93", "nom": "Seine-Saint-Denis", "region": "Île-de-France", "count": 4}, {"code": "94", "nom": "Val-de-Marne", "region": "Île-de-France", "count": 6}, {"code": "95", "nom": "Val-d'Oise", "region": "Île-de-France", "count": 1}, {"code": "971", "nom": "Guadeloupe", "region": "Guadeloupe", "count": 0}, {"code": "972", "nom": "Martinique", "region": "Martinique", "count": 0}, {"code": "973", "nom": "Guyane", "region": "Guyane", "count": 0}, {"code": "974", "nom": "La Réunion", "region": "La Réunion", "count": 0}, {"code": "975", "nom": "Saint-Pierre-et-Miquelon", "region": "Saint-Pierre-et-Miquelon", "count": 0}, {"code": "976", "nom": "Mayotte", "region": "Mayotte", "count": 0}]</script>
<script>
const PHARMACIES_SEED = JSON.parse(document.getElementById('pharmacy-data').textContent);
const DEPT_REFERENCE = JSON.parse(document.getElementById('dept-data').textContent);

const STATUS_LABELS = { a_contacter:"À contacter", contacte:"Contacté", interesse:"Intéressé", client:"Client", a_rappeler:"À rappeler", injoignable:"Injoignable", refuse:"Refusé" };
const STATUS_CLASS = { a_contacter:"st-a-contacter", contacte:"st-contacte", interesse:"st-interesse", client:"st-client", a_rappeler:"st-a-rappeler", injoignable:"st-injoignable", refuse:"st-refuse" };
const STATUS_DOT = { a_contacter:"var(--st-todo)", contacte:"var(--st-contacted)", interesse:"var(--st-interested)", client:"var(--st-client)", a_rappeler:"var(--st-callback)", injoignable:"var(--st-unreachable)", refuse:"var(--st-refused)" };

const GROUPS_PAGE_SIZE = 12;   // nb de groupes département affichés par défaut (vue large)
const CARDS_PAGE_SIZE = 24;    // nb de fiches affichées par groupe avant "afficher plus"

let pharmacies = [];
let extraPharmacies = [];
let trackingState = {};
let disabledDepts = new Set();
let disabledPharmacies = new Set();
let showDisabled = false;
let visibleGroupCount = GROUPS_PAGE_SIZE;
let cardsShownPerGroup = {};
let searchDebounceTimer = null;

function defaultTracking(seedNotes){
  const isPriority1 = seedNotes && seedNotes.toUpperCase().includes("PRIORITÉ 1");
  return {
    statut:"a_contacter",
    priorite: isPriority1 ? "haute" : "moyenne",
    contact:"", dernierContact:"", rappel:"",
    notes: seedNotes || "",
    updatedAt:null
  };
}

async function loadState(){
  try{ const r = await window.storage.get('tattoo-national-tracking'); if(r && r.value) trackingState = JSON.parse(r.value); }catch(e){ trackingState = {}; }
  try{ const r = await window.storage.get('tattoo-national-extra'); if(r && r.value) extraPharmacies = JSON.parse(r.value); }catch(e){ extraPharmacies = []; }
  try{ const r = await window.storage.get('tattoo-national-disabled-depts'); if(r && r.value) disabledDepts = new Set(JSON.parse(r.value)); }catch(e){ disabledDepts = new Set(); }
  try{ const r = await window.storage.get('tattoo-national-disabled-pharmacies'); if(r && r.value) disabledPharmacies = new Set(JSON.parse(r.value)); }catch(e){ disabledPharmacies = new Set(); }
}
async function saveTracking(){ try{ await window.storage.set('tattoo-national-tracking', JSON.stringify(trackingState)); }catch(e){ console.error(e); } }
async function saveExtra(){ try{ await window.storage.set('tattoo-national-extra', JSON.stringify(extraPharmacies)); }catch(e){ console.error(e); } }
async function saveDisabledDepts(){ try{ await window.storage.set('tattoo-national-disabled-depts', JSON.stringify([...disabledDepts])); }catch(e){ console.error(e); } }
async function saveDisabledPharmacies(){ try{ await window.storage.set('tattoo-national-disabled-pharmacies', JSON.stringify([...disabledPharmacies])); }catch(e){ console.error(e); } }

function getTracking(p){
  const id = typeof p === 'string' ? p : p.id;
  if(!trackingState[id]){
    const seed = (typeof p === 'object' && p.notes_seed) ? p.notes_seed : "";
    trackingState[id] = defaultTracking(seed);
  }
  return trackingState[id];
}
function buildWorkingList(){ pharmacies = extraPharmacies.length ? PHARMACIES_SEED.concat(extraPharmacies) : PHARMACIES_SEED; }
function isDisabled(p){ return disabledPharmacies.has(p.id) || disabledDepts.has(p.dept); }

const DEPT_MAP = {};
DEPT_REFERENCE.forEach(d => DEPT_MAP[d.code] = d);

function mapsUrl(p){ return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(p.name + ", " + p.address); }
function telHref(phone){ return "tel:" + phone.replace(/\\s/g,''); }
function escapeHtml(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function normalizeText(s){ return String(s||'').normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase(); }

/* ---------------- filter option population ---------------- */

function populateFilterOptions(){
  const regionSel = document.getElementById('filter-region');
  const regions = [...new Set(DEPT_REFERENCE.map(d=>d.region))].sort();
  regions.forEach(r=>{ const o=document.createElement('option'); o.value=r; o.textContent=r; regionSel.appendChild(o); });
  regionSel.addEventListener('change', ()=>{ resetPagination(); populateDeptOptions(); render(); });

  populateDeptOptions();
  document.getElementById('filter-dept').addEventListener('change', ()=>{ resetPagination(); render(); });
  document.getElementById('filter-status').addEventListener('change', ()=>{ resetPagination(); render(); });
  document.getElementById('filter-priority').addEventListener('change', ()=>{ resetPagination(); render(); });
  document.getElementById('sort-by').addEventListener('change', ()=>{ resetPagination(); render(); });
  document.getElementById('search').addEventListener('input', ()=>{
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(()=>{ resetPagination(); render(); }, 220);
  });
}

function populateDeptOptions(){
  const deptSel = document.getElementById('filter-dept');
  const regionFilter = document.getElementById('filter-region').value;
  const current = deptSel.value;
  deptSel.innerHTML = '<option value="all">Tous les départements</option>';
  let list = DEPT_REFERENCE.slice();
  if(regionFilter !== 'all') list = list.filter(d=>d.region===regionFilter);
  list.sort((a,b)=> a.code.localeCompare(b.code));
  list.forEach(d=>{
    const o = document.createElement('option');
    o.value = d.code; o.textContent = \`\${d.code} — \${d.nom} (\${d.count})\`;
    deptSel.appendChild(o);
  });
  if([...deptSel.options].some(o=>o.value===current)) deptSel.value = current;
}

function resetPagination(){ visibleGroupCount = GROUPS_PAGE_SIZE; cardsShownPerGroup = {}; }

/* ---------------- coverage strip ---------------- */

let activeDeptFilter = null;

function renderCoverageStrip(){
  const strip = document.getElementById('coverage-strip');
  strip.innerHTML = '';
  const sorted = DEPT_REFERENCE.slice().sort((a,b)=> a.code.localeCompare(b.code));
  sorted.forEach(d=>{
    const chip = document.createElement('div');
    let cls = 'dept-chip';
    if(d.count > 0) cls += ' has-data';
    if(document.getElementById('filter-dept').value === d.code) cls += ' active-filter';
    if(disabledDepts.has(d.code)) cls += ' dept-disabled';
    chip.className = cls;
    chip.textContent = d.code;
    chip.title = \`\${d.nom} (\${d.region}) — \${d.count} studio(s)\${disabledDepts.has(d.code) ? ' · DÉSACTIVÉ' : ''}\`;
    chip.addEventListener('click', ()=>{
      const deptSel = document.getElementById('filter-dept');
      const isActive = deptSel.value === d.code;
      deptSel.value = isActive ? 'all' : d.code;
      document.getElementById('filter-region').value = 'all';
      populateDeptOptions();
      if(!isActive) deptSel.value = d.code;
      resetPagination();
      render();
    });
    strip.appendChild(chip);
  });
}

/* ---------------- filtering / sorting ---------------- */

function matchesFilters(p, t){
  const searchVal = document.getElementById('search').value.trim().toLowerCase();
  const regionFilter = document.getElementById('filter-region').value;
  const deptFilter = document.getElementById('filter-dept').value;
  const statusFilter = document.getElementById('filter-status').value;
  const priorityFilter = document.getElementById('filter-priority').value;

  const disabled = isDisabled(p);
  if(showDisabled){ if(!disabled) return false; } else { if(disabled) return false; }

  if(searchVal){
    const hay = normalizeText(p.name+' '+p.address+' '+p.ville+' '+p.dept+' '+p.deptNom);
    if(!hay.includes(normalizeText(searchVal))) return false;
  }
  if(regionFilter !== 'all' && p.region !== regionFilter) return false;
  if(deptFilter !== 'all' && p.dept !== deptFilter) return false;
  if(statusFilter !== 'all' && t.statut !== statusFilter) return false;
  if(priorityFilter !== 'all' && t.priorite !== priorityFilter) return false;
  return true;
}

function sortList(list){
  const sortBy = document.getElementById('sort-by').value;
  const arr = list;
  if(sortBy === 'nom') arr.sort((a,b)=> a.p.name.localeCompare(b.p.name));
  else if(sortBy === 'note') arr.sort((a,b)=> (b.p.rating||0) - (a.p.rating||0));
  else if(sortBy === 'statut') arr.sort((a,b)=> a.t.statut.localeCompare(b.t.statut));
  else if(sortBy === 'rappel') arr.sort((a,b)=> (a.t.rappel||'9999').localeCompare(b.t.rappel||'9999'));
  else arr.sort((a,b)=> (a.p.dept+a.p.ville+a.p.name).localeCompare(b.p.dept+b.p.ville+b.p.name));
  return arr;
}

/* ---------------- rendering ---------------- */

function render(){
  buildWorkingList();
  renderCoverageStrip();

  const hasNarrowFilter = document.getElementById('search').value.trim().length >= 2
    || document.getElementById('filter-dept').value !== 'all'
    || document.getElementById('filter-region').value !== 'all';

  const entries = [];
  for(const p of pharmacies){
    const t = getTracking(p);
    if(matchesFilters(p, t)) entries.push({p, t});
  }
  sortList(entries);

  const main = document.getElementById('main');
  main.innerHTML = '';

  if(entries.length === 0){
    main.innerHTML = '<div class="empty"><b>Aucun studio ne correspond</b>Essayez d\\'élargir vos filtres ou d\\'ajouter un studio manuellement.</div>';
    updateStats();
    return;
  }

  const groups = {};
  const groupOrder = [];
  entries.forEach(e=>{
    const key = e.p.dept;
    if(!groups[key]){ groups[key] = []; groupOrder.push(key); }
    groups[key].push(e);
  });

  const sortBy = document.getElementById('sort-by').value;

  if(sortBy !== 'dept'){
    // flat list (no dept grouping) when sorting by something else — still paginate globally
    const shown = cardsShownPerGroup['__flat__'] || CARDS_PAGE_SIZE * 2;
    const grid = document.createElement('div');
    grid.className = 'grid';
    entries.slice(0, shown).forEach(e => grid.appendChild(renderCard(e.p, e.t)));
    main.appendChild(grid);
    if(entries.length > shown){
      const row = document.createElement('div');
      row.className = 'load-more-row';
      const remaining = entries.length - shown;
      row.innerHTML = \`<button>Afficher \${Math.min(remaining, CARDS_PAGE_SIZE*2)} de plus (\${remaining} restantes)</button>\`;
      row.querySelector('button').addEventListener('click', ()=>{
        cardsShownPerGroup['__flat__'] = shown + CARDS_PAGE_SIZE*2;
        render();
      });
      main.appendChild(row);
    }
    updateStats();
    return;
  }

  groupOrder.sort();
  const groupsToShow = hasNarrowFilter ? groupOrder : groupOrder.slice(0, visibleGroupCount);

  groupsToShow.forEach(dept=>{
    const list = groups[dept];
    const first = list[0].p;
    const section = document.createElement('div');
    section.className = 'dept-group' + (disabledDepts.has(dept) ? ' dept-is-disabled' : '');
    section.innerHTML = \`<div class="dept-header">
      <span class="dept-code-badge">\${dept}</span>
      <h2>\${escapeHtml(first.deptNom || 'Département '+dept)}</h2>
      <span class="region-tag">\${escapeHtml(first.region || '')}</span>
      <span class="dept-count">\${list.length} studio\${list.length>1?'s':''}</span>
    </div>\`;

    const grid = document.createElement('div');
    grid.className = 'grid';
    const shown = cardsShownPerGroup[dept] || CARDS_PAGE_SIZE;
    list.slice(0, shown).forEach(e => grid.appendChild(renderCard(e.p, e.t)));
    section.appendChild(grid);

    if(list.length > shown){
      const row = document.createElement('div');
      row.className = 'load-more-row';
      const remaining = list.length - shown;
      row.innerHTML = \`<button>Afficher \${Math.min(remaining, CARDS_PAGE_SIZE)} de plus (\${remaining} restantes dans ce département)</button>\`;
      row.querySelector('button').addEventListener('click', ()=>{
        cardsShownPerGroup[dept] = shown + CARDS_PAGE_SIZE;
        render();
      });
      section.appendChild(row);
    }

    main.appendChild(section);
  });

  if(!hasNarrowFilter && groupOrder.length > visibleGroupCount){
    const wrap = document.createElement('div');
    wrap.className = 'load-more-groups';
    const remainingGroups = groupOrder.length - visibleGroupCount;
    wrap.innerHTML = \`<p>\${remainingGroups} autre\${remainingGroups>1?'s':''} département\${remainingGroups>1?'s':''} disponible\${remainingGroups>1?'s':''} — affinez la recherche ou chargez la suite.</p><button>Afficher plus de départements</button>\`;
    wrap.querySelector('button').addEventListener('click', ()=>{
      visibleGroupCount += GROUPS_PAGE_SIZE;
      render();
    });
    main.appendChild(wrap);
  }

  updateStats();
}

function renderCard(p, t){
  const card = document.createElement('div');
  const disabledByDept = disabledDepts.has(p.dept);
  const disabledIndividually = disabledPharmacies.has(p.id);
  card.className = 'card' + ((disabledByDept || disabledIndividually) ? ' is-disabled' : '');

  const top = document.createElement('div');
  top.className = 'card-top';
  const nameBlock = document.createElement('div');
  nameBlock.innerHTML = \`<p class="card-name">\${escapeHtml(p.name)}</p><span class="card-ville">\${escapeHtml(p.ville)} · \${escapeHtml(p.dept)}</span>\`;
  top.appendChild(nameBlock);
  if(p.rating){
    const rc = document.createElement('span');
    rc.className = 'rating-chip';
    rc.textContent = '★ ' + Number(p.rating).toFixed(1);
    top.appendChild(rc);
  }
  card.appendChild(top);

  const addr = document.createElement('p');
  addr.className = 'card-addr';
  addr.textContent = p.address;
  card.appendChild(addr);

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  const phoneHtml = p.phone ? \`<a class="link" href="\${telHref(p.phone)}">\${escapeHtml(p.phone)}</a>\` : 'Non renseigné';
  const hoursHtml = p.hours ? escapeHtml(p.hours) : '<span class="no-hours">Horaires non disponibles</span>';
  meta.innerHTML = \`<div class="row"><span class="icon">📞</span>\${phoneHtml}</div><div class="row"><span class="icon">🕒</span>\${hoursHtml}</div>\`;
  card.appendChild(meta);

  const links = document.createElement('div');
  links.className = 'card-links';
  links.innerHTML = \`<a href="\${mapsUrl(p)}" target="_blank" rel="noopener">📍 Voir sur Maps</a>\`;
  card.appendChild(links);

  const statusSel = document.createElement('select');
  statusSel.className = 'status-select ' + STATUS_CLASS[t.statut];
  Object.keys(STATUS_LABELS).forEach(key=>{
    const o = document.createElement('option'); o.value=key; o.textContent=STATUS_LABELS[key];
    if(key===t.statut) o.selected = true;
    statusSel.appendChild(o);
  });
  statusSel.addEventListener('change', ()=>{
    t.statut = statusSel.value; t.updatedAt = new Date().toISOString();
    statusSel.className = 'status-select ' + STATUS_CLASS[t.statut];
    saveTracking(); updateStats();
    const pill = document.getElementById('stats-bar'); // stats already refreshed
  });
  card.appendChild(statusSel);

  const row1 = document.createElement('div');
  row1.className = 'field-row';
  row1.innerHTML = \`<div><span class="field-label">Priorité</span></div><div><span class="field-label">Interlocuteur</span></div>\`;
  const prioritySel = document.createElement('select');
  prioritySel.className = 'priority';
  [['haute','Haute'],['moyenne','Moyenne'],['basse','Basse']].forEach(([v,l])=>{
    const o=document.createElement('option'); o.value=v; o.textContent=l; if(v===t.priorite) o.selected=true; prioritySel.appendChild(o);
  });
  prioritySel.addEventListener('change', ()=>{ t.priorite = prioritySel.value; t.updatedAt=new Date().toISOString(); saveTracking(); });
  const contactInput = document.createElement('input');
  contactInput.type='text'; contactInput.placeholder='Nom'; contactInput.value = t.contact || '';
  contactInput.addEventListener('change', ()=>{ t.contact = contactInput.value; t.updatedAt=new Date().toISOString(); saveTracking(); });
  row1.children[0].appendChild(prioritySel);
  row1.children[1].appendChild(contactInput);
  card.appendChild(row1);

  const row2 = document.createElement('div');
  row2.className = 'field-row';
  row2.innerHTML = \`<div><span class="field-label">Dernier contact</span></div><div><span class="field-label">Rappel prévu</span></div>\`;
  const dateContact = document.createElement('input');
  dateContact.type='date'; dateContact.value = t.dernierContact || '';
  dateContact.addEventListener('change', ()=>{ t.dernierContact = dateContact.value; t.updatedAt=new Date().toISOString(); saveTracking(); });
  const dateRappel = document.createElement('input');
  dateRappel.type='date'; dateRappel.value = t.rappel || '';
  dateRappel.addEventListener('change', ()=>{ t.rappel = dateRappel.value; t.updatedAt=new Date().toISOString(); saveTracking(); });
  row2.children[0].appendChild(dateContact);
  row2.children[1].appendChild(dateRappel);
  card.appendChild(row2);

  const notes = document.createElement('textarea');
  notes.className = 'note-input';
  notes.placeholder = 'Notes (échantillons laissés, contact idéal, remarques...)';
  notes.value = t.notes || '';
  notes.addEventListener('input', ()=>{ t.notes = notes.value; t.updatedAt = new Date().toISOString(); });
  notes.addEventListener('blur', saveTracking);
  card.appendChild(notes);

  const footer = document.createElement('div');
  footer.className = 'card-footer';
  const updatedSpan = document.createElement('span');
  updatedSpan.className = 'updated-at';
  updatedSpan.textContent = t.updatedAt ? ('MAJ ' + new Date(t.updatedAt).toLocaleDateString('fr-FR')) : '';
  footer.appendChild(updatedSpan);

  const actionsWrap = document.createElement('div');
  actionsWrap.style.display = 'flex'; actionsWrap.style.gap = '8px'; actionsWrap.style.alignItems = 'center';

  if(!disabledByDept){
    const disableBtn = document.createElement('button');
    disableBtn.className = 'disable-toggle-btn' + (disabledIndividually ? ' is-reactivate' : '');
    disableBtn.textContent = disabledIndividually ? 'Réactiver' : 'Désactiver';
    disableBtn.addEventListener('click', ()=>{
      if(disabledIndividually) disabledPharmacies.delete(p.id); else disabledPharmacies.add(p.id);
      saveDisabledPharmacies(); render();
    });
    actionsWrap.appendChild(disableBtn);
  }
  if(p.isExtra){
    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn'; delBtn.textContent = 'Supprimer';
    delBtn.addEventListener('click', ()=>{
      if(confirm('Supprimer ce studio ajouté manuellement ?')){
        extraPharmacies = extraPharmacies.filter(x => x.id !== p.id);
        delete trackingState[p.id]; disabledPharmacies.delete(p.id);
        saveExtra(); saveTracking(); saveDisabledPharmacies(); render();
      }
    });
    actionsWrap.appendChild(delBtn);
  }
  footer.appendChild(actionsWrap);
  card.appendChild(footer);

  return card;
}

function updateStats(){
  buildWorkingList();
  let total = 0, done = 0, interested = 0, disabledCount = 0;
  const statusCounts = {}; Object.keys(STATUS_LABELS).forEach(k=>statusCounts[k]=0);
  const deptsWithData = new Set();
  for(const p of pharmacies){
    if(isDisabled(p)){ disabledCount++; continue; }
    total++;
    deptsWithData.add(p.dept);
    const t = getTracking(p);
    statusCounts[t.statut] = (statusCounts[t.statut]||0) + 1;
    if(t.statut !== 'a_contacter') done++;
    if(t.statut === 'interesse' || t.statut === 'client') interested++;
  }
  document.getElementById('stat-total').textContent = total.toLocaleString('fr-FR');
  document.getElementById('stat-depts').textContent = deptsWithData.size;
  document.getElementById('stat-done').textContent = done.toLocaleString('fr-FR');
  document.getElementById('stat-interested').textContent = interested.toLocaleString('fr-FR');
  document.getElementById('progress-bar').style.width = total ? Math.round((done/total)*100)+'%' : '0%';

  const bar = document.getElementById('stats-bar');
  bar.innerHTML = '';
  Object.keys(STATUS_LABELS).forEach(key=>{
    const pill = document.createElement('div');
    pill.className = 'stat-pill';
    pill.innerHTML = \`<span class="stat-dot" style="background:\${STATUS_DOT[key]}"></span>\${STATUS_LABELS[key]} <b>\${statusCounts[key].toLocaleString('fr-FR')}</b>\`;
    bar.appendChild(pill);
  });
  if(disabledCount > 0){
    const pill = document.createElement('div');
    pill.className = 'stat-pill';
    pill.innerHTML = \`<span class="stat-dot" style="background:var(--ink-faint)"></span>Désactivées <b>\${disabledCount.toLocaleString('fr-FR')}</b>\`;
    bar.appendChild(pill);
  }
}

/* ---------------- CSV export / import ---------------- */

function csvEscape(field){ const s = String(field ?? ''); if(/[",\\n]/.test(s)) return '"' + s.replace(/"/g,'""') + '"'; return s; }

function exportCSV(){
  buildWorkingList();
  const rows = [['Nom','Adresse','Ville','Departement','NomDepartement','Region','Telephone','Horaires','NoteGoogle','Statut','Priorite','Interlocuteur','DernierContact','Rappel','Notes']];
  pharmacies.forEach(p=>{
    const t = getTracking(p);
    rows.push([p.name, p.address, p.ville, p.dept, p.deptNom, p.region, p.phone||'', p.hours||'', p.rating||'', STATUS_LABELS[t.statut], t.priorite, t.contact||'', t.dernierContact||'', t.rappel||'', t.notes||'']);
  });
  const csv = rows.map(r => r.map(csvEscape).join(',')).join('\\n');
  const blob = new Blob(['\\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'prospection_tatoueurs_france.csv'; a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text){
  const rows = []; let row = [], field = '', inQuotes = false;
  for(let i=0;i<text.length;i++){
    const c = text[i], next = text[i+1];
    if(inQuotes){
      if(c === '"' && next === '"'){ field += '"'; i++; }
      else if(c === '"'){ inQuotes = false; }
      else field += c;
    } else {
      if(c === '"') inQuotes = true;
      else if(c === ','){ row.push(field); field=''; }
      else if(c === '\\n'){ row.push(field); rows.push(row); row=[]; field=''; }
      else if(c === '\\r'){ }
      else field += c;
    }
  }
  if(field.length || row.length){ row.push(field); rows.push(row); }
  return rows.filter(r => r.length && r.some(f=>f.trim()!==''));
}

function deptFromAddress(addr){
  const m = addr.match(/(\\d{5})/);
  if(!m) return '';
  const cp = m[1];
  if(cp.startsWith('20')) return (parseInt(cp.slice(0,3)) <= 201) ? '2A' : '2B';
  if(['971','972','973','974','975','976'].includes(cp.slice(0,3))) return cp.slice(0,3);
  return cp.slice(0,2);
}

function villeFromAddress(addr){
  // essaie d'extraire la ville après le code postal (ex: "12 Rue X, 21000 Dijon" -> "Dijon")
  const m = addr.match(/\\d{5}\\s+([A-Za-zÀ-ÿ'\\-\\s]+)$/);
  return m ? m[1].trim() : '';
}

function importCSV(file){
  const reader = new FileReader();
  reader.onload = async (e) => {
    const rows = parseCSV(e.target.result);
    if(rows.length < 2){ alert('Fichier CSV vide ou invalide.'); return; }
    const header = rows[0].map(h=>h.trim().toLowerCase());
    const idx = (name) => header.indexOf(name);
    const iNom = idx('nom'), iAdr = idx('adresse'), iVille = idx('ville'), iTel = idx('telephone'), iHoraires = idx('horaires');
    if(iNom === -1 || iAdr === -1){ alert('Colonnes minimales requises: Nom, Adresse.'); return; }
    let added = 0;
    rows.slice(1).forEach(r=>{
      const name = r[iNom]; const address = r[iAdr];
      if(!name || !address) return;
      const dept = deptFromAddress(address);
      const deptInfo = DEPT_MAP[dept] || {nom:'Inconnu', region:'Inconnu'};
      const id = 'extra-' + (name+address).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') + '-' + Date.now() + '-' + added;
      extraPharmacies.push({ id, name, address, ville: (iVille!==-1 ? (r[iVille]||'') : '') || villeFromAddress(address), phone: iTel!==-1 ? (r[iTel]||'') : '', hours: iHoraires!==-1 ? (r[iHoraires]||'') : '', rating: null, dept, deptNom: deptInfo.nom, region: deptInfo.region, isExtra: true });
      added++;
    });
    await saveExtra(); resetPagination(); render();
    alert(added + ' studio(s) importé(s).');
  };
  reader.readAsText(file, 'UTF-8');
}

/* ---------------- add studio modal ---------------- */

function openModal(){ document.getElementById('modal-overlay').classList.add('open'); }
function closeModal(){ document.getElementById('modal-overlay').classList.remove('open'); ['new-name','new-address','new-ville','new-phone','new-hours'].forEach(id => document.getElementById(id).value = ''); }

async function confirmAdd(){
  const name = document.getElementById('new-name').value.trim();
  const address = document.getElementById('new-address').value.trim();
  const ville = document.getElementById('new-ville').value.trim();
  const phone = document.getElementById('new-phone').value.trim();
  const hours = document.getElementById('new-hours').value.trim();
  if(!name || !address){ alert('Le nom et l\\'adresse sont requis.'); return; }
  const dept = deptFromAddress(address);
  const deptInfo = DEPT_MAP[dept] || {nom:'Département inconnu', region:'Région inconnue'};
  const id = 'extra-' + (name+address).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'') + '-' + Date.now();
  extraPharmacies.push({ id, name, address, ville: ville || villeFromAddress(address), phone, hours, rating: null, dept, deptNom: deptInfo.nom, region: deptInfo.region, isExtra: true });
  await saveExtra(); closeModal();
  // affiche immédiatement la fiche ajoutée pour confirmation visuelle
  document.getElementById('filter-dept').value = 'all';
  document.getElementById('filter-region').value = 'all';
  document.getElementById('filter-status').value = 'all';
  document.getElementById('filter-priority').value = 'all';
  document.getElementById('search').value = name;
  resetPagination(); render();
}

/* ---------------- manage departments modal ---------------- */

function openDeptModal(){ document.getElementById('dept-modal-overlay').classList.add('open'); document.getElementById('dept-modal-search').value=''; renderDeptModalList(''); }
function closeDeptModal(){ document.getElementById('dept-modal-overlay').classList.remove('open'); }

function renderDeptModalList(searchTerm){
  const list = document.getElementById('dept-modal-list');
  list.innerHTML = '';
  const term = (searchTerm||'').trim().toLowerCase();
  const filtered = DEPT_REFERENCE.filter(d=> !term || (d.code+' '+d.nom+' '+d.region).toLowerCase().includes(term))
    .sort((a,b)=> (a.region+a.code).localeCompare(b.region+b.code));
  let lastRegion = null;
  filtered.forEach(d=>{
    if(d.region !== lastRegion){
      const h = document.createElement('div'); h.className='dept-modal-region'; h.textContent=d.region; list.appendChild(h);
      lastRegion = d.region;
    }
    const row = document.createElement('div'); row.className='dept-modal-row';
    const isOn = !disabledDepts.has(d.code);
    row.innerHTML = \`<span class="code">\${d.code}</span><span class="name">\${escapeHtml(d.nom)}</span><span class="count">\${d.count.toLocaleString('fr-FR')}</span>
      <label class="switch"><input type="checkbox" \${isOn?'checked':''} data-dept="\${d.code}"><span class="slider"></span></label>\`;
    row.querySelector('input').addEventListener('change', (e)=>{
      if(e.target.checked) disabledDepts.delete(d.code); else disabledDepts.add(d.code);
      saveDisabledDepts(); render();
    });
    list.appendChild(row);
  });
}

document.getElementById('manage-depts-btn').addEventListener('click', openDeptModal);
document.getElementById('dept-modal-close').addEventListener('click', closeDeptModal);
document.getElementById('dept-modal-overlay').addEventListener('click', (e)=>{ if(e.target.id==='dept-modal-overlay') closeDeptModal(); });
document.getElementById('dept-modal-search').addEventListener('input', (e)=> renderDeptModalList(e.target.value));
document.getElementById('show-disabled-toggle').addEventListener('change', (e)=>{ showDisabled = e.target.checked; resetPagination(); render(); });

/* ---------------- init ---------------- */

document.getElementById('export-btn').addEventListener('click', exportCSV);
document.getElementById('import-btn').addEventListener('click', ()=> document.getElementById('import-file').click());
document.getElementById('import-file').addEventListener('change', (e)=>{ if(e.target.files[0]) importCSV(e.target.files[0]); e.target.value=''; });
document.getElementById('reset-btn').addEventListener('click', async ()=>{
  if(confirm('Réinitialiser tout le suivi (statuts, notes, priorités) ? Les studios ajoutés manuellement seront conservés.')){
    trackingState = {}; await saveTracking(); render();
  }
});
document.getElementById('add-fab').addEventListener('click', openModal);
document.getElementById('cancel-add').addEventListener('click', closeModal);
document.getElementById('confirm-add').addEventListener('click', confirmAdd);
document.getElementById('modal-overlay').addEventListener('click', (e)=>{ if(e.target.id==='modal-overlay') closeModal(); });

(async function init(){
  await loadState();
  populateFilterOptions();
  render();
})();
</script>
</body>
</html>
`

export default function TatoueurModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 font-black text-sm uppercase transition-all rounded-2xl py-3.5 px-4"
        style={{
          background: "linear-gradient(135deg, #f97316, #ea580c)",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(249,115,22,0.40)",
          border: "none",
          letterSpacing: "0.12em",
          fontSize: "13px",
        }}>
        🪡 Tatoueurs
      </button>

      {open && (
        <div className="fixed inset-0 z-[300] flex flex-col">
          <div
            className="flex items-center justify-between px-5 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg, #f97316, #ea580c)" }}>
            <span className="text-white font-black text-base tracking-widest uppercase">
              🪡 Démarchage Tatoueurs
            </span>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              <X size={15} /> Fermer
            </button>
          </div>
          <iframe
            srcDoc={TATOUEURS_HTML}
            className="flex-1 border-0 w-full"
            title="Démarchage Tatoueurs"
          />
        </div>
      )}
    </>
  )
}
