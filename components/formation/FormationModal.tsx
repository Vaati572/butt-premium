"use client"

import { useState } from "react"
import { X } from "lucide-react"

const FORMATION_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Éclats et Strass — Compte rendu total Shopify & SEO</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root{
  --ink:#171922;
  --ink-soft:#4A4C5C;
  --porcelain:#F7F5FA;
  --paper:#FFFFFF;
  --crystal:#6B5CA0;
  --crystal-soft:#EDE9F6;
  --champagne:#B8894F;
  --champagne-soft:#F6ECDC;
  --garnet:#96423F;
  --garnet-soft:#F5E7E6;
  --line:#E3E0EC;
  --radius:16px;
  --maxw:1080px;
}
*,*::before,*::after{box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{
  margin:0;
  background:var(--porcelain);
  color:var(--ink);
  font-family:'IBM Plex Sans',system-ui,-apple-system,sans-serif;
  line-height:1.65;
  -webkit-font-smoothing:antialiased;
}
h1,h2,h3{font-family:'Fraunces',Georgia,serif; font-weight:600; margin:0; color:var(--ink);}
p{margin:0 0 1em;}
p:last-child{margin-bottom:0;}
a{color:var(--crystal);}
code,.mono{font-family:'IBM Plex Mono',ui-monospace,monospace;}
svg{max-width:100%;}
.container{max-width:var(--maxw); margin:0 auto; padding:0 1.5rem;}

/* HERO */
.hero{background:linear-gradient(180deg,#14141D 0%,#1C1B2C 100%); color:#F4F2F9; padding:4.5rem 0 3rem; position:relative;}
.hero .container{display:flex; gap:2.5rem; align-items:center; flex-wrap:wrap;}
.hero-text{flex:1 1 380px; min-width:280px;}
.eyebrow{font-family:'IBM Plex Mono',monospace; text-transform:uppercase; letter-spacing:.14em; font-size:.78rem; color:var(--champagne); margin-bottom:1rem; display:block;}
.hero h1{font-size:clamp(2rem,4.4vw,3rem); line-height:1.14; color:#fff; margin-bottom:1rem;}
.hero p.lead{color:#C9C5D9; font-size:1.05rem; max-width:48ch; margin-bottom:1.6rem;}
.hero-meta{display:flex; flex-wrap:wrap; gap:.6rem;}
.hero-meta span{border:1px solid rgba(244,242,249,.22); color:#E7E4F1; padding:.35rem .8rem; border-radius:999px; font-size:.78rem; font-family:'IBM Plex Mono',monospace;}
.gem-wrap{flex:0 0 210px; display:flex; justify-content:center;}
.gem-wrap svg{filter:drop-shadow(0 18px 34px rgba(107,92,160,.4));}

/* NAV */
.toc{position:sticky; top:0; z-index:30; background:rgba(247,245,250,.94); backdrop-filter:blur(6px); border-bottom:1px solid var(--line);}
.toc .container{display:flex; gap:.35rem; overflow-x:auto; padding-top:.65rem; padding-bottom:.65rem;}
.toc a{white-space:nowrap; text-decoration:none; font-size:.8rem; font-weight:500; color:var(--ink-soft); padding:.4rem .8rem; border-radius:999px; border:1px solid transparent;}
.toc a:hover{border-color:var(--crystal); color:var(--crystal);}

/* SECTIONS */
.section{padding:3.4rem 0; border-bottom:1px solid var(--line); scroll-margin-top:3.6rem;}
.section:last-of-type{border-bottom:none;}
.section-head{margin-bottom:1.8rem; display:flex; gap:.9rem; align-items:flex-start;}
.section-head h2{font-size:clamp(1.4rem,2.6vw,1.9rem);}
.section-num{font-family:'IBM Plex Mono',monospace; color:var(--champagne); font-size:.82rem; display:block; margin-bottom:.35rem;}
.section-intro{color:var(--ink-soft); max-width:72ch; margin-bottom:2rem;}
.gem-mark{flex:0 0 auto; margin-top:.35rem;}

/* GRID / CARD */
.grid{display:grid; gap:1.2rem;}
.grid-2{grid-template-columns:repeat(auto-fit,minmax(320px,1fr));}
.card{background:var(--paper); border:1px solid var(--line); border-radius:var(--radius); padding:1.5rem;}
.card h3{font-size:1.05rem; margin-bottom:.6rem;}
.card ul{margin:0; padding-left:1.15rem; color:var(--ink-soft);}
.card li{margin-bottom:.35rem;}

/* PAGE CARD */
.page-card{background:var(--paper); border:1px solid var(--line); border-radius:var(--radius); padding:1.5rem 1.6rem; margin-bottom:1.2rem;}
.page-card__url{font-family:'IBM Plex Mono',monospace; font-size:.83rem; color:var(--crystal); background:var(--crystal-soft); padding:.28rem .65rem; border-radius:6px; display:inline-block; margin-bottom:1.1rem;}
.kv{margin-bottom:.9rem;}
.kv__label{display:block; font-size:.72rem; text-transform:uppercase; letter-spacing:.08em; color:var(--ink-soft); margin-bottom:.2rem;}
.kv__value{font-size:.97rem;}
.h2list{margin:.3rem 0 1.1rem; padding-left:1.2rem;}
.h2list li{margin-bottom:.32rem;}
.tagrow{display:flex; flex-wrap:wrap; gap:.4rem;}
.tag{background:var(--champagne-soft); color:#8A6431; font-family:'IBM Plex Mono',monospace; font-size:.75rem; padding:.26rem .6rem; border-radius:999px;}

/* TREE */
.tree,.tree ul{list-style:none; margin:0; padding-left:1.3rem;}
.tree{padding-left:0;}
.tree > li{padding-left:0;}
.tree li{position:relative; padding:.42rem 0 .42rem 1.1rem;}
.tree ul{border-left:1px dashed var(--line); margin-left:.15rem;}
.tree li ul li::before{content:""; position:absolute; left:0; top:1.05rem; width:.9rem; height:1px; background:var(--line);}
.tree code{font-size:.78rem; color:var(--ink-soft); margin-left:.5rem;}
.tree strong{font-weight:600;}

/* PHASES */
.phases{position:relative; margin-left:.6rem; padding-left:2.3rem; border-left:2px solid var(--crystal-soft);}
.phase{position:relative; margin-bottom:2.1rem;}
.phase:last-child{margin-bottom:0;}
.phase__num{position:absolute; left:-3rem; top:0; width:2.2rem; height:2.2rem; border-radius:50%; background:var(--ink); color:var(--champagne); display:flex; align-items:center; justify-content:center; font-family:'IBM Plex Mono',monospace; font-size:.83rem; font-weight:600;}
.phase h3{font-size:1.12rem; margin-bottom:.6rem;}
.phase .note{font-size:.85rem; font-style:italic; color:var(--ink-soft); margin-top:.6rem;}

/* TABLE */
.table-wrap{overflow-x:auto; border:1px solid var(--line); border-radius:var(--radius); background:var(--paper);}
table{width:100%; border-collapse:collapse; font-size:.92rem;}
th,td{text-align:left; padding:.78rem 1rem; border-bottom:1px solid var(--line); vertical-align:top;}
thead th{background:var(--porcelain); font-family:'IBM Plex Mono',monospace; font-size:.74rem; text-transform:uppercase; letter-spacing:.05em; color:var(--ink-soft);}
tbody tr:last-child td{border-bottom:none;}
.prio{font-size:.75rem; font-weight:600; padding:.2rem .55rem; border-radius:999px; font-family:'IBM Plex Mono',monospace; white-space:nowrap;}
.prio--haute{background:var(--champagne-soft); color:#8A6431;}
.prio--moyenne{background:var(--crystal-soft); color:var(--crystal);}

/* CHECKLIST */
.checklist{list-style:none; margin:0; padding:0;}
.checklist li{margin-bottom:.65rem;}
.checklist label{display:flex; align-items:flex-start; gap:.7rem; cursor:pointer;}
.checklist input{margin-top:.28rem; width:1.05rem; height:1.05rem; accent-color:var(--crystal); flex:0 0 auto;}
.checklist input:checked ~ span{color:var(--ink-soft); text-decoration:line-through; text-decoration-color:var(--crystal);}
.checklist-group h3{font-size:.98rem; margin-bottom:.7rem; color:var(--crystal);}

/* CALLOUTS */
.callout{border-radius:var(--radius); padding:1.35rem 1.5rem; margin:1.6rem 0; border:1px solid;}
.callout__label{display:block; font-family:'IBM Plex Mono',monospace; font-size:.78rem; text-transform:uppercase; letter-spacing:.06em; margin-bottom:.6rem; font-weight:600;}
.callout--warn{background:var(--garnet-soft); border-color:#E2C3C1;}
.callout--warn .callout__label{color:var(--garnet);}
.callout--tip{background:var(--crystal-soft); border-color:#D6CFEA;}
.callout--tip .callout__label{color:var(--crystal);}
.callout p{color:var(--ink-soft); font-size:.95rem;}
.callout ul{color:var(--ink-soft); font-size:.95rem; margin:.5rem 0 0; padding-left:1.2rem;}
.callout li{margin-bottom:.4rem;}

/* SWATCHES */
.swatches{display:flex; flex-wrap:wrap; gap:1rem; margin:0 0 1.4rem;}
.swatch{width:118px;}
.swatch__chip{height:60px; border-radius:10px; border:1px solid var(--line); margin-bottom:.5rem;}
.swatch__name{font-size:.85rem; font-weight:600;}
.swatch__hex{font-family:'IBM Plex Mono',monospace; font-size:.76rem; color:var(--ink-soft);}

/* WIREFRAME */
.wireframe{border:1px solid var(--line); border-radius:var(--radius); background:var(--paper); padding:1rem; display:flex; flex-direction:column; gap:.5rem; margin-bottom:1.4rem;}
.wireframe--split{flex-direction:row; flex-wrap:wrap; align-items:stretch;}
.wf-col{flex:1 1 260px; display:flex; flex-direction:column; gap:.5rem;}
.wf-block{border:1px dashed var(--line); border-radius:8px; padding:.9rem 1rem; font-size:.8rem; color:var(--ink-soft); font-family:'IBM Plex Mono',monospace; text-align:center; background:var(--porcelain);}
.wf-header{background:var(--ink); color:#fff; opacity:.85;}
.wf-hero{background:var(--crystal-soft); color:var(--crystal); font-weight:600; padding:1.7rem 1rem;}
.wf-grid{background:var(--champagne-soft);}
.wf-mini-grid{display:grid; grid-template-columns:repeat(4,1fr); gap:.4rem; margin-top:.6rem;}
.wf-mini-grid div{aspect-ratio:3/4; background:#fff; border:1px solid var(--line); border-radius:4px;}
.wf-media{flex:1; min-height:200px; display:flex; align-items:center; justify-content:center;}
.wf-footer{background:var(--ink); color:#fff; opacity:.7;}

/* CODE */
pre.code{background:var(--ink); color:#E7E4F1; border-radius:var(--radius); padding:1.3rem 1.4rem; overflow-x:auto; font-family:'IBM Plex Mono',monospace; font-size:.8rem; line-height:1.65; margin:1rem 0;}
.code-label{font-family:'IBM Plex Mono',monospace; font-size:.76rem; text-transform:uppercase; letter-spacing:.06em; color:var(--ink-soft); margin-bottom:.5rem; display:block;}

footer{padding:3rem 0 4rem; text-align:center; color:var(--ink-soft); font-size:.88rem;}

@media (max-width:640px){
  .hero{padding:3rem 0 2rem;}
  .gem-wrap{flex-basis:130px;}
  .phases{padding-left:1.9rem; margin-left:.1rem;}
  .phase__num{left:-2.55rem; width:1.9rem; height:1.9rem; font-size:.73rem;}
  .section{padding:2.4rem 0;}
}
@media print{
  .toc{display:none;}
}
</style>
</head>
<body>

<svg style="display:none">
  <symbol id="gem-mark" viewBox="0 0 24 24">
    <polygon points="12,1 3,9 12,9" fill="#B8ACD9"/>
    <polygon points="12,1 12,9 21,9" fill="#C9A05C"/>
    <polygon points="12,23 3,9 12,9" fill="#6B5CA0"/>
    <polygon points="12,23 12,9 21,9" fill="#8A6431"/>
    <polygon points="12,1 3,9 12,9 12,1 12,9 21,9 12,23 3,9 12,9 12,23 12,9 21,9" fill="none" stroke="#171922" stroke-opacity=".12" stroke-width="1"/>
  </symbol>
</svg>

<header class="hero">
  <div class="container">
    <div class="hero-text">
      <span class="eyebrow">Éclats et Strass · Plan de lancement Shopify</span>
      <h1>Compte rendu total — boutique, SEO &amp; référencement organique</h1>
      <p class="lead">Le plan complet pour lancer vos formations strass dentaire et blanchiment dentaire sur Shopify : architecture du site, structure SEO (H1 à H6), SEO technique, données structurées et conformité — prêt à exécuter, étape par étape.</p>
      <div class="hero-meta">
        <span>4 offres</span>
        <span>Marché France</span>
        <span>SEO organique en priorité</span>
        <span>Thème Dawn</span>
      </div>
    </div>
    <div class="gem-wrap">
      <svg width="200" height="200" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg">
        <polygon points="120,10 40,85 70,85" fill="#C9BEE0"/>
        <polygon points="120,10 70,85 95,85" fill="#A996CB"/>
        <polygon points="120,10 95,85 120,85" fill="#8B76B5"/>
        <polygon points="120,10 120,85 145,85" fill="#B79A6E"/>
        <polygon points="120,10 145,85 170,85" fill="#C9A05C"/>
        <polygon points="120,10 170,85 200,85" fill="#A67D42"/>
        <polygon points="120,230 40,85 70,85" fill="#8B76B5"/>
        <polygon points="120,230 70,85 95,85" fill="#6B5CA0"/>
        <polygon points="120,230 95,85 120,85" fill="#56487F"/>
        <polygon points="120,230 120,85 145,85" fill="#8C6B3C"/>
        <polygon points="120,230 145,85 170,85" fill="#B8894F"/>
        <polygon points="120,230 170,85 200,85" fill="#7A5C31"/>
        <polyline points="40,85 70,85 95,85 120,85 145,85 170,85 200,85" fill="none" stroke="#171922" stroke-opacity=".18" stroke-width="1"/>
        <line x1="120" y1="10" x2="120" y2="85" stroke="#171922" stroke-opacity=".12" stroke-width="1"/>
        <line x1="120" y1="230" x2="120" y2="85" stroke="#171922" stroke-opacity=".12" stroke-width="1"/>
        <line x1="120" y1="10" x2="40" y2="85" stroke="#171922" stroke-opacity=".12" stroke-width="1"/>
        <line x1="120" y1="10" x2="200" y2="85" stroke="#171922" stroke-opacity=".12" stroke-width="1"/>
        <line x1="120" y1="230" x2="40" y2="85" stroke="#171922" stroke-opacity=".12" stroke-width="1"/>
        <line x1="120" y1="230" x2="200" y2="85" stroke="#171922" stroke-opacity=".12" stroke-width="1"/>
      </svg>
    </div>
  </div>
</header>

<nav class="toc">
  <div class="container">
    <a href="#hypotheses">Hypothèses</a>
    <a href="#feuille-de-route">Feuille de route</a>
    <a href="#arborescence">Arborescence</a>
    <a href="#design">Design du site</a>
    <a href="#seo-onpage">SEO on-page</a>
    <a href="#mots-cles">Mots-clés</a>
    <a href="#seo-technique">SEO technique</a>
    <a href="#donnees-structurees">Données structurées</a>
    <a href="#shopify-avance">Shopify avancé</a>
    <a href="#contenu">Contenu</a>
    <a href="#conversion">Conversion</a>
    <a href="#legal">Légal</a>
    <a href="#tracking">Tracking</a>
    <a href="#checklist-finale">Checklist finale</a>
  </div>
</nav>

<main class="container">

<!-- HYPOTHESES -->
<section class="section" id="hypotheses">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">00 — Périmètre</span>
      <h2>Hypothèses de départ</h2>
    </div>
  </div>
  <p class="section-intro">Avant d'entrer dans le détail, voici ce que j'ai retenu de votre catalogue. Dites-moi si je me trompe quelque part et j'ajuste — tout le reste du plan reste valable dans les deux cas.</p>
  <div class="grid grid-2">
    <div class="card">
      <h3>Catalogue retenu (4 offres)</h3>
      <ul>
        <li><strong>Formation Strass Dentaire</strong> — vendue seule</li>
        <li><strong>Formation Blanchiment Dentaire</strong> — vendue seule</li>
        <li><strong>Pack Duo + Matériel</strong> — les deux formations + kit professionnel</li>
        <li><strong>Pack Duo sans Matériel</strong> — les deux formations, sans kit</li>
      </ul>
    </div>
    <div class="card">
      <h3>Points à confirmer</h3>
      <ul>
        <li>Vous mentionnez « une formation strass dentaire » puis « une formation strass » séparément : je pars du principe qu'il s'agit de la même offre citée deux fois. Si « formation strass » est en réalité une 5ᵉ offre distincte, dupliquez simplement la structure de fiche produit ci-dessous pour elle.</li>
        <li>Le plan fonctionne que vos formations soient en présentiel, à distance, ou en hybride — les rares points qui changent selon le format sont signalés.</li>
        <li>Le référencement organique est traité en priorité, comme demandé. Le payant (Instagram/TikTok Ads) n'est mentionné qu'en complément.</li>
      </ul>
    </div>
  </div>
</section>

<!-- FEUILLE DE ROUTE -->
<section class="section" id="feuille-de-route">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">01 — Plan d'action</span>
      <h2>Feuille de route en 10 phases</h2>
    </div>
  </div>
  <p class="section-intro">L'ordre compte : chaque phase s'appuie sur la précédente. Toutes les listes ci-dessous sont cochables — utilisez cette page comme votre suivi de chantier.</p>

  <div class="phases">
    <div class="phase">
      <div class="phase__num">01</div>
      <h3>Fondations</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Réserver le nom de domaine eclatsetstrass.fr (+ .com en redirection si disponible)</span></label></li>
        <li><label><input type="checkbox"><span>Définir l'identité visuelle (palette, typographie, logo)</span></label></li>
        <li><label><input type="checkbox"><span>Créer la boutique Shopify, thème Dawn (gratuit, rapide — vous le maîtrisez déjà sur Sublime Blazer)</span></label></li>
        <li><label><input type="checkbox"><span>Réunir les infos légales de l'entreprise (SIRET, statut) avant mise en ligne</span></label></li>
      </ul>
      <p class="note">Direction visuelle complète (palette, typographie, wireframes) : voir la section « Design du site » ci-dessous.</p>
    </div>

    <div class="phase">
      <div class="phase__num">02</div>
      <h3>Architecture &amp; catalogue</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Créer la collection « Formations »</span></label></li>
        <li><label><input type="checkbox"><span>Créer les 4 fiches produits (voir arborescence et structure SEO ci-dessous)</span></label></li>
        <li><label><input type="checkbox"><span>Trancher : pack = produit simple ou app Shopify Bundles (voir section Shopify avancé)</span></label></li>
      </ul>
    </div>

    <div class="phase">
      <div class="phase__num">03</div>
      <h3>SEO on-page</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Appliquer les balises title / meta description / H1-H6 de chaque page</span></label></li>
        <li><label><input type="checkbox"><span>Rédiger les textes en intégrant naturellement les mots-clés cibles</span></label></li>
      </ul>
    </div>

    <div class="phase">
      <div class="phase__num">04</div>
      <h3>SEO technique</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Vérifier le sitemap.xml, le soumettre à Search Console</span></label></li>
        <li><label><input type="checkbox"><span>Vérifier canonical, redirections, breadcrumbs, vitesse</span></label></li>
      </ul>
    </div>

    <div class="phase">
      <div class="phase__num">05</div>
      <h3>Conformité légale</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Rédiger CGV, mentions légales, politique de confidentialité, politique de remboursement</span></label></li>
        <li><label><input type="checkbox"><span>Traiter le point de vigilance réglementaire strass / blanchiment avant toute mise en avant marketing</span></label></li>
      </ul>
    </div>

    <div class="phase">
      <div class="phase__num">06</div>
      <h3>Conversion &amp; confiance</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Installer une app d'avis (Judge.me, déjà utilisée sur Butt Premium) et activer le paiement en plusieurs fois</span></label></li>
        <li><label><input type="checkbox"><span>Construire la FAQ, les badges de réassurance, la preuve sociale</span></label></li>
      </ul>
    </div>

    <div class="phase">
      <div class="phase__num">07</div>
      <h3>Contenu &amp; autorité</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Lancer le blog avec le calendrier éditorial fourni</span></label></li>
        <li><label><input type="checkbox"><span>Créer la fiche Google Business Profile si formations en présentiel</span></label></li>
        <li><label><input type="checkbox"><span>Démarrer le netlinking (écoles d'esthétique, annuaires du secteur)</span></label></li>
      </ul>
    </div>

    <div class="phase">
      <div class="phase__num">08</div>
      <h3>Tracking</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Connecter GA4, Search Console, Meta Pixel</span></label></li>
        <li><label><input type="checkbox"><span>Définir votre convention UTM pour Instagram/TikTok</span></label></li>
      </ul>
    </div>

    <div class="phase">
      <div class="phase__num">09</div>
      <h3>Tests &amp; pré-lancement</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Tester le tunnel de commande complet (les 4 produits) sur mobile</span></label></li>
        <li><label><input type="checkbox"><span>Auditer PageSpeed Insights, corriger LCP/INP/CLS</span></label></li>
        <li><label><input type="checkbox"><span>Relire l'orthographe, vérifier les liens, tester les 404</span></label></li>
      </ul>
    </div>

    <div class="phase">
      <div class="phase__num">10</div>
      <h3>Lancement &amp; suivi</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Soumettre le sitemap, annoncer sur les réseaux</span></label></li>
        <li><label><input type="checkbox"><span>Suivre le positionnement des mots-clés cibles chaque semaine le premier mois</span></label></li>
      </ul>
    </div>
  </div>
</section>

<!-- ARBORESCENCE -->
<section class="section" id="arborescence">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">02 — Structure</span>
      <h2>Arborescence du site</h2>
    </div>
  </div>
  <p class="section-intro">Une architecture plate — 2 clics maximum pour atteindre une fiche produit depuis l'accueil — sert à la fois l'expérience utilisateur et le SEO (le maillage interne remonte plus vite vers les pages qui vendent).</p>
  <div class="card">
    <ul class="tree">
      <li><strong>Accueil</strong> <code>/</code>
        <ul>
          <li><strong>Nos Formations</strong> <code>/collections/formations</code>
            <ul>
              <li>Formation Strass Dentaire <code>/products/formation-strass-dentaire</code></li>
              <li>Formation Blanchiment Dentaire <code>/products/formation-blanchiment-dentaire</code></li>
              <li>Pack Duo + Matériel <code>/products/pack-duo-materiel</code></li>
              <li>Pack Duo sans Matériel <code>/products/pack-duo</code></li>
            </ul>
          </li>
          <li><strong>Blog</strong> <code>/blogs/conseils</code></li>
          <li><strong>À propos</strong> <code>/pages/a-propos</code></li>
          <li><strong>FAQ</strong> <code>/pages/faq</code></li>
          <li><strong>Contact</strong> <code>/pages/contact</code></li>
          <li><strong>Pied de page</strong>
            <ul>
              <li>CGV <code>/pages/cgv</code></li>
              <li>Mentions légales <code>/pages/mentions-legales</code></li>
              <li>Confidentialité <code>/pages/politique-confidentialite</code></li>
              <li>Remboursement <code>/pages/politique-remboursement</code></li>
            </ul>
          </li>
        </ul>
      </li>
    </ul>
  </div>
</section>

<!-- DESIGN DU SITE -->
<section class="section" id="design">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">03 — Direction artistique</span>
      <h2>Design du site — épuré &amp; optimisé</h2>
    </div>
  </div>
  <p class="section-intro">Ce qui manquait dans la première version : la direction visuelle de la boutique elle-même (ce rapport avait sa propre esthétique, pas encore la vôtre). Voici un système volontairement restreint : peu de couleurs, peu de polices, peu de composants, réutilisés partout — c'est ça, l'épuré.</p>

  <div class="card" style="margin-bottom:1.4rem;">
    <h3>Concept</h3>
    <p style="color:var(--ink-soft);">Un minimalisme précis plutôt qu'un glam premier degré : beaucoup de blanc, une seule couleur signature utilisée avec parcimonie, une typographie nette, et la photographie comme unique « éclat » du site — pas d'effets scintillants en CSS. Ce rapport applique déjà cette direction (violet cristal + or en touches, sur fond clair) : vous pouvez vous en inspirer tel quel pour la boutique.</p>
  </div>

  <h3 style="margin-bottom:.8rem;">Palette</h3>
  <div class="swatches">
    <div class="swatch"><div class="swatch__chip" style="background:#FAF9F7;"></div><div class="swatch__name">Fond</div><div class="swatch__hex">#FAF9F7</div></div>
    <div class="swatch"><div class="swatch__chip" style="background:#1C1B22;"></div><div class="swatch__name">Encre</div><div class="swatch__hex">#1C1B22</div></div>
    <div class="swatch"><div class="swatch__chip" style="background:#6B5CA0;"></div><div class="swatch__name">Signature</div><div class="swatch__hex">#6B5CA0</div></div>
    <div class="swatch"><div class="swatch__chip" style="background:#B8894F;"></div><div class="swatch__name">Détail</div><div class="swatch__hex">#B8894F</div></div>
  </div>
  <div class="callout callout--tip">
    <span class="callout__label">💡 Règle de restraint</span>
    <p>Le violet n'apparaît qu'à un seul endroit par écran : le bouton d'action principal et les liens. L'or n'est jamais utilisé en aplat large, seulement en badge fin ou en filet. Dans Dawn, ces couleurs se configurent en <strong>jeux de couleurs</strong> (Paramètres du thème → Couleurs) : créez-en deux — un jeu clair pour l'essentiel du site, un jeu accent réservé à une seule section par page pour créer un point focal, jamais plus.</p>
  </div>

  <h3 style="margin:1.8rem 0 .8rem;">Typographie</h3>
  <div class="grid grid-2">
    <div class="card">
      <h3 style="font-size:1rem;">Option A — cohérente avec ce rapport</h3>
      <ul><li>Titres : Fraunces</li><li>Corps : IBM Plex Sans</li></ul>
    </div>
    <div class="card">
      <h3 style="font-size:1rem;">Option B — plus éditorial classique</h3>
      <ul><li>Titres : Newsreader</li><li>Corps : Public Sans</li></ul>
    </div>
  </div>
  <p style="color:var(--ink-soft); font-size:.9rem; margin-top:.8rem;">Se configure dans Paramètres du thème → Typographie (sélecteurs séparés Titres / Corps, aperçu en direct depuis la bibliothèque de polices Shopify). Limitez-vous à 2 graisses par police : chaque graisse supplémentaire est un fichier de plus à charger, donc du poids en moins pour l'INP.</p>

  <h3 style="margin:1.8rem 0 .8rem;">Page d'accueil — structure</h3>
  <div class="wireframe">
    <div class="wf-block wf-header">Header — logo, 5 liens de nav max, panier</div>
    <div class="wf-block wf-hero">Hero — 1 visuel photo, H1 court, 1 CTA</div>
    <div class="wf-block wf-trust">Réassurance — 4 points clés en ligne</div>
    <div class="wf-block wf-grid">
      Nos formations — grille de 4 cartes
      <div class="wf-mini-grid"><div></div><div></div><div></div><div></div></div>
    </div>
    <div class="wf-block wf-proof">Preuve sociale — note globale + 1 avis</div>
    <div class="wf-block wf-why">Pourquoi nous — 3 colonnes</div>
    <div class="wf-block wf-about">À propos (teaser) + CTA</div>
    <div class="wf-block wf-faq">FAQ courte — 3 à 4 questions</div>
    <div class="wf-block wf-footer">Footer — légal, réseaux, newsletter</div>
  </div>

  <h3 style="margin:1.8rem 0 .8rem;">Fiche produit — structure</h3>
  <div class="wireframe wireframe--split">
    <div class="wf-col">
      <div class="wf-block wf-media">Galerie photo grand format</div>
    </div>
    <div class="wf-col">
      <div class="wf-block wf-info">Titre + prix + 1 badge maximum</div>
      <div class="wf-block wf-cta">CTA + paiement en plusieurs fois visible</div>
      <div class="wf-block wf-accordion">Programme · Inclus · Modalités · FAQ — en accordéons</div>
    </div>
  </div>

  <div class="grid grid-2" style="margin-top:.4rem;">
    <div class="card">
      <h3>Composants</h3>
      <ul>
        <li>Boutons : coins peu arrondis (4-6px), un seul style plein + un style contour, jamais plus de 2 styles sur un même écran</li>
        <li>Badges : un seul par élément — n'empilez pas note, tag et promo sur une même carte</li>
        <li>Cartes produit : photo en 3:4, titre, prix, un seul CTA</li>
      </ul>
    </div>
    <div class="card">
      <h3>Direction photo</h3>
      <ul>
        <li>Lumière claire, fond neutre, ratio cohérent (3:4 partout)</li>
        <li>Gestes et matériel en gros plan plutôt que visages si contrainte RGPD</li>
        <li>Éviter le stock photo générique « dentiste souriant » — préférez vos propres photos de formation</li>
      </ul>
    </div>
  </div>

  <div class="callout callout--tip" style="margin-top:1.8rem;">
    <span class="callout__label">Design × performance</span>
    <ul>
      <li>Hero en image fixe &lt;200 Ko, jamais de slider JS ni de vidéo autoplay lourde</li>
      <li>aspect-ratio CSS défini sur chaque image, pour éviter les sauts de mise en page (CLS)</li>
      <li>Maximum 7-8 sections sur la page d'accueil — chaque section ajoutée pèse sur l'INP</li>
      <li>Aucun popup d'entrée : mauvais pour le CLS, et contre-productif sur un achat aussi réfléchi</li>
    </ul>
  </div>

  <h3 style="margin:1.8rem 0 .8rem;">Correspondance avec les sections Dawn</h3>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Élément du site</th><th>Section Dawn à utiliser</th></tr></thead>
      <tbody>
        <tr><td>Header épuré</td><td>Header — logo centré, menu simple</td></tr>
        <tr><td>Hero</td><td>Image banner — 1 image, 1 bouton, pas de slideshow</td></tr>
        <tr><td>Réassurance</td><td>Multicolumn — 4 colonnes avec icônes</td></tr>
        <tr><td>Nos formations</td><td>Featured collection</td></tr>
        <tr><td>Pourquoi nous</td><td>Multicolumn — 3 colonnes</td></tr>
        <tr><td>FAQ</td><td>Collapsible content — accordéon natif</td></tr>
        <tr><td>Footer</td><td>Footer standard, colonnes réduites</td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- SEO ON-PAGE -->
<section class="section" id="seo-onpage">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">04 — H1 à H6, title, meta</span>
      <h2>Structure SEO on-page, page par page</h2>
    </div>
  </div>
  <p class="section-intro">Règle d'or : <strong>un seul H1 par page</strong> (Dawn utilise déjà le titre du produit comme H1 — vérifiez qu'aucun H1 en double ne traîne dans une description collée depuis Word). Title ≤ 60 caractères, meta description 120-155 caractères — vérifiez chaque page dans l'aperçu Google que Shopify affiche sous le champ SEO.</p>

  <div class="page-card">
    <span class="page-card__url">/ (Accueil)</span>
    <div class="kv"><span class="kv__label">Title</span><span class="kv__value">Formation Strass Dentaire &amp; Blanchiment | Éclats et Strass</span></div>
    <div class="kv"><span class="kv__label">Meta description</span><span class="kv__value">Devenez experte en strass dentaire et blanchiment dentaire avec Éclats et Strass. Formations pro, kit inclus en option, paiement en plusieurs fois.</span></div>
    <div class="kv"><span class="kv__label">H1</span><span class="kv__value">Formation Strass Dentaire &amp; Blanchiment Dentaire — Éclats et Strass</span></div>
    <div class="kv__label">Structure H2</div>
    <ol class="h2list">
      <li>Nos formations en un coup d'œil</li>
      <li>Pourquoi se former avec Éclats et Strass</li>
      <li>Nos packs formation + matériel</li>
      <li>Ce qu'en disent nos élèves</li>
      <li>Questions fréquentes</li>
    </ol>
    <div class="tagrow"><span class="tag">formation strass dentaire</span><span class="tag">formation blanchiment dentaire</span><span class="tag">devenir poseuse strass dentaire</span></div>
  </div>

  <div class="page-card">
    <span class="page-card__url">/collections/formations</span>
    <div class="kv"><span class="kv__label">Title</span><span class="kv__value">Nos Formations Strass &amp; Blanchiment Dentaire | Éclats et Strass</span></div>
    <div class="kv"><span class="kv__label">Meta description</span><span class="kv__value">Formations professionnelles strass dentaire, blanchiment dentaire et packs tout compris avec matériel. Certificat inclus, places limitées.</span></div>
    <div class="kv"><span class="kv__label">H1</span><span class="kv__value">Toutes nos formations en esthétique dentaire</span></div>
    <div class="kv__label">Structure H2</div>
    <ol class="h2list">
      <li>Formations à l'unité</li>
      <li>Nos packs tout compris</li>
      <li>Comment choisir votre formation</li>
    </ol>
    <div class="tagrow"><span class="tag">formations esthétique dentaire</span></div>
  </div>

  <div class="page-card">
    <span class="page-card__url">/products/formation-strass-dentaire</span>
    <div class="kv"><span class="kv__label">Title</span><span class="kv__value">Formation Strass Dentaire | Certification Pro — Éclats et Strass</span></div>
    <div class="kv"><span class="kv__label">Meta description</span><span class="kv__value">Formation professionnelle à la pose de strass dentaire : technique, hygiène, cadre légal. Certificat inclus. Avec ou sans matériel.</span></div>
    <div class="kv"><span class="kv__label">H1</span><span class="kv__value">Formation Strass Dentaire — devenez poseuse professionnelle</span></div>
    <div class="kv__label">Structure H2</div>
    <ol class="h2list">
      <li>Ce que vous allez apprendre</li>
      <li>Pour qui est cette formation</li>
      <li>Ce qui est inclus</li>
      <li>Modalités (durée, format, certification)</li>
      <li>Ce que couvre cette formation — la pose (la dépose reste un acte réservé au chirurgien-dentiste)</li>
      <li>Ce que disent nos élèves</li>
      <li>Questions fréquentes</li>
    </ol>
    <div class="tagrow"><span class="tag">formation strass dentaire</span><span class="tag">formation pose strass dentaire</span><span class="tag">bijou dentaire formation</span><span class="tag">prix formation strass dentaire</span></div>
  </div>

  <div class="page-card">
    <span class="page-card__url">/products/formation-blanchiment-dentaire</span>
    <div class="kv"><span class="kv__label">Title</span><span class="kv__value">Formation Blanchiment Dentaire Pro — Éclats et Strass</span></div>
    <div class="kv"><span class="kv__label">Meta description</span><span class="kv__value">Apprenez à proposer un blanchiment dentaire cosmétique conforme à la réglementation française. Formation complète, certificat, kit en option.</span></div>
    <div class="kv"><span class="kv__label">H1</span><span class="kv__value">Formation Blanchiment Dentaire — une prestation conforme et sécurisée</span></div>
    <div class="kv__label">Structure H2</div>
    <ol class="h2list">
      <li>Ce que vous allez apprendre</li>
      <li>Pour qui est cette formation</li>
      <li>Ce qui est inclus</li>
      <li>Cadre réglementaire : ce que vous devez savoir</li>
      <li>Modalités</li>
      <li>Ce que disent nos élèves</li>
      <li>Questions fréquentes</li>
    </ol>
    <div class="tagrow"><span class="tag">formation blanchiment dentaire</span><span class="tag">blanchiment des dents professionnel</span><span class="tag">devenir spécialiste blanchiment dentaire</span></div>
  </div>

  <div class="page-card">
    <span class="page-card__url">/products/pack-duo-materiel</span>
    <div class="kv"><span class="kv__label">Title</span><span class="kv__value">Pack Formation Strass + Blanchiment + Kit Matériel</span></div>
    <div class="kv"><span class="kv__label">Meta description</span><span class="kv__value">Les 2 formations (strass + blanchiment) et le kit matériel professionnel complet pour démarrer votre activité immédiatement.</span></div>
    <div class="kv"><span class="kv__label">H1</span><span class="kv__value">Pack Duo Complet — Formations + Matériel Professionnel</span></div>
    <div class="kv__label">Structure H2</div>
    <ol class="h2list">
      <li>Tout ce qui est inclus dans ce pack</li>
      <li>Pourquoi choisir le pack plutôt que les formations séparées</li>
      <li>Le détail du matériel fourni</li>
      <li>Modalités</li>
      <li>Questions fréquentes</li>
    </ol>
    <div class="tagrow"><span class="tag">pack formation strass blanchiment dentaire</span><span class="tag">formation esthétique dentaire kit inclus</span></div>
  </div>

  <div class="page-card">
    <span class="page-card__url">/products/pack-duo</span>
    <div class="kv"><span class="kv__label">Title</span><span class="kv__value">Pack Formation Strass + Blanchiment Dentaire</span></div>
    <div class="kv"><span class="kv__label">Meta description</span><span class="kv__value">Les 2 formations strass dentaire et blanchiment dentaire réunies, sans le kit — idéal si vous avez déjà votre matériel.</span></div>
    <div class="kv"><span class="kv__label">H1</span><span class="kv__value">Pack Duo — Formation Strass Dentaire + Blanchiment Dentaire</span></div>
    <div class="kv__label">Structure H2</div>
    <ol class="h2list">
      <li>Tout ce qui est inclus dans ce pack</li>
      <li>Pour qui est cette formule</li>
      <li>Modalités</li>
      <li>Questions fréquentes</li>
    </ol>
    <div class="tagrow"><span class="tag">pack formation strass et blanchiment dentaire</span><span class="tag">formation duo esthétique dentaire</span></div>
  </div>

  <div class="grid grid-2">
    <div class="page-card" style="margin-bottom:0;">
      <span class="page-card__url">/blogs/conseils</span>
      <div class="kv"><span class="kv__label">Title</span><span class="kv__value">Blog Esthétique Dentaire — Conseils | Éclats et Strass</span></div>
      <div class="kv"><span class="kv__label">H1</span><span class="kv__value">Le Blog Éclats et Strass</span></div>
      <p style="color:var(--ink-soft); font-size:.9rem; margin-top:.8rem;">Chaque article : 1 H1 (titre de l'article), 3 à 5 H2 pour structurer, un mot-clé cible unique. Voir calendrier éditorial en section Contenu.</p>
    </div>
    <div class="page-card" style="margin-bottom:0;">
      <span class="page-card__url">/pages/faq + /pages/a-propos</span>
      <div class="kv"><span class="kv__label">FAQ — H1</span><span class="kv__value">Questions fréquentes</span></div>
      <div class="kv"><span class="kv__label">À propos — H1</span><span class="kv__value">À propos d'Éclats et Strass</span></div>
      <p style="color:var(--ink-soft); font-size:.9rem; margin-top:.8rem;">La page À propos doit afficher vos certifications, votre parcours et votre engagement conformité — c'est ce que Google appelle l'E-E-A-T (expérience, expertise, autorité, confiance), particulièrement scruté sur les sujets proches de la santé comme le blanchiment dentaire.</p>
    </div>
  </div>
</section>

<!-- MOTS CLES -->
<section class="section" id="mots-cles">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">05 — Ciblage</span>
      <h2>Tableau de mots-clés stratégiques</h2>
    </div>
  </div>
  <p class="section-intro">Base de travail à enrichir avec Google Search Console une fois le site en ligne (les requêtes réelles affinent toujours mieux qu'une estimation de départ).</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr><th>Mot-clé cible</th><th>Intention</th><th>Page cible</th><th>Priorité</th></tr>
      </thead>
      <tbody>
        <tr><td>formation strass dentaire</td><td>Transactionnelle</td><td>Fiche produit + Collection</td><td><span class="prio prio--haute">Haute</span></td></tr>
        <tr><td>formation blanchiment dentaire</td><td>Transactionnelle</td><td>Fiche produit</td><td><span class="prio prio--haute">Haute</span></td></tr>
        <tr><td>prix formation strass dentaire</td><td>Transactionnelle</td><td>Fiche produit + Blog</td><td><span class="prio prio--haute">Haute</span></td></tr>
        <tr><td>pack formation strass blanchiment dentaire</td><td>Transactionnelle</td><td>Fiches packs</td><td><span class="prio prio--haute">Haute</span></td></tr>
        <tr><td>blanchiment dentaire esthéticienne légal</td><td>Informationnelle (E-E-A-T)</td><td>Blog</td><td><span class="prio prio--haute">Haute</span></td></tr>
        <tr><td>devenir poseuse / prothésiste strass dentaire</td><td>Informationnelle</td><td>Accueil + Blog</td><td><span class="prio prio--moyenne">Moyenne</span></td></tr>
        <tr><td>formation strass dentaire à distance</td><td>Transactionnelle</td><td>Fiche produit</td><td><span class="prio prio--moyenne">Moyenne</span></td></tr>
        <tr><td>kit strass dentaire professionnel</td><td>Transactionnelle</td><td>Pack + matériel</td><td><span class="prio prio--moyenne">Moyenne</span></td></tr>
        <tr><td>formation strass dentaire avis</td><td>Réassurance</td><td>Accueil / avis</td><td><span class="prio prio--moyenne">Moyenne</span></td></tr>
        <tr><td>formation strass dentaire finançable</td><td>Transactionnelle</td><td>FAQ / Produit</td><td><span class="prio prio--moyenne">Moyenne — à vérifier</span></td></tr>
      </tbody>
    </table>
  </div>
  <div class="callout callout--tip">
    <span class="callout__label">💡 Astuce</span>
    <p>Le mot-clé « finançable CPF » ne peut être utilisé que si vos formations sont réellement éligibles au Compte Personnel de Formation — ce qui suppose une certification Qualiopi, un chantier distinct et exigeant, séparé de la boutique e-commerce. Ne l'affichez que si c'est vrai : c'est exactement le type d'allégation que la DGCCRF contrôle dans ce secteur.</p>
  </div>
</section>

<!-- SEO TECHNIQUE -->
<section class="section" id="seo-technique">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">06 — Sous le capot</span>
      <h2>SEO technique sur Shopify</h2>
    </div>
  </div>
  <p class="section-intro">Ce qui est déjà géré nativement par Shopify est indiqué — vous n'avez rien à faire dessus, juste à le vérifier.</p>
  <ul class="checklist">
    <li><label><input type="checkbox"><span>URLs propres : <code>/products/formation-strass-dentaire</code> — évitez les suffixes auto -1, -2 en cas de doublon de handle</span></label></li>
    <li><label><input type="checkbox"><span>Un seul H1 par page (vérifier qu'aucune description produit collée depuis Word n'en contient un second)</span></label></li>
    <li><label><input type="checkbox"><span>Title et meta description personnalisés sur CHAQUE page (bloc « Référencement » en bas de chaque fiche)</span></label></li>
    <li><label><input type="checkbox"><span>Alt text descriptif sur toutes les images (ex : « formation-strass-dentaire-pose-professionnelle »)</span></label></li>
    <li><label><input type="checkbox"><span>Images compressées en WebP, &lt;200 Ko chacune, avant upload</span></label></li>
    <li><label><input type="checkbox"><span>Sitemap.xml (généré automatiquement par Shopify) soumis à Google Search Console</span></label></li>
    <li><label><input type="checkbox"><span>robots.txt.liquid vérifié — aucune page utile bloquée</span></label></li>
    <li><label><input type="checkbox"><span>Canonical tags automatiques Shopify — attention aux doublons via filtres/tags de collection</span></label></li>
    <li><label><input type="checkbox"><span>Redirections 301 configurées pour toute ancienne URL (Admin → Navigation → Redirections d'URL)</span></label></li>
    <li><label><input type="checkbox"><span>Breadcrumbs actifs (natifs sur Dawn, schema BreadcrumbList inclus)</span></label></li>
    <li><label><input type="checkbox"><span>Vitesse : LCP &lt; 2,5 s · INP &lt; 200 ms · CLS &lt; 0,1, mesurés au 75ᵉ percentile via PageSpeed Insights / Search Console</span></label></li>
    <li><label><input type="checkbox"><span>Nombre d'apps limité au strict nécessaire (chaque app ajoute du JS qui pèse sur l'INP)</span></label></li>
    <li><label><input type="checkbox"><span>Indexation mobile testée en priorité (index mobile-first chez Google)</span></label></li>
    <li><label><input type="checkbox"><span>Google Search Console + Bing Webmaster Tools connectés</span></label></li>
    <li><label><input type="checkbox"><span>Google Business Profile créé si formations en présentiel (SEO local)</span></label></li>
  </ul>
</section>

<!-- DONNEES STRUCTUREES -->
<section class="section" id="donnees-structurees">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">07 — Rich results</span>
      <h2>Données structurées (schema markup)</h2>
    </div>
  </div>
  <p class="section-intro">Shopify injecte déjà un schema <code>Product</code> automatiquement. Comme vos produits sont en réalité des <em>formations</em>, ajouter un schema <code>Course</code> en complément aide Google à mieux comprendre l'offre (sans garantir un rich result, mais sans risque non plus). Voici un snippet prêt à coller dans <code>sections/main-product.liquid</code>, actif uniquement sur les produits tagués <code>formation</code>.</p>
  <span class="code-label">Snippet Liquid — schema Course conditionnel</span>
  <pre class="code"><code>{% if product.tags contains 'formation' %}
&lt;script type='application/ld+json'&gt;
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
    "priceCurrency": "{{ cart.currency.iso_code }}",
    "availability": "https://schema.org/{% if product.available %}InStock{% else %}SoldOut{% endif %}",
    "url": "{{ shop.url }}{{ product.url }}"
  }
}
&lt;/script&gt;
{% endif %}</code></pre>

  <span class="code-label">FAQPage — à insérer sur chaque fiche produit et sur /pages/faq</span>
  <pre class="code"><code>{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "La formation strass dentaire est-elle certifiante ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Oui, un certificat de réussite vous est délivré à l'issue de la formation."
      }
    },
    {
      "@type": "Question",
      "name": "Le matériel est-il fourni avec la formation ?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Le matériel est inclus uniquement dans la formule Pack + Matériel."
      }
    }
  ]
}</code></pre>
  <p style="color:var(--ink-soft); font-size:.9rem;">Complétez le tableau <code>mainEntity</code> avec vos vraies FAQ (durée, prérequis, remboursement, légalité). Les avis Judge.me injectent déjà leur propre schema <code>Review</code> / <code>AggregateRating</code> automatiquement — rien à coder de ce côté.</p>
</section>

<!-- SHOPIFY AVANCE -->
<section class="section" id="shopify-avance">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">08 — Configuration</span>
      <h2>Optimisation Shopify avancée</h2>
    </div>
  </div>

  <div class="grid grid-2">
    <div class="card">
      <h3>Gérer les « packs »</h3>
      <ul>
        <li><strong>Option simple :</strong> un produit unique avec description détaillée du contenu — rapide, mais ne décompte pas le stock du matériel séparément.</li>
        <li><strong>Option recommandée :</strong> l'app native et gratuite <strong>Shopify Bundles</strong> — elle lie plusieurs composants et décrémente en temps réel le stock physique du kit matériel pendant que les formations restent en vente continue. Idéal pour le Pack + Matériel, où le kit a un stock réel à protéger contre la survente.</li>
        <li>Pour le Pack sans Matériel (aucun stock physique à gérer), un produit simple suffit très bien.</li>
      </ul>
    </div>
    <div class="card">
      <h3>Formations à sessions fixes ou accès immédiat ?</h3>
      <ul>
        <li><strong>Sessions à dates et places limitées :</strong> activez le suivi de stock avec quantité = nombre de places, et envisagez une app de réservation type Sesami pour associer un calendrier.</li>
        <li><strong>Accès à distance immédiat :</strong> stock illimité, option « continuer la vente en rupture » activée.</li>
      </ul>
    </div>
    <div class="card">
      <h3>Apps recommandées</h3>
      <ul>
        <li><strong>Judge.me</strong> — avis + rich snippets étoiles (déjà en place sur Butt Premium)</li>
        <li><strong>Alma / Klarna / Shopify Installments</strong> — paiement en 3-4x, décisif sur un panier formation de plusieurs centaines d'euros</li>
        <li><strong>Klaviyo ou Shopify Email</strong> — relance de panier abandonné, essentielle sur un achat considéré</li>
        <li><strong>Shopify Forms</strong> — capture d'email avec réduction sur la première formation</li>
      </ul>
    </div>
    <div class="card">
      <h3>Vitesse &amp; checkout</h3>
      <ul>
        <li>Auditez PageSpeed Insights après chaque nouvelle app installée — chaque script ajouté grignote l'INP</li>
        <li>Activez Shop Pay, Apple Pay et Google Pay pour réduire la friction au tunnel de commande</li>
        <li>Thème Dawn conservé tel quel plutôt qu'un thème payant chargé : votre niveau technique en Liquid permet de tout personnaliser dessus sans surcoût de poids</li>
      </ul>
    </div>
  </div>
</section>

<!-- CONTENU -->
<section class="section" id="contenu">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">09 — Autorité</span>
      <h2>Stratégie de contenu &amp; calendrier éditorial</h2>
    </div>
  </div>
  <p class="section-intro">Le blog sert à capter les recherches informationnelles (celles qui ne cherchent pas encore à acheter) et à construire l'E-E-A-T sur un sujet sensible. 2 à 3 articles avant le lancement, puis un rythme régulier.</p>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Article</th><th>Mot-clé visé</th><th>Angle</th></tr></thead>
      <tbody>
        <tr><td>Strass dentaire : est-ce dangereux pour l'émail ?</td><td>strass dentaire danger</td><td>Rassurer + expliquer le protocole enseigné en formation</td></tr>
        <tr><td>Combien coûte une formation strass dentaire en France ?</td><td>prix formation strass dentaire</td><td>Grille tarifaire du marché + positionnement Éclats et Strass</td></tr>
        <tr><td>Blanchiment dentaire par une esthéticienne : que dit la loi ?</td><td>blanchiment dentaire loi esthéticienne</td><td>Cadre légal précis (voir encart conformité) — fort levier E-E-A-T</td></tr>
        <tr><td>Strass dentaire, pose et dépose : qui a le droit de faire quoi ?</td><td>dépose strass dentaire</td><td>Clarifier le périmètre de votre formation</td></tr>
        <tr><td>Quel kit choisir pour débuter le strass dentaire ?</td><td>kit strass dentaire débutant</td><td>Comparatif + lien vers le Pack + Matériel</td></tr>
        <tr><td>5 raisons de se former au strass dentaire en 2026</td><td>formation strass dentaire 2026</td><td>Tendance + opportunité business</td></tr>
        <tr><td>Financer sa formation esthétique dentaire : les options</td><td>financer formation esthétique dentaire</td><td>Panorama honnête des options (à vérifier au cas par cas)</td></tr>
        <tr><td>Témoignage : d'esthéticienne à experte strass dentaire</td><td>reconversion strass dentaire</td><td>Preuve sociale, storytelling élève</td></tr>
      </tbody>
    </table>
  </div>
</section>

<!-- CONVERSION -->
<section class="section" id="conversion">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">10 — Taux de conversion</span>
      <h2>Conversion &amp; éléments de confiance</h2>
    </div>
  </div>
  <p class="section-intro">Une formation à plusieurs centaines d'euros est un achat réfléchi : la confiance se construit avant le clic sur « Ajouter au panier », pas seulement au checkout.</p>
  <div class="grid grid-2">
    <div class="card">
      <h3>Sur les fiches produits</h3>
      <ul>
        <li>Paiement en plusieurs fois affiché dès la fiche, pas seulement au checkout</li>
        <li>Nombre d'élèves déjà formées, avis avec note moyenne visible</li>
        <li>Vidéo de présentation de la formatrice — renforce l'E-E-A-T autant que la conversion</li>
        <li>FAQ qui lève les objections concrètes : prix, légalité, matériel, certification</li>
      </ul>
    </div>
    <div class="card">
      <h3>Réassurance générale</h3>
      <ul>
        <li>Badges : paiement sécurisé, assurance RC Pro, matériaux certifiés CE</li>
        <li>Politique de remboursement claire et facilement trouvable</li>
        <li>Contact direct pré-achat (WhatsApp ou chat) pour les questions hésitantes</li>
        <li>Compte à rebours uniquement si les places sont réellement limitées — l'urgence doit rester honnête</li>
      </ul>
    </div>
  </div>
</section>

<!-- LEGAL -->
<section class="section" id="legal">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">11 — Conformité</span>
      <h2>Conformité légale France</h2>
    </div>
  </div>
  <div class="grid grid-2">
    <div class="card">
      <h3>Pages obligatoires</h3>
      <ul>
        <li>Mentions légales (raison sociale, SIREN/SIRET, forme juridique, adresse, hébergeur)</li>
        <li>CGV : modalités d'accès, prérequis, délai de rétractation adapté aux prestations de formation, paiement, propriété intellectuelle des contenus pédagogiques</li>
        <li>Politique de confidentialité RGPD (Customer Privacy API Shopify + bannière cookies conforme CNIL)</li>
        <li>Politique de remboursement / annulation</li>
      </ul>
    </div>
    <div class="card">
      <h3>À faire relire par un professionnel</h3>
      <ul>
        <li>Les CGV, avant mise en ligne — je peux vous donner une base de rédaction, mais un avocat ou un service type LegalStart doit les valider</li>
        <li>Votre contrat d'assurance RC Pro, pour confirmer qu'il couvre explicitement blanchiment ET pose de strass</li>
      </ul>
    </div>
  </div>

  <div class="callout callout--warn">
    <span class="callout__label">⚠ Point de vigilance réglementaire — à faire valider par un professionnel du droit</span>
    <p><strong>Blanchiment dentaire :</strong> en France, seuls les produits à 0,1&nbsp;% de peroxyde d'hydrogène ou moins (ou sans peroxyde) peuvent être utilisés par des non-dentistes, dans un cadre strictement cosmétique. Entre 0,1&nbsp;% et 6&nbsp;%, l'usage est réservé aux chirurgiens-dentistes (directive 2011/84/UE, Code de la santé publique). Attention : certains contenus concurrents affirment à tort qu'un taux de 6&nbsp;% serait autorisé pour les non-dentistes — ce n'est pas le cas, et le reprendre dans votre formation ou votre marketing vous exposerait à un risque. La DGCCRF contrôle régulièrement ce secteur, en particulier les allégations commerciales du type « blanchiment professionnel » ou « comme chez le dentiste ».</p>
    <p><strong>Strass dentaire :</strong> la pose est globalement tolérée tant qu'elle reste superficielle — pas de perçage, de limage, ni d'altération structurelle de la dent. C'est une zone grise sans jurisprudence défavorable connue à ce jour, à condition de rester non invasif. En revanche, la <strong>dépose</strong> (retrait) est un acte réservé au chirurgien-dentiste : à indiquer clairement dans votre formation et vos CGV.</p>
    <ul>
      <li>Matériaux certifiés CE, cristaux conformes REACH (sans plomb ni nickel)</li>
      <li>Fiche de consentement client + questionnaire de santé préalable, pour chaque prestation enseignée</li>
      <li>Assurance RC Pro couvrant explicitement ces deux prestations</li>
    </ul>
  </div>
</section>

<!-- TRACKING -->
<section class="section" id="tracking">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">12 — Mesure</span>
      <h2>Tracking &amp; analytics</h2>
    </div>
  </div>
  <ul class="checklist">
    <li><label><input type="checkbox"><span>Google Analytics 4 connecté avec le e-commerce activé (Admin → Preferences)</span></label></li>
    <li><label><input type="checkbox"><span>Google Search Console vérifié (propriété du domaine)</span></label></li>
    <li><label><input type="checkbox"><span>Meta Pixel installé si campagnes Instagram/TikTok prévues (canal naturel pour ce secteur très visuel)</span></label></li>
    <li><label><input type="checkbox"><span>Convention UTM définie pour distinguer bio / paid / affiliation dans vos rapports</span></label></li>
  </ul>
</section>

<!-- CHECKLIST FINALE -->
<section class="section" id="checklist-finale">
  <div class="section-head">
    <svg class="gem-mark" width="22" height="22"><use href="#gem-mark"/></svg>
    <div>
      <span class="section-num">13 — Avant de publier</span>
      <h2>Checklist finale de lancement</h2>
    </div>
  </div>
  <div class="grid grid-2">
    <div class="card checklist-group">
      <h3>Contenu &amp; structure</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>4 fiches produits rédigées avec title/meta/H1/H2 optimisés</span></label></li>
        <li><label><input type="checkbox"><span>Collection Formations avec texte descriptif riche (150-300 mots)</span></label></li>
        <li><label><input type="checkbox"><span>FAQ dédiée + FAQ sur chaque fiche produit</span></label></li>
        <li><label><input type="checkbox"><span>Page À propos avec certifications visibles</span></label></li>
        <li><label><input type="checkbox"><span>2-3 articles de blog publiés au minimum</span></label></li>
      </ul>
    </div>
    <div class="card checklist-group">
      <h3>SEO technique</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>Sitemap soumis à Search Console</span></label></li>
        <li><label><input type="checkbox"><span>Toutes les images ont un alt text</span></label></li>
        <li><label><input type="checkbox"><span>LCP &lt; 2,5 s, INP &lt; 200 ms, CLS &lt; 0,1 vérifiés</span></label></li>
        <li><label><input type="checkbox"><span>Schema Course + FAQPage installés</span></label></li>
        <li><label><input type="checkbox"><span>Version mobile testée intégralement, tunnel d'achat inclus</span></label></li>
      </ul>
    </div>
    <div class="card checklist-group">
      <h3>Légal &amp; conformité</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>CGV, mentions légales, confidentialité, remboursement publiées</span></label></li>
        <li><label><input type="checkbox"><span>Bannière cookies conforme CNIL activée</span></label></li>
        <li><label><input type="checkbox"><span>Contenu blanchiment aligné sur le seuil 0,1&nbsp;% de peroxyde</span></label></li>
        <li><label><input type="checkbox"><span>Distinction pose / dépose claire sur la formation strass</span></label></li>
        <li><label><input type="checkbox"><span>CGV relues par un professionnel du droit</span></label></li>
      </ul>
    </div>
    <div class="card checklist-group">
      <h3>Conversion &amp; tracking</h3>
      <ul class="checklist">
        <li><label><input type="checkbox"><span>App d'avis installée et premiers avis collectés</span></label></li>
        <li><label><input type="checkbox"><span>Paiement en plusieurs fois activé et visible</span></label></li>
        <li><label><input type="checkbox"><span>GA4 connecté, e-commerce activé</span></label></li>
        <li><label><input type="checkbox"><span>Search Console vérifié</span></label></li>
        <li><label><input type="checkbox"><span>Meta Pixel installé si campagnes prévues</span></label></li>
      </ul>
    </div>
  </div>
</section>

</main>

<footer>
  <div class="container">
    Document préparé pour Éclats et Strass — prêt pour l'exécution. Dites-moi par quelle partie vous voulez commencer : fiches produits, snippets Liquid, ou rédaction des CGV.
  </div>
</footer>

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
