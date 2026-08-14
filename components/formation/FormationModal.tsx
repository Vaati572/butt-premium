"use client"

import { useState } from "react"
import { X } from "lucide-react"

const FORMATION_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Éclats et Strass — Plan Shopify & SEO</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0D0D14;
  --surface:#141420;
  --surface2:#1A1A2C;
  --border:#252538;
  --border2:#2E2E48;
  --text:#E8E6F0;
  --muted:#7B7998;
  --faint:#44435A;
  --violet:#8B5CF6;
  --violet-soft:rgba(139,92,246,0.12);
  --violet-border:rgba(139,92,246,0.30);
  --gold:#D4A853;
  --gold-soft:rgba(212,168,83,0.10);
  --gold-border:rgba(212,168,83,0.28);
  --green:#34D399;
  --green-soft:rgba(52,211,153,0.08);
  --green-border:rgba(52,211,153,0.25);
  --red:#F87171;
  --red-soft:rgba(248,113,113,0.08);
  --blue:#60A5FA;
  --blue-soft:rgba(96,165,250,0.08);
  --radius:14px;
  --sidebar:260px;
}
html{scroll-behavior:smooth;height:100%}
body{background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.6;display:flex;min-height:100vh}

/* ── SIDEBAR ── */
.sidebar{
  width:var(--sidebar);flex-shrink:0;position:fixed;top:0;left:0;height:100vh;
  background:var(--surface);border-right:1px solid var(--border);
  display:flex;flex-direction:column;overflow:hidden;z-index:100
}
.sidebar-logo{
  padding:20px 16px 16px;border-bottom:1px solid var(--border)
}
.logo-gem{width:36px;height:36px;background:linear-gradient(135deg,var(--violet),#A855F7);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:10px}
.logo-title{font-weight:800;font-size:13px;color:var(--text);letter-spacing:.02em}
.logo-sub{font-size:11px;color:var(--muted);margin-top:1px}
.progress-ring{padding:14px 16px;border-bottom:1px solid var(--border)}
.progress-label{display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:8px}
.progress-label span:last-child{color:var(--violet);font-weight:700}
.progress-track{height:4px;background:var(--border2);border-radius:99px;overflow:hidden}
.progress-fill{height:100%;background:linear-gradient(90deg,var(--violet),#A855F7);border-radius:99px;transition:width .4s ease}
.nav{flex:1;overflow-y:auto;padding:12px 0}
.nav::-webkit-scrollbar{width:4px}
.nav::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px}
.nav-section{padding:16px 16px 4px;font-size:10px;font-weight:700;color:var(--faint);text-transform:uppercase;letter-spacing:.1em}
.nav-item{
  display:flex;align-items:center;gap:10px;padding:8px 16px;cursor:pointer;
  border-radius:0;transition:background .15s;text-decoration:none;color:var(--muted);font-size:13px;font-weight:500;
  border-left:2px solid transparent;position:relative
}
.nav-item:hover{background:var(--surface2);color:var(--text)}
.nav-item.active{color:var(--violet);background:var(--violet-soft);border-left-color:var(--violet)}
.nav-item .nav-icon{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;background:var(--border)}
.nav-item.active .nav-icon{background:var(--violet-soft)}
.nav-check{margin-left:auto;width:18px;height:18px;border-radius:5px;border:1.5px solid var(--faint);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px}
.nav-check.done{background:var(--green);border-color:var(--green);color:#000}
.sidebar-footer{padding:14px 16px;border-top:1px solid var(--border)}
.reset-btn{width:100%;background:var(--red-soft);border:1px solid rgba(248,113,113,0.2);color:var(--red);font-size:12px;font-weight:600;padding:8px;border-radius:10px;cursor:pointer}
.reset-btn:hover{background:rgba(248,113,113,0.15)}

/* ── MAIN ── */
.main{margin-left:var(--sidebar);flex:1;min-height:100vh;display:flex;flex-direction:column}
.content{flex:1;padding:32px 40px;max-width:900px}

/* HERO */
.hero{background:linear-gradient(135deg,#18162E 0%,#1E1A35 60%,#0D0D14 100%);border:1px solid var(--border);border-radius:20px;padding:36px 40px;margin-bottom:32px;position:relative;overflow:hidden}
.hero::before{content:'💎';position:absolute;right:32px;top:24px;font-size:72px;opacity:.12;line-height:1}
.hero-tag{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;font-family:'JetBrains Mono',monospace;background:var(--gold-soft);border:1px solid var(--gold-border);padding:4px 10px;border-radius:99px;margin-bottom:16px}
.hero h1{font-size:26px;font-weight:800;color:#fff;line-height:1.2;margin-bottom:10px}
.hero-sub{color:#9490B8;font-size:14px;max-width:55ch;margin-bottom:20px}
.hero-badges{display:flex;flex-wrap:wrap;gap:8px}
.hero-badge{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#C8C4E0;font-size:11px;font-weight:500;padding:5px 12px;border-radius:99px;font-family:'JetBrains Mono',monospace}

/* SECTION */
.section-page{display:none}
.section-page.active{display:block;animation:fadeIn .2s ease}
@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.section-header{display:flex;align-items:flex-start;gap:16px;margin-bottom:28px}
.section-num{font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:var(--gold);background:var(--gold-soft);border:1px solid var(--gold-border);padding:3px 10px;border-radius:99px}
.section-title{font-size:22px;font-weight:800;color:var(--text);line-height:1.2}
.section-intro{color:var(--muted);font-size:14px;line-height:1.7;max-width:70ch;margin-bottom:28px;padding:16px;background:var(--surface2);border:1px solid var(--border);border-radius:12px;border-left:3px solid var(--violet)}

/* CARDS */
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-bottom:20px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;transition:border-color .15s}
.card:hover{border-color:var(--border2)}
.card h3{font-size:14px;font-weight:700;color:var(--text);margin-bottom:12px;display:flex;align-items:center;gap:8px}
.card-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}

/* CHECKLIST */
.checklist{display:flex;flex-direction:column;gap:6px;margin-bottom:24px}
.check-row{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:11px;cursor:pointer;transition:all .15s;-webkit-user-select:none;user-select:none}
.check-row:hover{border-color:var(--border2);background:var(--surface2)}
.check-row.checked{opacity:.6;border-color:var(--green-border);background:var(--green-soft)}
.check-row.checked .check-box{background:var(--green);border-color:var(--green)}
.check-row.checked .check-text{text-decoration:line-through;color:var(--muted)}
.check-box{width:20px;height:20px;border-radius:6px;border:1.5px solid var(--faint);flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px;font-size:11px;color:#000;transition:all .15s}
.check-text{font-size:13.5px;color:var(--text);line-height:1.5}

/* PHASES */
.phases{display:flex;flex-direction:column;gap:8px}
.phase{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);overflow:hidden}
.phase-header{display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;transition:background .15s}
.phase-header:hover{background:var(--surface2)}
.phase-num{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;color:var(--violet);background:var(--violet-soft);border:1px solid var(--violet-border);padding:3px 8px;border-radius:99px;flex-shrink:0}
.phase-title{font-size:14px;font-weight:700;color:var(--text);flex:1}
.phase-count{font-size:11px;color:var(--muted);flex-shrink:0}
.phase-chevron{color:var(--faint);flex-shrink:0;font-size:12px;transition:transform .2s}
.phase.open .phase-chevron{transform:rotate(90deg)}
.phase-body{display:none;border-top:1px solid var(--border);padding:4px 0}
.phase.open .phase-body{display:block}

/* TABLE */
.data-table{width:100%;border-collapse:collapse;margin-bottom:24px}
.data-table th{text-align:left;font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface)}
.data-table td{padding:11px 14px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text);vertical-align:top}
.data-table tr:last-child td{border-bottom:none}
.data-table tr:hover td{background:var(--surface2)}
.priority-badge{display:inline-flex;padding:2px 8px;border-radius:99px;font-size:11px;font-weight:700}
.priority-haute{background:rgba(139,92,246,0.15);color:var(--violet)}
.priority-moyenne{background:rgba(212,168,83,0.12);color:var(--gold)}
.intent-badge{font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace}

/* CODE */
.code-block{background:#0A0A12;border:1px solid var(--border);border-radius:12px;padding:18px 20px;margin:16px 0;overflow-x:auto}
.code-block pre{font-family:'JetBrains Mono',monospace;font-size:12px;color:#C8C4E0;white-space:pre;line-height:1.7}

/* SITE TREE */
.tree{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;margin-bottom:20px}
.tree-item{display:flex;align-items:baseline;gap:8px;padding:6px 0;color:var(--text);font-size:13px}
.tree-item .tree-url{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--violet);flex-shrink:0}
.tree-item.level-1{padding-left:0;font-weight:600}
.tree-item.level-2{padding-left:24px;color:var(--muted)}
.tree-item.level-2::before{content:'└─ ';color:var(--faint)}

/* ALERT */
.alert{padding:14px 18px;border-radius:12px;margin-bottom:20px;font-size:13px;line-height:1.6;border:1px solid}
.alert-gold{background:var(--gold-soft);border-color:var(--gold-border);color:#D4A853}
.alert-violet{background:var(--violet-soft);border-color:var(--violet-border);color:#A78BFA}
.alert-red{background:var(--red-soft);border-color:rgba(248,113,113,0.2);color:var(--red)}

/* TAGS DESIGN */
.tag-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
.tag{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:99px;font-size:12px;font-weight:600;border:1px solid}
.tag-violet{background:var(--violet-soft);border-color:var(--violet-border);color:#C4B5FD}
.tag-gold{background:var(--gold-soft);border-color:var(--gold-border);color:var(--gold)}
.tag-green{background:var(--green-soft);border-color:var(--green-border);color:var(--green)}
.tag-blue{background:var(--blue-soft);border-color:rgba(96,165,250,.25);color:var(--blue)}

/* Scroll top btn */
#scroll-top{position:fixed;bottom:24px;right:24px;width:40px;height:40px;background:var(--violet);border-radius:50%;display:none;align-items:center;justify-content:center;cursor:pointer;font-size:16px;color:#fff;box-shadow:0 4px 16px rgba(139,92,246,.4);z-index:200;border:none}
#scroll-top.show{display:flex}

/* Responsive */
@media(max-width:700px){
  :root{--sidebar:0px}
  .sidebar{display:none}
  .main{margin-left:0}
  .content{padding:20px}
  .hero{padding:24px}
}
</style>
</head>
<body>

<!-- ══ SIDEBAR ══ -->
<aside class="sidebar">
  <div class="sidebar-logo">
    <div class="logo-gem">💎</div>
    <div class="logo-title">Éclats et Strass</div>
    <div class="logo-sub">Plan Shopify & SEO</div>
  </div>
  <div class="progress-ring">
    <div class="progress-label"><span>Progression</span><span id="progress-pct">0%</span></div>
    <div class="progress-track"><div class="progress-fill" id="progress-fill" style="width:0%"></div></div>
  </div>
  <nav class="nav" id="nav">
    <div class="nav-section">Vue d'ensemble</div>
    <a class="nav-item active" data-page="home" onclick="showPage('home',this)">
      <span class="nav-icon">🏠</span>Accueil
    </a>
    <div class="nav-section">Plan d'action</div>
    <a class="nav-item" data-page="roadmap" onclick="showPage('roadmap',this)">
      <span class="nav-icon">🗺️</span>Feuille de route<span class="nav-check" id="nc-roadmap"></span>
    </a>
    <a class="nav-item" data-page="arborescence" onclick="showPage('arborescence',this)">
      <span class="nav-icon">🌲</span>Arborescence
    </a>
    <a class="nav-item" data-page="design" onclick="showPage('design',this)">
      <span class="nav-icon">🎨</span>Design<span class="nav-check" id="nc-design"></span>
    </a>
    <div class="nav-section">SEO & Technique</div>
    <a class="nav-item" data-page="seo-onpage" onclick="showPage('seo-onpage',this)">
      <span class="nav-icon">📄</span>SEO on-page<span class="nav-check" id="nc-seo-onpage"></span>
    </a>
    <a class="nav-item" data-page="mots-cles" onclick="showPage('mots-cles',this)">
      <span class="nav-icon">🔑</span>Mots-clés
    </a>
    <a class="nav-item" data-page="seo-technique" onclick="showPage('seo-technique',this)">
      <span class="nav-icon">⚙️</span>SEO technique<span class="nav-check" id="nc-seo-technique"></span>
    </a>
    <a class="nav-item" data-page="schema" onclick="showPage('schema',this)">
      <span class="nav-icon">🧩</span>Schema markup
    </a>
    <a class="nav-item" data-page="shopify" onclick="showPage('shopify',this)">
      <span class="nav-icon">🛍️</span>Shopify avancé<span class="nav-check" id="nc-shopify"></span>
    </a>
    <div class="nav-section">Contenu & Business</div>
    <a class="nav-item" data-page="contenu" onclick="showPage('contenu',this)">
      <span class="nav-icon">✍️</span>Contenu & Blog
    </a>
    <a class="nav-item" data-page="conversion" onclick="showPage('conversion',this)">
      <span class="nav-icon">💰</span>Conversion<span class="nav-check" id="nc-conversion"></span>
    </a>
    <a class="nav-item" data-page="legal" onclick="showPage('legal',this)">
      <span class="nav-icon">⚖️</span>Légal & RGPD<span class="nav-check" id="nc-legal"></span>
    </a>
    <a class="nav-item" data-page="tracking" onclick="showPage('tracking',this)">
      <span class="nav-icon">📊</span>Tracking<span class="nav-check" id="nc-tracking"></span>
    </a>
    <div class="nav-section">Lancement</div>
    <a class="nav-item" data-page="checklist" onclick="showPage('checklist',this)">
      <span class="nav-icon">✅</span>Checklist finale<span class="nav-check" id="nc-checklist"></span>
    </a>
  </nav>
  <div class="sidebar-footer">
    <button class="reset-btn" onclick="resetAll()">🔄 Réinitialiser la progression</button>
  </div>
</aside>

<!-- ══ MAIN ══ -->
<main class="main">
<div class="content">

<!-- HOME -->
<section class="section-page active" id="page-home">
  <div class="hero">
    <div class="hero-tag">✦ Formation complète</div>
    <h1>Éclats et Strass<br>Plan Shopify & SEO</h1>
    <p class="hero-sub">Un plan complet pour lancer et optimiser votre boutique de formations en strass dentaire et blanchiment. Naviguez par section, cochez au fur et à mesure.</p>
    <div class="hero-badges">
      <span class="hero-badge">14 formations</span>
      <span class="hero-badge">10 phases</span>
      <span class="hero-badge">Dawn theme</span>
      <span class="hero-badge">10 mots-clés</span>
    </div>
  </div>

  <div class="card-grid">
    <div class="card" onclick="showPage('roadmap',document.querySelector('[data-page=roadmap]'))" style="cursor:pointer;border-left:3px solid var(--violet)">
      <h3><span class="card-icon" style="background:var(--violet-soft)">🗺️</span>Feuille de route</h3>
      <p style="color:var(--muted);font-size:13px">25 actions organisées en 10 phases. L'ordre compte : chaque étape s'appuie sur la précédente.</p>
    </div>
    <div class="card" onclick="showPage('seo-onpage',document.querySelector('[data-page=seo-onpage]'))" style="cursor:pointer;border-left:3px solid var(--gold)">
      <h3><span class="card-icon" style="background:var(--gold-soft)">📄</span>SEO on-page</h3>
      <p style="color:var(--muted);font-size:13px">31 éléments à optimiser page par page : titles, H1, metas, sections, FAQ.</p>
    </div>
    <div class="card" onclick="showPage('checklist',document.querySelector('[data-page=checklist]'))" style="cursor:pointer;border-left:3px solid var(--green)">
      <h3><span class="card-icon" style="background:var(--green-soft)">✅</span>Checklist finale</h3>
      <p style="color:var(--muted);font-size:13px">20 points à valider avant le lancement. La liste qui évite les oublis au dernier moment.</p>
    </div>
    <div class="card" onclick="showPage('legal',document.querySelector('[data-page=legal]'))" style="cursor:pointer;border-left:3px solid var(--red)">
      <h3><span class="card-icon" style="background:var(--red-soft)">⚖️</span>Légal & RGPD</h3>
      <p style="color:var(--muted);font-size:13px">9 obligations légales France à respecter pour un lancement conforme.</p>
    </div>
  </div>

  <div class="alert alert-gold">
    <strong>💡 Produits à créer :</strong> Formation Strass Dentaire · Formation Blanchiment Dentaire · Pack Duo + Matériel · Pack Duo sans Matériel — et un Pack Abonnement mensuel en option.
  </div>
</section>

<!-- FEUILLE DE ROUTE -->
<section class="section-page" id="page-roadmap">
  <div class="section-header">
    <div><span class="section-num">01 — Plan d'action</span><div class="section-title">Feuille de route en 10 phases</div></div>
  </div>
  <p class="section-intro">L'ordre compte : chaque phase s'appuie sur la précédente. Cochez au fur et à mesure — votre progression est sauvegardée.</p>

  <div class="phases" id="phases-container">
    <!-- Généré par JS -->
  </div>
</section>

<!-- ARBORESCENCE -->
<section class="section-page" id="page-arborescence">
  <div class="section-header">
    <div><span class="section-num">02 — Structure</span><div class="section-title">Arborescence du site</div></div>
  </div>
  <p class="section-intro">Toutes les URLs sont en minuscules, sans accent, avec des tirets. La collection principale s'appelle <code style="color:var(--violet);background:var(--violet-soft);padding:2px 6px;border-radius:4px">/collections/formations</code>.</p>
  <div class="tree">
    <div class="tree-item level-1">🏠 Accueil <span class="tree-url">/</span></div>
    <div class="tree-item level-1">📚 Nos Formations <span class="tree-url">/collections/formations</span></div>
    <div class="tree-item level-2">Formation Strass Dentaire <span class="tree-url">/products/formation-strass-dentaire</span></div>
    <div class="tree-item level-2">Formation Blanchiment Dentaire <span class="tree-url">/products/formation-blanchiment-dentaire</span></div>
    <div class="tree-item level-2">Pack Duo + Matériel <span class="tree-url">/products/pack-duo-materiel</span></div>
    <div class="tree-item level-2">Pack Duo sans Matériel <span class="tree-url">/products/pack-duo</span></div>
    <div class="tree-item level-1">❓ FAQ <span class="tree-url">/pages/faq</span></div>
    <div class="tree-item level-1">👩 À propos <span class="tree-url">/pages/a-propos</span></div>
    <div class="tree-item level-1">📬 Contact <span class="tree-url">/pages/contact</span></div>
    <div class="tree-item level-1">✍️ Blog <span class="tree-url">/blogs/formation</span></div>
    <div class="tree-item level-1">⚖️ Mentions légales <span class="tree-url">/pages/mentions-legales</span></div>
    <div class="tree-item level-1">📋 CGV <span class="tree-url">/pages/cgv</span></div>
  </div>
  <div class="alert alert-violet">URLs à configurer manuellement dans Shopify (champ "URL et SEO" de chaque produit/page). Évitez les suffixes automatiques -1 ou -2 générés par Shopify en cas de doublon de titre.</div>
</section>

<!-- DESIGN -->
<section class="section-page" id="page-design">
  <div class="section-header">
    <div><span class="section-num">03 — Identité</span><div class="section-title">Design du site</div></div>
  </div>
  <p class="section-intro">Deux directions proposées. Choisissez une seule identité et tenez-vous y sur toute la boutique.</p>
  <div class="card-grid">
    <div class="card" style="border-top:3px solid #C9AE7C">
      <h3>🥂 Option A — Champagne & Strass</h3>
      <div style="margin-bottom:12px">
        <div style="display:flex;gap:6px;margin-bottom:8px">
          <div style="width:24px;height:24px;border-radius:6px;background:#1B1410"></div>
          <div style="width:24px;height:24px;border-radius:6px;background:#C9AE7C"></div>
          <div style="width:24px;height:24px;border-radius:6px;background:#F5F1E8"></div>
          <div style="width:24px;height:24px;border-radius:6px;background:#9B3D4A"></div>
        </div>
        <p style="font-size:12px;color:var(--muted)">#1B1410 · #C9AE7C · #F5F1E8 · #9B3D4A</p>
      </div>
      <p style="font-size:12px;color:var(--muted)"><strong style="color:var(--text)">Titres :</strong> Fraunces — <strong style="color:var(--text)">Corps :</strong> IBM Plex Sans</p>
      <p style="font-size:12px;color:var(--muted);margin-top:6px">Ambiance luxe discret, bijouterie fine. Convient si la cible est haut de gamme.</p>
    </div>
    <div class="card" style="border-top:3px solid #C96E9B">
      <h3>🌸 Option B — Moderne & Féminin</h3>
      <div style="margin-bottom:12px">
        <div style="display:flex;gap:6px;margin-bottom:8px">
          <div style="width:24px;height:24px;border-radius:6px;background:#1A0F1C"></div>
          <div style="width:24px;height:24px;border-radius:6px;background:#C96E9B"></div>
          <div style="width:24px;height:24px;border-radius:6px;background:#F9F0F5"></div>
          <div style="width:24px;height:24px;border-radius:6px;background:#4A3670"></div>
        </div>
        <p style="font-size:12px;color:var(--muted)">#1A0F1C · #C96E9B · #F9F0F5 · #4A3670</p>
      </div>
      <p style="font-size:12px;color:var(--muted)"><strong style="color:var(--text)">Titres :</strong> Newsreader — <strong style="color:var(--text)">Corps :</strong> Public Sans</p>
      <p style="font-size:12px;color:var(--muted);margin-top:6px">Tendance esthétique/beauté. Convient si la cible est instagrammable et jeune.</p>
    </div>
  </div>
  <div class="card">
    <h3>📐 Sections homepage (Dawn)</h3>
    <div class="checklist" id="check-design"></div>
  </div>
</section>

<!-- SEO ON-PAGE -->
<section class="section-page" id="page-seo-onpage">
  <div class="section-header">
    <div><span class="section-num">04 — Référencement</span><div class="section-title">SEO on-page, page par page</div></div>
  </div>
  <p class="section-intro">Un seul H1 par page, title entre 50-60 caractères, meta-description 120-155 caractères. À remplir dans le bloc "Référencement" en bas de chaque produit/page Shopify.</p>
  <div class="checklist" id="check-seo-onpage"></div>
</section>

<!-- MOTS-CLÉS -->
<section class="section-page" id="page-mots-cles">
  <div class="section-header">
    <div><span class="section-num">05 — Ciblage</span><div class="section-title">Mots-clés stratégiques</div></div>
  </div>
  <p class="section-intro">Base de travail à enrichir avec Google Search Console une fois le site en ligne. Les requêtes réelles affinent toujours mieux qu'une estimation de départ.</p>
  <table class="data-table">
    <thead><tr><th>Mot-clé</th><th>Intention</th><th>Page cible</th><th>Priorité</th></tr></thead>
    <tbody id="kw-tbody"></tbody>
  </table>
</section>

<!-- SEO TECHNIQUE -->
<section class="section-page" id="page-seo-technique">
  <div class="section-header">
    <div><span class="section-num">06 — Technique</span><div class="section-title">SEO technique sur Shopify</div></div>
  </div>
  <p class="section-intro">La plupart sont des vérifications et réglages manuels dans Shopify — aucun développement requis.</p>
  <div class="checklist" id="check-seo-technique"></div>
</section>

<!-- SCHEMA -->
<section class="section-page" id="page-schema">
  <div class="section-header">
    <div><span class="section-num">07 — Rich results</span><div class="section-title">Données structurées (schema markup)</div></div>
  </div>
  <p class="section-intro">Shopify injecte déjà un schema <code style="color:var(--violet);background:var(--violet-soft);padding:2px 6px;border-radius:4px">Product</code> automatiquement. Ajoutez un schema <code style="color:var(--violet);background:var(--violet-soft);padding:2px 6px;border-radius:4px">Course</code> pour les formations et un <code style="color:var(--violet);background:var(--violet-soft);padding:2px 6px;border-radius:4px">FAQPage</code> sur les pages avec FAQ.</p>
  <div class="alert alert-violet">Coller dans <strong>sections/main-product.liquid</strong>, actif uniquement sur les produits tagués <code>formation</code>.</div>
  <div class="code-block"><pre>{% if product.tags contains 'formation' %}
&lt;script type="application/ld+json"&gt;
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": {{ product.title | json }},
  "description": {{ product.description | strip_html | truncate: 300 | json }},
  "provider": {
    "@type": "Organization",
    "name": "Éclats et Strass",
    "sameAs": "{{ shop.url }}"
  },
  "offers": {
    "@type": "Offer",
    "price": "{{ product.price | money_without_currency }}",
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "url": "{{ canonical_url }}"
  }
}
&lt;/script&gt;
{% endif %}</pre></div>
  <div class="alert alert-gold">
    <strong>FAQPage :</strong> Même principe dans <strong>pages/faq.liquid</strong> — listez les paires question/réponse en JSON-LD. Testez avec l'outil Rich Results Test de Google avant de déployer.
  </div>
</section>

<!-- SHOPIFY AVANCÉ -->
<section class="section-page" id="page-shopify">
  <div class="section-header">
    <div><span class="section-num">08 — Boutique</span><div class="section-title">Optimisation Shopify avancée</div></div>
  </div>
  <p class="section-intro">Configuration des packs, des stocks et des options de session dans Shopify.</p>
  <div class="checklist" id="check-shopify"></div>
</section>

<!-- CONTENU -->
<section class="section-page" id="page-contenu">
  <div class="section-header">
    <div><span class="section-num">09 — Autorité</span><div class="section-title">Stratégie de contenu & Blog</div></div>
  </div>
  <p class="section-intro">Le blog sert à capter les recherches informationnelles et à construire l'E-E-A-T sur un sujet sensible. 2-3 articles avant le lancement, puis rythme régulier.</p>
  <div class="card-grid">
    <div class="card" style="border-left:3px solid var(--violet)">
      <h3>📝 Article 1</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:8px"><strong style="color:var(--text)">Mot-clé :</strong> strass dentaire danger</p>
      <p style="font-size:13px;color:var(--muted)">Strass dentaire : est-ce dangereux pour l'émail ? Rassurer + expliquer le protocole enseigné en formation.</p>
    </div>
    <div class="card" style="border-left:3px solid var(--gold)">
      <h3>📝 Article 2</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:8px"><strong style="color:var(--text)">Mot-clé :</strong> prix formation strass dentaire</p>
      <p style="font-size:13px;color:var(--muted)">Combien coûte une formation strass dentaire en France ? Grille tarifaire du marché + positionnement Éclats et Strass.</p>
    </div>
    <div class="card" style="border-left:3px solid var(--red)">
      <h3>📝 Article 3</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:8px"><strong style="color:var(--text)">Mot-clé :</strong> blanchiment dentaire loi esthéticienne</p>
      <p style="font-size:13px;color:var(--muted)">Blanchiment dentaire par une esthéticienne : que dit la loi ? Fort levier E-E-A-T.</p>
    </div>
    <div class="card" style="border-left:3px solid var(--blue)">
      <h3>📝 Article 4</h3>
      <p style="font-size:13px;color:var(--muted);margin-bottom:8px"><strong style="color:var(--text)">Mot-clé :</strong> comment poser des strass dentaires</p>
      <p style="font-size:13px;color:var(--muted)">Strass dentaire, pose et dépose : qui a le droit de faire quoi. Réassurance technique + légale.</p>
    </div>
  </div>
  <div class="alert alert-violet">Cadence cible : 1 article/mois minimum après le lancement. Répondez aux commentaires pour les signaux d'engagement.</div>
</section>

<!-- CONVERSION -->
<section class="section-page" id="page-conversion">
  <div class="section-header">
    <div><span class="section-num">10 — Vente</span><div class="section-title">Conversion & Confiance</div></div>
  </div>
  <p class="section-intro">Éléments qui transforment les visiteurs en acheteurs. Chaque friction retirée augmente le taux de conversion.</p>
  <div class="checklist" id="check-conversion"></div>
</section>

<!-- LÉGAL -->
<section class="section-page" id="page-legal">
  <div class="section-header">
    <div><span class="section-num">11 — Conformité</span><div class="section-title">Légal & RGPD</div></div>
  </div>
  <div class="alert alert-red">⚠️ Le blanchiment dentaire par non-dentiste est encadré. Mettez en avant la formation et le protocole professionnel — pas l'acte lui-même.</div>
  <div class="checklist" id="check-legal"></div>
</section>

<!-- TRACKING -->
<section class="section-page" id="page-tracking">
  <div class="section-header">
    <div><span class="section-num">12 — Mesure</span><div class="section-title">Tracking & Analytics</div></div>
  </div>
  <p class="section-intro">Impossible d'optimiser ce qu'on ne mesure pas. À configurer avant le lancement.</p>
  <div class="checklist" id="check-tracking"></div>
</section>

<!-- CHECKLIST -->
<section class="section-page" id="page-checklist">
  <div class="section-header">
    <div><span class="section-num">13 — Avant de publier</span><div class="section-title">Checklist finale de lancement</div></div>
  </div>
  <p class="section-intro">Validez chaque point avant de rendre le site public. Une seule liste pour tout vérifier.</p>
  <div class="card">
    <h3>📝 Contenu & Structure</h3>
    <div class="checklist" id="check-cl-contenu"></div>
  </div>
  <div class="card" style="margin-top:14px">
    <h3>⚙️ SEO technique</h3>
    <div class="checklist" id="check-cl-seo"></div>
  </div>
  <div class="card" style="margin-top:14px">
    <h3>⚖️ Légal & Conformité</h3>
    <div class="checklist" id="check-cl-legal"></div>
  </div>
  <div class="card" style="margin-top:14px">
    <h3>💰 Commerce & UX</h3>
    <div class="checklist" id="check-cl-ux"></div>
  </div>
</section>

</div><!-- /content -->
</main>

<button id="scroll-top" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>

<script>
// ══════════════════════════════════════════════
// DONNÉES
// ══════════════════════════════════════════════

const PHASES = [
  {num:'01',title:'Fondations',items:['Réserver le nom de domaine eclatsetstrass.fr (+ .com en redirection si disponible)','Définir l\'identité visuelle (palette, typographie, logo)','Créer la boutique Shopify, thème Dawn (gratuit, rapide)','Réunir les infos légales (SIRET, statut) avant mise en ligne','Créer la collection « Formations »']},
  {num:'02',title:'Contenu produits',items:['Rédiger les 4 fiches produits avec title/meta/H1/H2 optimisés','Ajouter des images professionnelles avec alt text descriptif','Configurer les variantes ou bundles Shopify','Activer le suivi de stock pour les sessions à places limitées']},
  {num:'03',title:'Pages essentielles',items:['Créer la page FAQ dédiée (questions fréquentes + schema FAQPage)','Créer la page À propos avec certifications visibles','Créer la page Contact avec formulaire fonctionnel','Mentions légales + CGV + Politique de remboursement']},
  {num:'04',title:'SEO on-page',items:['Renseigner title + meta-description sur chaque page','Structurer chaque fiche avec H1 > H2 > contenu','Vérifier qu\'aucune page n\'a de H1 dupliqué','URLs propres sans suffixes -1 ou -2']},
  {num:'05',title:'SEO technique',items:['Soumettre le sitemap dans Google Search Console','Tester Core Web Vitals (LCP < 2,5s, INP < 200ms, CLS < 0,1)','Version mobile testée intégralement, tunnel d\'achat inclus','Installer schema Course + FAQPage']},
  {num:'06',title:'Confiance & Conversion',items:['Ajouter paiement en plusieurs fois visible dès la fiche','Afficher le nombre d\'élèves formées + avis','Ajouter une vidéo de présentation de la formatrice','FAQ qui lève les objections concrètes']},
  {num:'07',title:'Tracking',items:['Connecter Google Analytics 4 avec e-commerce activé','Vérifier la propriété dans Google Search Console','Installer Meta Pixel si campagnes Instagram/TikTok','Définir une convention UTM pour les campagnes']},
  {num:'08',title:'Blog & Contenu',items:['Rédiger 2-3 articles avant le lancement','Structurer chaque article avec H1 > H2 > conclusion','Intégrer des liens internes vers les fiches produits']},
  {num:'09',title:'Tests pré-lancement',items:['Passer toute la boutique en mobile','Tester le tunnel d\'achat jusqu\'à la confirmation','Vérifier les emails transactionnels (confirmation, relance)','Tester le formulaire de contact']},
  {num:'10',title:'Lancement & Suivi',items:['Retirer le mot de passe Shopify','Annoncer sur Instagram + TikTok','Surveiller Search Console les 30 premiers jours','Premier bilan SEO à 90 jours']},
];

const CHECKS = {
  'design':['Image hero pleine largeur avec accroche formation','Section "Nos formations" — grille 2 colonnes','Bloc réassurance (certifiée, à distance, matériel inclus)','Témoignages élèves avec photo','Section FAQ condensée (3-4 questions)','Section "Qui suis-je" avec photo de la formatrice','Footer complet avec liens légaux'],
  'seo-onpage':['[Accueil] Title : Formation strass dentaire & blanchiment — Éclats et Strass','[Accueil] H1 : Formation strass dentaire et blanchiment par une professionnelle','[Accueil] Meta : apprenez à poser des strass dentaires et à pratiquer le blanchiment...','[Collection] Title : Formations strass dentaire & blanchiment — Éclats et Strass','[Collection] H1 : Nos formations professionnelles','[Strass] Title : Formation strass dentaire professionnelle — Éclats et Strass','[Strass] H1 : Formation strass dentaire — devenez prothésiste strass certifiée','[Strass] H2s : Le programme · Ce que vous apprendrez · Pour qui · FAQ','[Blanchiment] Title : Formation blanchiment dentaire — Éclats et Strass','[Blanchiment] H1 : Formation blanchiment dentaire pour esthéticiennes','[Pack Duo] Title : Pack formation strass + blanchiment dentaire — Éclats et Strass','[Pack Duo] H1 : Pack duo formations strass & blanchiment + matériel professionnel','[FAQ] Title : FAQ formations strass et blanchiment dentaire — Éclats et Strass','[FAQ] H1 : Questions fréquentes sur nos formations','[À propos] H1 : Éclats et Strass — votre formatrice certifiée','[Blog] Structure H1 > H2 sur chaque article','Toutes les images avec alt text descriptif','Liens internes entre les fiches et la FAQ','Schema FAQPage installé sur la page FAQ','Pas de duplicate content entre les fiches produits','Vérifier que Dawn n\'injecte pas de H1 supplémentaire','URL canonique configurée sur chaque page','Minifier JS/CSS dans Shopify (Online Store → Preferences → Performance)'],
  'seo-technique':['URLs propres sans suffixes -1 ou -2','Un seul H1 par page','Title et meta-description sur CHAQUE page','Alt text descriptif sur toutes les images','Sitemap.xml soumis dans Google Search Console','Redirection 301 du www vers non-www (ou inversement)','Pas de liens brisés (vérifier avec Screaming Frog ou Google Search Console)','Favicon + Apple Touch Icon configurés','Shopify CDN activé (images servies en WebP automatiquement)','HTTPS actif (automatique sur Shopify)','Robots.txt sans blocage des pages importantes','Google Search Console propriété vérifiée','Core Web Vitals vérifiés : LCP < 2,5s, INP < 200ms, CLS < 0,1','PageSpeed mobile > 70','Aucune page d\'erreur 404 dans le menu ou les liens internes'],
  'shopify':['Option Bundles pour le Pack Duo (app native gratuite Shopify Bundles)','Pack sans Matériel configuré comme produit simple','Suivi de stock activé pour les sessions à places limitées','Paiement en 3 ou 4x visible dès la fiche (Klarna, PayPal Pay Later, ou Alma)','Email de confirmation de commande personnalisé avec contenu de formation','Politique de remboursement adaptée aux formations (droit de rétractation)','App d\'avis : Judge.me ou Loox installée','Upsell configuré : proposer le Pack Duo aux acheteurs d\'une seule formation','Meta Pixel installé via Shopify (pas manuellement dans le thème)','Chat ou FAQ en bas de fiche pour lever les objections'],
  'conversion':['Paiement en plusieurs fois affiché dès la fiche, pas seulement au checkout','Nombre d\'élèves déjà formées + avis avec note moyenne visible','Vidéo de présentation de la formatrice — renforce l\'E-E-A-T','FAQ qui lève les objections concrètes : prix, légalité, matériel, certification','Bouton d\'achat sticky sur mobile','Garantie de satisfaction ou remboursement mise en avant','Pop-up de récupération de panier abandonné','Badge "Paiement sécurisé" visible au checkout'],
  'legal':['Mentions légales (raison sociale, SIREN/SIRET, forme juridique, adresse, hébergeur)','CGV : modalités d\'accès, prérequis, délai de rétractation (14 jours pour les formations)','Politique de confidentialité RGPD (Customer Privacy API Shopify + bannière cookies)','Politique de remboursement / annulation','Ne pas promettre de revenus garantis après formation','Cadre légal du blanchiment dentaire précisé (protocole professionnel, pas acte médical)','Organisme de formation : se renseigner sur la déclaration d\'activité (numéro de formation)','Certifications et attestations de la formatrice visibles','Contenu de formation précisé (vidéos, PDF, accès illimité ou limité, support)'],
  'tracking':['Google Analytics 4 connecté avec le e-commerce activé (Admin → Preferences)','Google Search Console vérifié (propriété du domaine)','Meta Pixel installé si campagnes Instagram/TikTok prévues','Convention UTM définie pour distinguer bio / paid / affiliation dans vos rapports'],
  'cl-contenu':['4 fiches produits rédigées avec title/meta/H1/H2 optimisés','Collection Formations avec texte descriptif riche (150-300 mots)','FAQ dédiée + FAQ sur chaque fiche produit','Page À propos avec certifications visibles','2-3 articles de blog publiés au minimum'],
  'cl-seo':['Sitemap soumis à Search Console','Toutes les images ont un alt text','LCP < 2,5s, INP < 200ms, CLS < 0,1 vérifiés','Schema Course + FAQPage installés','Version mobile testée intégralement, tunnel d\'achat inclus'],
  'cl-legal':['CGV, mentions légales, confidentialité RGPD en place','Politique de remboursement/annulation publiée','Cadre légal du blanchiment dentaire mentionné','Bannière cookies conforme (Customer Privacy API)'],
  'cl-ux':['Paiement en 3x visible dès les fiches produits','App d\'avis configurée (au moins une demande d\'avis automatique)','Emails transactionnels testés (confirmation, relance panier)','Redirection du mot de passe Shopify désactivée','Favicon et titres d\'onglets corrects sur toutes les pages'],
};

const KEYWORDS = [
  ['formation strass dentaire','Transactionnelle','Fiche produit + Collection','Haute'],
  ['formation blanchiment dentaire','Transactionnelle','Fiche produit','Haute'],
  ['prix formation strass dentaire','Transactionnelle','Fiche produit + Blog','Haute'],
  ['pack formation strass blanchiment dentaire','Transactionnelle','Fiches packs','Haute'],
  ['blanchiment dentaire esthéticienne légal','Informationnelle','Blog','Haute'],
  ['devenir poseuse strass dentaire','Informationnelle','Accueil + Blog','Moyenne'],
  ['formation strass dentaire à distance','Transactionnelle','Fiche produit','Moyenne'],
  ['kit strass dentaire professionnel','Transactionnelle','Pack + matériel','Moyenne'],
  ['formation strass dentaire avis','Réassurance','Accueil / avis','Moyenne'],
  ['formation strass dentaire finançable','Transactionnelle','FAQ / Produit','Moyenne'],
];

// ══════════════════════════════════════════════
// ÉTAT & PERSISTENCE
// ══════════════════════════════════════════════
const STORAGE_KEY = 'eclats_formation_v2';
let state = {};

function loadState(){
  try{ const s = localStorage.getItem(STORAGE_KEY); if(s) state = JSON.parse(s); }catch(e){ state = {}; }
}

function saveState(){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }catch(e){}
}

function toggle(key){
  state[key] = !state[key];
  saveState();
  renderAll();
}

// ══════════════════════════════════════════════
// RENDER
// ══════════════════════════════════════════════

function makeChecklist(containerId, prefix, items){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = items.map((text, i) => {
    const key = prefix + '_' + i;
    const checked = !!state[key];
    return \`<div class="check-row\${checked?' checked':''}" onclick="toggle('\${key}')">
      <div class="check-box">\${checked?'✓':''}</div>
      <span class="check-text">\${text}</span>
    </div>\`;
  }).join('');
}

function makePhases(){
  const el = document.getElementById('phases-container');
  if(!el) return;
  el.innerHTML = PHASES.map((phase, pi) => {
    const items = phase.items.map((text, i) => {
      const key = \`roadmap_\${pi}_\${i}\`;
      const checked = !!state[key];
      return \`<div class="check-row\${checked?' checked':''}" onclick="toggle('\${key}')">
        <div class="check-box">\${checked?'✓':''}</div>
        <span class="check-text">\${text}</span>
      </div>\`;
    }).join('');
    const doneCount = phase.items.filter((_,i)=>!!state[\`roadmap_\${pi}_\${i}\`]).length;
    const allDone = doneCount === phase.items.length;
    return \`<div class="phase\${pi<2?' open':''}">
      <div class="phase-header" onclick="togglePhase(this.parentElement)">
        <span class="phase-num">\${phase.num}</span>
        <span class="phase-title">\${phase.title}</span>
        <span class="phase-count">\${doneCount}/\${phase.items.length}</span>
        \${allDone ? '<span style="color:var(--green);font-size:13px">✓</span>' : ''}
        <span class="phase-chevron">›</span>
      </div>
      <div class="phase-body"><div style="padding:8px 16px 12px">\${items}</div></div>
    </div>\`;
  }).join('');
}

function makeKeywords(){
  const el = document.getElementById('kw-tbody');
  if(!el) return;
  el.innerHTML = KEYWORDS.map(([kw, intent, page, prio]) => {
    const prioCls = prio === 'Haute' ? 'priority-haute' : 'priority-moyenne';
    return \`<tr>
      <td><strong>\${kw}</strong></td>
      <td><span class="intent-badge">\${intent}</span></td>
      <td style="color:var(--muted)">\${page}</td>
      <td><span class="priority-badge \${prioCls}">\${prio}</span></td>
    </tr>\`;
  }).join('');
}

function updateProgress(){
  const allKeys = [];
  // phases
  PHASES.forEach((p,pi) => p.items.forEach((_,i) => allKeys.push(\`roadmap_\${pi}_\${i}\`)));
  // checklists
  Object.entries(CHECKS).forEach(([prefix, items]) => items.forEach((_,i) => allKeys.push(\`\${prefix}_\${i}\`)));
  const done = allKeys.filter(k => !!state[k]).length;
  const pct = allKeys.length > 0 ? Math.round(done/allKeys.length*100) : 0;
  document.getElementById('progress-pct').textContent = pct + '%';
  document.getElementById('progress-fill').style.width = pct + '%';
  // nav checks
  const navChecks = {
    roadmap: PHASES.flatMap((p,pi)=>p.items.map((_,i)=>\`roadmap_\${pi}_\${i}\`)),
    design: CHECKS.design.map((_,i)=>\`design_\${i}\`),
    'seo-onpage': CHECKS['seo-onpage'].map((_,i)=>\`seo-onpage_\${i}\`),
    'seo-technique': CHECKS['seo-technique'].map((_,i)=>\`seo-technique_\${i}\`),
    shopify: CHECKS.shopify.map((_,i)=>\`shopify_\${i}\`),
    conversion: CHECKS.conversion.map((_,i)=>\`conversion_\${i}\`),
    legal: CHECKS.legal.map((_,i)=>\`legal_\${i}\`),
    tracking: CHECKS.tracking.map((_,i)=>\`tracking_\${i}\`),
    checklist: [...CHECKS['cl-contenu'],...CHECKS['cl-seo'],...CHECKS['cl-legal'],...CHECKS['cl-ux']].map((_,i)=>\`cl-\${i}\`),
  };
  Object.entries(navChecks).forEach(([id, keys]) => {
    const el = document.getElementById('nc-'+id);
    if(!el) return;
    const allDone = keys.every(k=>!!state[k]);
    const anyDone = keys.some(k=>!!state[k]);
    el.className = 'nav-check' + (allDone?' done':anyDone?' half':'');
    el.textContent = allDone ? '✓' : anyDone ? '·' : '';
  });
}

function renderAll(){
  makePhases();
  makeKeywords();
  Object.entries(CHECKS).forEach(([prefix, items]) => {
    const containerId = prefix.startsWith('cl-') ? 'check-'+prefix : 'check-'+prefix;
    makeChecklist(containerId, prefix, items);
  });
  updateProgress();
}

function togglePhase(el){
  el.classList.toggle('open');
}

// ══════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════
function showPage(pageId, navEl){
  document.querySelectorAll('.section-page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const page = document.getElementById('page-'+pageId);
  if(page) page.classList.add('active');
  if(navEl) navEl.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
}

function resetAll(){
  if(!confirm('Réinitialiser toute la progression ? Cette action est irréversible.')) return;
  state = {};
  saveState();
  renderAll();
}

window.addEventListener('scroll', () => {
  document.getElementById('scroll-top').classList.toggle('show', window.scrollY > 400);
});

// ══ INIT ══
loadState();
renderAll();
</script>
</body>
</html>
`

export default function FormationModal() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Bouton FORMATION dans le sidebar */}
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 font-black text-sm tracking-widest uppercase transition-all rounded-2xl py-3.5 px-4"
        style={{
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          color: "#fff",
          boxShadow: "0 4px 20px rgba(124,58,237,0.45)",
          border: "none",
          letterSpacing: "0.12em",
          fontSize: "13px",
        }}>
        🎓 Formation
      </button>

      {/* Modal plein écran */}
      {open && (
        <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "#fff" }}>
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
            <span className="text-white font-black text-base tracking-widest uppercase">🎓 Formation</span>
            <button
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
              <X size={15}/> Fermer
            </button>
          </div>
          <iframe
            srcDoc={FORMATION_HTML}
            className="flex-1 border-0 w-full"
            title="Formation"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        </div>
      )}
    </>
  )
}
