// Générateur du portfolio — transforme le dossier « contenu » en site statique dans « dist ».
// Lancement : npm run build   (aucune autre dépendance que « marked »)
// Option : --liens-explicites  → liens vers « page/index.html » (aperçu hors serveur web)

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, cpSync, rmSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const ROOT = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(ROOT, process.env.SORTIE || 'dist');
const EXPLICITE = process.argv.includes('--liens-explicites');
const site = JSON.parse(readFileSync(join(ROOT, 'contenu/site.json'), 'utf8'));
const ID = site.identite;
const C = site.contact;
const SEO = site.seo;
const SITE_URL = (SEO.url_du_site || '').replace(/\/+$/, '');
const BASE = ('/' + (SEO.chemin_de_base || '/').replace(/^\/+|\/+$/g, '') + '/').replace('//', '/');
const ANNEE = new Date().getFullYear();

// ---------- utilitaires ----------
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const prefix = (depth) => (depth === 0 ? './' : '../'.repeat(depth));
const lien = (depth, chemin) => {
  // chemin : '' (accueil) ou 'projets/' etc.
  let p = prefix(depth) + chemin;
  if (EXPLICITE && (chemin === '' || chemin.endsWith('/'))) p += 'index.html';
  return p;
};
const abs = (chemin) => (SITE_URL ? SITE_URL + BASE + chemin : '');

function parseFrontmatter(texte) {
  const m = texte.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, corps: texte };
  const data = {};
  let cle = null;
  for (const ligne of m[1].split(/\r?\n/)) {
    if (!ligne.trim()) continue;
    const item = ligne.match(/^\s+-\s?(.*)$/);
    if (item && cle) {
      if (!Array.isArray(data[cle])) data[cle] = [];
      data[cle].push(item[1].trim());
      continue;
    }
    const kv = ligne.match(/^([\w_]+):\s*(.*)$/);
    if (kv) {
      cle = kv[1];
      data[cle] = kv[2].trim();
    }
  }
  return { data, corps: m[2] };
}

function lireProjets() {
  const dossier = join(ROOT, 'contenu/projets');
  return readdirSync(dossier)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map((f) => {
      const { data, corps } = parseFrontmatter(readFileSync(join(dossier, f), 'utf8'));
      const liste = (v) => (Array.isArray(v) ? v : v ? [v] : []);
      return {
        ...data,
        ordre: Number(data.ordre || 99),
        outils: liste(data.outils),
        livrables: liste(data.livrables).map((l) => {
          const [fichier, ...leg] = l.split('|');
          return { fichier: fichier.trim(), legende: leg.join('|').trim() || fichier.trim() };
        }),
        corps,
      };
    })
    .filter((p) => p.slug && p.titre)
    .sort((a, b) => a.ordre - b.ordre);
}
const PROJETS = lireProjets();
const projetParSlug = Object.fromEntries(PROJETS.map((p) => [p.slug, p]));

// Rendu Markdown : les titres ## reçoivent un repère d'axe (A, B, C…) comme sur un plan
function renduCorps(md) {
  let i = 0;
  const html = marked.parse(md, { mangle: false, headerIds: false });
  return html.replace(/<h2>(.*?)<\/h2>/g, (_, t) => {
    const axe = String.fromCharCode(65 + i++);
    return `<h2 class="axe-titre"><span class="axe" aria-hidden="true">${axe}</span>${t}</h2>`;
  });
}

// ---------- icônes (traits simples, 1.5px) ----------
const ICONES = {
  fleche: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  telecharger: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 7l9 6 9-6"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  tel: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
  copier: '<rect x="8" y="8" width="12" height="12" rx="1"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
  lieu: '<path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  retour: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
};
const icone = (n, cls = 'ico') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[n]}</svg>`;

// ---------- CV ----------
const CV_DISPO = existsSync(join(ROOT, 'public', site.cv.fichier));
const NOM_CV = site.cv.fichier.split('/').pop();

// ---------- gabarit commun ----------
const NAV = [
  ['', 'Accueil'],
  ['a-propos/', 'À propos'],
  ['projets/', 'Projets'],
  ['competences/', 'Compétences'],
  ['parcours/', 'Parcours'],
  ['cv/', 'CV'],
  ['contact/', 'Contact'],
];

function page({ chemin, depth, titre, description, contenu, actif, type = 'website', jsonld = '', is404 = false }) {
  const p = is404 ? BASE : prefix(depth);
  const L = (c) => (is404 ? BASE + c : lien(depth, c));
  const titreComplet = titre ? `${titre} · ${ID.nom_court}` : `${ID.nom_complet} · ${ID.titre}`;
  const desc = description || SEO.description;
  const canon = abs(chemin);
  const ogImg = abs('images/general/apercu-partage.png');
  const nav = NAV.map(([c, l]) => `<li><a href="${L(c)}"${actif === c ? ' aria-current="page"' : ''}>${l}</a></li>`).join('');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(titreComplet)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="keywords" content="${esc(SEO.mots_cles)}">
<meta name="author" content="${esc(ID.nom_complet)}">
${is404 ? '<meta name="robots" content="noindex">' : ''}
${canon && !is404 ? `<link rel="canonical" href="${canon}">` : ''}
<meta property="og:type" content="${type}">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="${esc(ID.nom_complet)}">
<meta property="og:title" content="${esc(titreComplet)}">
<meta property="og:description" content="${esc(desc)}">
${canon ? `<meta property="og:url" content="${canon}">` : ''}
${ogImg ? `<meta property="og:image" content="${ogImg}">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titreComplet)}">
<meta name="twitter:description" content="${esc(desc)}">
${ogImg ? `<meta name="twitter:image" content="${ogImg}">` : ''}
<meta name="theme-color" content="#F3F5F7" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E1217" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${p}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${p}apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,500..800&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap">
<link rel="stylesheet" href="${p}styles.css">
${jsonld ? `<script type="application/ld+json">${jsonld}</script>` : ''}
</head>
<body>
<a class="evitement" href="#contenu">Aller au contenu</a>
<header class="entete">
  <div class="cadre entete-in">
    <a class="marque" href="${L('')}" aria-label="${esc(ID.nom_complet)}, retour à l’accueil">
      <span class="marque-mono" aria-hidden="true">${esc(ID.initiales)}</span>
      <span class="marque-txt"><strong>${esc(ID.nom_court)}</strong><span>${esc(ID.titre)}</span></span>
    </a>
    <button class="menu-btn" type="button" aria-expanded="false" aria-controls="menu-principal">${icone('menu')}<span>Menu</span></button>
    <nav class="nav" id="menu-principal" aria-label="Navigation principale"><ul>${nav}</ul></nav>
  </div>
</header>
<main id="contenu">
${contenu}
</main>
<footer class="pied">
  <div class="cadre pied-grille">
    <div class="pied-bloc">
      <p class="pied-nom">${esc(ID.nom_complet)}</p>
      <p class="pied-sous">${esc(ID.titre)} · ${esc(ID.specialite)}<br>${esc(ID.localisation)}</p>
    </div>
    <nav class="pied-bloc" aria-label="Navigation secondaire">
      <p class="etiquette">Pages</p>
      <ul class="pied-liens">${NAV.slice(1).map(([c, l]) => `<li><a href="${L(c)}">${l}</a></li>`).join('')}</ul>
    </nav>
    <div class="pied-bloc">
      <p class="etiquette">Contact</p>
      <ul class="pied-liens">
        <li><a href="mailto:${esc(C.email)}">${esc(C.email)}</a></li>
        ${C.linkedin_url ? `<li><a href="${esc(C.linkedin_url)}" rel="noopener" target="_blank">LinkedIn</a></li>` : ''}
        ${CV_DISPO ? `<li><a href="${p}${site.cv.fichier}" download="${NOM_CV}">Télécharger le CV (PDF)</a></li>` : ''}
      </ul>
    </div>
  </div>
  <div class="cadre pied-bas"><span>© ${ANNEE} ${esc(ID.nom_complet)}</span><span class="mono">Site statique · sans traceur</span></div>
</footer>
<script src="${p}main.js" defer></script>
</body>
</html>
`;
}

// ---------- composants ----------
const boutonCV = (depth, cls = 'btn btn-ligne') =>
  CV_DISPO
    ? `<a class="${cls}" href="${prefix(depth)}${site.cv.fichier}" download="${NOM_CV}">${icone('telecharger')}Télécharger le CV</a>`
    : `<a class="${cls}" href="${lien(depth, 'cv/')}">${icone('doc')}Voir le CV</a>`;

function cartouche(p, depth, niveau = 'h3') {
  const href = lien(depth, `projets/${p.slug}/`);
  return `<article class="carte-projet">
  <a class="carte-lien" href="${href}">
    <div class="carte-visuel"><img src="${prefix(depth)}${p.illustration}" alt="" loading="lazy" width="800" height="500"></div>
    <div class="carte-corps">
      <p class="etiquette">${esc(p.categorie)}</p>
      <${niveau} class="carte-titre">${esc(p.titre)}</${niveau}>
      <p class="carte-resume">${esc(p.resume)}</p>
      <dl class="cartouche">
        <div><dt>Structure</dt><dd>${esc(p.structure)}</dd></div>
        <div><dt>Rôle</dt><dd>${esc(p.role)}</dd></div>
        <div><dt>Année</dt><dd>${esc(p.annee)}</dd></div>
      </dl>
      <span class="carte-cta">Lire l’étude de cas ${icone('fleche')}</span>
    </div>
  </a>
</article>`;
}

function enTetePage(depth, sur, titre, intro, extra = '') {
  return `<section class="page-tete">
  <div class="cadre">
    <p class="etiquette">${sur}</p>
    <h1>${titre}</h1>
    ${intro ? `<p class="chapo">${intro}</p>` : ''}
    ${extra}
  </div>
</section>`;
}

// ---------- pages ----------
const pages = [];

// Accueil
{
  const depth = 0;
  const exp = site.experiences[0];
  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: ID.nom_complet,
    jobTitle: `${ID.titre} — ${exp.poste}`,
    worksFor: { '@type': 'Organization', name: exp.structure },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'École Supérieure des Travaux Publics (ESTP) – INPHB' },
    address: { '@type': 'PostalAddress', addressLocality: 'Abidjan', addressCountry: 'CI' },
    email: `mailto:${C.email}`,
    ...(SITE_URL ? { url: SITE_URL + BASE } : {}),
    ...(C.linkedin_url ? { sameAs: [C.linkedin_url] } : {}),
    knowsAbout: ['Génie civil', 'Méthodes de construction', 'BIM', 'Revit', 'Ouvrages d’art', 'Python', 'Simulation de Monte-Carlo'],
  });
  const axes = [
    ['Méthodes de construction', 'Plans méthodes 2D/3D, phasages et suivi d’application sur le viaduc du métro d’Abidjan.', 'metro-abidjan-ingenieur-methodes'],
    ['BIM et modélisation', 'Maquettes 2D/3D et rendus avec Revit et AutoCAD, du plan d’exécution à la villa conçue de bout en bout.', 'conception-villa-basse'],
    ['Décision et programmation', 'PERT, Monte-Carlo en Python et Fuzzy AHP pour choisir une méthode de réalisation sur des critères mesurés.', 'pfe-aide-decision-dalle-viaduc'],
  ];
  const contenu = `
<section class="hero">
  <div class="cadre hero-grille">
    <div class="hero-texte">
      <p class="etiquette hero-sur"><span class="pastille" aria-hidden="true"></span>${esc(exp.poste)} · ${esc(exp.structure)}</p>
      <h1 class="hero-nom">${esc(ID.nom_complet)}</h1>
      <p class="hero-titre">${esc(ID.titre)} <span>· ${esc(ID.specialite)}</span></p>
      <p class="hero-accroche">${esc(ID.accroche)}</p>
      <div class="actions">
        <a class="btn btn-plein" href="${lien(depth, 'projets/')}">Voir mes projets ${icone('fleche')}</a>
        ${boutonCV(depth)}
        <a class="btn btn-texte" href="${lien(depth, 'contact/')}">${icone('mail')}Me contacter</a>
      </div>
    </div>
    <figure class="hero-plan">
      <img src="images/general/hero-viaduc.svg" alt="Dessin au trait d’un viaduc : piles, tablier et culée, avec une dalle préfabriquée en cours de pose et des cotes techniques." width="640" height="460">
      <figcaption class="mono">Fig. 01 — Schéma de principe, travée de viaduc · illustration originale</figcaption>
    </figure>
  </div>
  <div class="cadre">
    <dl class="faits">
      <div><dt>Poste actuel</dt><dd>${esc(exp.poste)}<br><span>${esc(exp.structure)} · depuis oct. 2025</span></dd></div>
      <div><dt>Formation</dt><dd>Ingénieur Travaux Publics<br><span>ESTP – INPHB · 2022–2025 · accrédité CTI</span></dd></div>
      <div><dt>Chantier de référence</dt><dd>Ligne 1 du métro d’Abidjan<br><span>37,4 km de métro aérien</span></dd></div>
      <div><dt>Langues</dt><dd>Français, anglais<br><span>Langue maternelle · B1</span></dd></div>
    </dl>
  </div>
</section>

<section class="bloc">
  <div class="cadre">
    <div class="bloc-tete">
      <p class="etiquette">Positionnement</p>
      <h2>Entre le chantier et les outils numériques</h2>
      <p class="chapo">${esc(ID.presentation_courte)}</p>
    </div>
    <div class="axes">
      ${axes.map(([t, d, s], i) => `<article class="axe-carte">
        <span class="axe" aria-hidden="true">${String.fromCharCode(65 + i)}</span>
        <h3>${t}</h3>
        <p>${d}</p>
        <a class="lien-fleche" href="${lien(depth, `projets/${s}/`)}">Voir le projet lié<span class="sr"> : ${esc(projetParSlug[s]?.titre || '')}</span> ${icone('fleche')}</a>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="bloc bloc-gris">
  <div class="cadre">
    <div class="bloc-tete bloc-tete-ligne">
      <div><p class="etiquette">Portfolio</p><h2>Projets</h2></div>
      <a class="lien-fleche" href="${lien(depth, 'projets/')}">Tous les projets ${icone('fleche')}</a>
    </div>
    <div class="grille-projets">${PROJETS.map((p) => cartouche(p, depth)).join('')}</div>
  </div>
</section>

<section class="bloc">
  <div class="cadre parcours-court">
    <div class="bloc-tete">
      <p class="etiquette">Parcours</p>
      <h2>Du terrain aux méthodes</h2>
      <a class="lien-fleche" href="${lien(depth, 'parcours/')}">Parcours complet ${icone('fleche')}</a>
    </div>
    <ol class="frise frise-courte">
      ${site.experiences.map((e) => `<li><span class="frise-date mono">${esc(e.periode)}</span><strong>${esc(e.poste)}</strong><span>${esc(e.structure)}</span></li>`).join('')}
      <li><span class="frise-date mono">${esc(site.formations[0].periode)}</span><strong>${esc(site.formations[0].diplome)}</strong><span>ESTP – INPHB</span></li>
    </ol>
  </div>
</section>

${blocContact(depth)}`;
  pages.push({ fichier: 'index.html', html: page({ chemin: '', depth, titre: '', contenu, actif: '', jsonld }) });
}

function blocContact(depth) {
  return `<section class="bloc bloc-encre">
  <div class="cadre cta">
    <div>
      <p class="etiquette">Contact</p>
      <h2>Un projet, un poste, une collaboration ?</h2>
      <p>Je réponds aux recruteurs, bureaux d’études, entreprises de construction et porteurs de projets, en Côte d’Ivoire comme à l’international.</p>
    </div>
    <div class="actions">
      <a class="btn btn-clair" href="${lien(depth, 'contact/')}">${icone('mail')}Écrire un message</a>
      ${boutonCV(depth, 'btn btn-ligne-clair')}
    </div>
  </div>
</section>`;
}

// À propos
{
  const depth = 1;
  const A = site.a_propos;
  const contenu = `
${enTetePage(depth, 'À propos', 'Un ingénieur de chantier, outillé par le numérique', esc(A.intro))}
<section class="bloc bloc-serre">
  <div class="cadre deux-col">
    <div class="texte-long">
      ${A.paragraphes.map((t) => `<p>${esc(t)}</p>`).join('')}
    </div>
    <aside class="fiche" aria-label="Repères">
      <p class="etiquette">Repères</p>
      <dl class="cartouche cartouche-col">
        <div><dt>Titre</dt><dd>${esc(ID.titre)}</dd></div>
        <div><dt>Poste</dt><dd>${esc(site.experiences[0].poste)}, ${esc(site.experiences[0].structure)}</dd></div>
        <div><dt>Diplôme</dt><dd>ESTP – INPHB, 2025</dd></div>
        <div><dt>Basé à</dt><dd>${esc(ID.localisation)}</dd></div>
        <div><dt>Langues</dt><dd>${site.langues.map((l) => esc(l.langue)).join(', ')}</dd></div>
      </dl>
      ${boutonCV(depth)}
    </aside>
  </div>
</section>
<section class="bloc bloc-gris">
  <div class="cadre">
    <div class="bloc-tete"><p class="etiquette">Approche</p><h2>Ma façon de travailler</h2></div>
    <div class="axes">${A.approche.map((a, i) => `<article class="axe-carte"><span class="axe" aria-hidden="true">${i + 1}</span><h3>${esc(a.titre)}</h3><p>${esc(a.texte)}</p></article>`).join('')}</div>
  </div>
</section>
<section class="bloc">
  <div class="cadre deux-col">
    <div><p class="etiquette">Objectifs</p><h2>Où je vais</h2></div>
    <div class="texte-long"><p>${esc(A.objectifs)}</p>
      <p class="etiquette espace-haut">Centres d’intérêt</p>
      <ul class="puces">${site.interets.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>
  </div>
</section>
${blocContact(depth)}`;
  pages.push({ fichier: 'a-propos/index.html', html: page({ chemin: 'a-propos/', depth, titre: 'À propos', description: `Parcours, approche et objectifs de ${ID.nom_complet}, ${ID.titre}.`, contenu, actif: 'a-propos/' }) });
}

// Liste des projets
{
  const depth = 1;
  const contenu = `
${enTetePage(depth, 'Portfolio', 'Projets', 'Chaque projet est présenté comme une étude de cas : contexte, besoin, démarche, outils et livrables. Les schémas sont des illustrations originales ; aucun plan interne d’employeur n’est publié.')}
<section class="bloc bloc-serre">
  <div class="cadre grille-projets grille-projets-liste">${PROJETS.map((p) => cartouche(p, depth, 'h2')).join('')}</div>
</section>
${blocContact(depth)}`;
  pages.push({ fichier: 'projets/index.html', html: page({ chemin: 'projets/', depth, titre: 'Projets', description: `Études de cas de ${ID.nom_complet} : méthodes du viaduc du métro d’Abidjan, aide à la décision par Monte-Carlo, conception BIM d’une villa.`, contenu, actif: 'projets/' }) });
}

// Pages projet
PROJETS.forEach((p, idx) => {
  const depth = 2;
  const pr = prefix(depth);
  const prec = PROJETS[idx - 1];
  const suiv = PROJETS[idx + 1];
  const avecImage = p.livrables.filter((l) => l.fichier && existsSync(join(ROOT, 'public', l.fichier)));
  const contenu = `
<article class="etude">
  <section class="page-tete">
    <div class="cadre">
      <a class="retour" href="${lien(depth, 'projets/')}">${icone('retour')}Tous les projets</a>
      <p class="etiquette">${esc(p.categorie)}</p>
      <h1>${esc(p.titre)}</h1>
      <p class="chapo">${esc(p.resume)}</p>
      <dl class="cartouche cartouche-large">
        <div><dt>Structure</dt><dd>${esc(p.structure)}</dd></div>
        <div><dt>Rôle</dt><dd>${esc(p.role)}</dd></div>
        <div><dt>Période</dt><dd>${esc(p.periode)}</dd></div>
        <div><dt>Lieu</dt><dd>${esc(p.lieu)}</dd></div>
      </dl>
    </div>
  </section>
  <div class="cadre">
    <figure class="etude-figure">
      <img src="${pr}${p.illustration}" alt="${esc(p.illustration_legende)}" width="1200" height="640">
      <figcaption class="mono">${esc(p.illustration_legende)}</figcaption>
    </figure>
  </div>
  <div class="cadre etude-grille">
    <div class="etude-texte texte-long">${renduCorps(p.corps)}</div>
    <aside class="etude-cote">
      <div class="fiche">
        <p class="etiquette">Outils et méthodes</p>
        <ul class="tags">${p.outils.map((o) => `<li>${esc(o)}</li>`).join('')}</ul>
      </div>
      <div class="fiche">
        <p class="etiquette">Livrables réalisés</p>
        <ul class="livrables">${p.livrables.map((l) => `<li>${icone('doc')}<span>${esc(l.legende)}</span></li>`).join('')}</ul>
      </div>
    </aside>
  </div>
  ${avecImage.length ? `<section class="cadre galerie" aria-label="Visuels du projet"><p class="etiquette">Visuels</p><div class="galerie-grille">${avecImage.map((l) => `<figure><a href="${pr}${l.fichier}"><img src="${pr}${l.fichier}" alt="${esc(l.legende)}" loading="lazy"></a><figcaption>${esc(l.legende)}</figcaption></figure>`).join('')}</div></section>` : ''}
  <nav class="cadre etude-nav" aria-label="Autres projets">
    ${prec ? `<a class="etude-nav-lien" href="${lien(depth, `projets/${prec.slug}/`)}"><span class="etiquette">Projet précédent</span><strong>${esc(prec.titre_court || prec.titre)}</strong></a>` : '<span></span>'}
    ${suiv ? `<a class="etude-nav-lien etude-nav-suiv" href="${lien(depth, `projets/${suiv.slug}/`)}"><span class="etiquette">Projet suivant</span><strong>${esc(suiv.titre_court || suiv.titre)}</strong></a>` : `<a class="etude-nav-lien etude-nav-suiv" href="${lien(depth, 'contact/')}"><span class="etiquette">Et ensuite ?</span><strong>Parlons de votre projet</strong></a>`}
  </nav>
</article>`;
  pages.push({ fichier: `projets/${p.slug}/index.html`, html: page({ chemin: `projets/${p.slug}/`, depth, titre: p.titre, description: p.resume, contenu, actif: 'projets/', type: 'article' }) });
});

// Compétences
{
  const depth = 1;
  const contenu = `
${enTetePage(depth, 'Compétences', 'Ce que je sais faire, et où je l’ai fait', 'Pas de jauges ni de pourcentages : chaque compétence est reliée à une expérience ou à un projet. Celles indiquées « dans le CV » sont des outils que j’utilise sans projet détaillé ici pour l’instant.')}
<section class="bloc bloc-serre">
  <div class="cadre grille-comp">
    ${site.competences.map((cat, i) => `<section class="comp-cat" aria-labelledby="comp-${i}">
      <h2 id="comp-${i}"><span class="axe" aria-hidden="true">${String.fromCharCode(65 + i)}</span>${esc(cat.categorie)}</h2>
      <ul>${cat.items.map((it) => `<li><strong>${esc(it.nom)}</strong><span>${it.projet && projetParSlug[it.projet] ? `<a href="${lien(depth, `projets/${it.projet}/`)}">${esc(it.preuve)}</a>` : esc(it.preuve)}</span></li>`).join('')}</ul>
    </section>`).join('')}
  </div>
</section>
<section class="bloc bloc-gris">
  <div class="cadre grille-trois">
    <div><p class="etiquette">Langues</p><ul class="liste-simple">${site.langues.map((l) => `<li><strong>${esc(l.langue)}</strong><span>${esc(l.niveau)}</span></li>`).join('')}</ul></div>
    <div class="col-2"><p class="etiquette">Qualités professionnelles</p><ul class="tags">${site.qualites.map((q) => `<li>${esc(q)}</li>`).join('')}</ul></div>
  </div>
</section>
${blocContact(depth)}`;
  pages.push({ fichier: 'competences/index.html', html: page({ chemin: 'competences/', depth, titre: 'Compétences', description: `Compétences de ${ID.nom_complet} : méthodes, BIM (Revit, AutoCAD), calcul de structures, planification, Python, Monte-Carlo.`, contenu, actif: 'competences/' }) });
}

// Parcours
{
  const depth = 1;
  const contenu = `
${enTetePage(depth, 'Parcours', 'Expériences et formation', 'Du plus récent au plus ancien.')}
<section class="bloc bloc-serre">
  <div class="cadre deux-col deux-col-large">
    <div>
      <h2 class="titre-col">Expériences professionnelles</h2>
      <ol class="frise">
        ${site.experiences.map((e) => `<li>
          <span class="frise-date mono">${esc(e.periode)}</span>
          <h3>${esc(e.poste)}</h3>
          <p class="frise-lieu">${esc(e.structure)}${e.lieu ? ` · ${esc(e.lieu)}` : ''}</p>
          <ul>${e.missions.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
          ${e.projet && projetParSlug[e.projet] ? `<a class="lien-fleche" href="${lien(depth, `projets/${e.projet}/`)}">Projet associé ${icone('fleche')}</a>` : ''}
        </li>`).join('')}
      </ol>
    </div>
    <div>
      <h2 class="titre-col">Formation</h2>
      <ol class="frise">
        ${site.formations.map((f) => `<li>
          <span class="frise-date mono">${esc(f.periode)}</span>
          <h3>${esc(f.diplome)}</h3>
          ${f.detail ? `<p class="frise-detail">${esc(f.detail)}</p>` : ''}
          <p class="frise-lieu">${esc(f.ecole)}</p>
        </li>`).join('')}
      </ol>
    </div>
  </div>
</section>
${blocContact(depth)}`;
  pages.push({ fichier: 'parcours/index.html', html: page({ chemin: 'parcours/', depth, titre: 'Parcours', description: `Expériences (SICMA – Bouygues Travaux Publics, Smart Business Holding) et formation (ESTP – INPHB) de ${ID.nom_complet}.`, contenu, actif: 'parcours/' }) });
}

// CV
{
  const depth = 1;
  const src = `${prefix(depth)}${site.cv.fichier}`;
  const corps = CV_DISPO
    ? `<div class="actions">
        <a class="btn btn-plein" href="${src}" download="${NOM_CV}">${icone('telecharger')}Télécharger le CV (PDF)</a>
        <a class="btn btn-ligne" href="${src}" target="_blank" rel="noopener">${icone('doc')}Ouvrir dans un nouvel onglet</a>
      </div>
      <div class="cv-cadre"><iframe src="${src}#view=FitH" title="CV de ${esc(ID.nom_complet)} (PDF)" loading="lazy"></iframe></div>`
    : `<div class="avis">
        <p><strong>Le CV au format PDF sera bientôt disponible ici.</strong></p>
        <p>En attendant, vous pouvez me le demander par e-mail : je vous l’envoie directement.</p>
        <div class="actions"><a class="btn btn-plein" href="mailto:${esc(C.email)}?subject=${encodeURIComponent('Demande de CV')}">${icone('mail')}Demander mon CV</a></div>
      </div>`;
  const contenu = `
${enTetePage(depth, 'Curriculum vitae', 'CV', `Version ${esc(site.cv.mise_a_jour)}. Pour le détail des expériences, consultez aussi la page <a href="${lien(depth, 'parcours/')}">Parcours</a>.`)}
<section class="bloc bloc-serre"><div class="cadre">${corps}</div></section>`;
  pages.push({ fichier: 'cv/index.html', html: page({ chemin: 'cv/', depth, titre: 'CV', description: `CV de ${ID.nom_complet}, ${ID.titre}, consultable et téléchargeable en PDF.`, contenu, actif: 'cv/' }) });
}

// Contact
{
  const depth = 1;
  const modeForm = C.formulaire_endpoint ? 'service' : 'messagerie';
  const contenu = `
${enTetePage(depth, 'Contact', 'Travaillons ensemble', 'Poste, mission, collaboration ou simple échange : écrivez-moi, je réponds personnellement.')}
<section class="bloc bloc-serre">
  <div class="cadre deux-col deux-col-large">
    <div class="coordonnees">
      <div class="coord">
        <p class="etiquette">E-mail</p>
        <p class="coord-val"><a href="mailto:${esc(C.email)}" id="email-lien">${esc(C.email)}</a></p>
        <button class="btn btn-mini" type="button" data-copier="${esc(C.email)}" id="copier-email">${icone('copier')}<span>Copier l’adresse</span></button>
      </div>
      ${C.linkedin_url ? `<div class="coord"><p class="etiquette">LinkedIn</p><p class="coord-val"><a href="${esc(C.linkedin_url)}" target="_blank" rel="noopener">${icone('linkedin')}${esc(C.linkedin_nom)}</a></p></div>` : ''}
      ${C.afficher_telephone ? `<div class="coord"><p class="etiquette">Téléphone</p><p class="coord-val"><a href="tel:${esc(C.telephone.replace(/\s/g, ''))}">${esc(C.telephone)}</a></p></div>` : ''}
      <div class="coord"><p class="etiquette">Localisation</p><p class="coord-val">${icone('lieu')}${esc(ID.localisation)}</p></div>
      <div class="coord"><p class="etiquette">CV</p>${boutonCV(depth)}</div>
    </div>
    <form class="formulaire" id="formulaire-contact" data-mode="${modeForm}" data-email="${esc(C.email)}" ${C.formulaire_endpoint ? `data-endpoint="${esc(C.formulaire_endpoint)}"` : ''} novalidate>
      <h2>Envoyer un message</h2>
      <p class="form-note">${modeForm === 'service'
        ? 'Votre message m’est transmis directement.'
        : 'Ce formulaire prépare un e-mail dans votre messagerie. Vous le relisez et l’envoyez vous-même.'}</p>
      <div class="champ"><label for="f-nom">Nom</label><input id="f-nom" name="nom" type="text" autocomplete="name" required></div>
      <div class="champ"><label for="f-email">E-mail</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
      <div class="champ"><label for="f-sujet">Objet</label><input id="f-sujet" name="sujet" type="text" required></div>
      <div class="champ"><label for="f-message">Message</label><textarea id="f-message" name="message" rows="6" required></textarea></div>
      <input type="text" name="_gotcha" class="piege" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-plein" type="submit">${icone('mail')}${modeForm === 'service' ? 'Envoyer' : 'Préparer l’e-mail'}</button>
      <p class="form-etat" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>`;
  pages.push({ fichier: 'contact/index.html', html: page({ chemin: 'contact/', depth, titre: 'Contact', description: `Contacter ${ID.nom_complet}, ${ID.titre} à Abidjan.`, contenu, actif: 'contact/' }) });
}

// 404
{
  const contenu = `
<section class="page-tete page-404">
  <div class="cadre">
    <p class="etiquette mono">Erreur 404</p>
    <h1>Cette page n’existe pas sur le plan.</h1>
    <p class="chapo">Le lien est peut-être ancien ou mal saisi.</p>
    <div class="actions"><a class="btn btn-plein" href="${BASE}">Retour à l’accueil</a><a class="btn btn-ligne" href="${BASE}projets/">Voir les projets</a></div>
  </div>
</section>`;
  pages.push({ fichier: '404.html', html: page({ chemin: '404.html', depth: 0, titre: 'Page introuvable', contenu, is404: true }) });
}

// ---------- écriture ----------
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
cpSync(join(ROOT, 'public'), OUT, { recursive: true });
for (const { fichier, html } of pages) {
  const dest = join(OUT, fichier);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, html.replace(/\n{3,}/g, '\n\n'));
}
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE_URL ? `Sitemap: ${SITE_URL}${BASE}sitemap.xml\n` : ''}`);
if (SITE_URL) {
  const urls = pages.filter((p) => p.fichier !== '404.html').map((p) => `${SITE_URL}${BASE}${p.fichier.replace(/index\.html$/, '')}`);
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`);
}
writeFileSync(join(OUT, '.nojekyll'), '');
console.log(`✓ ${pages.length} pages générées dans ${OUT} · CV ${CV_DISPO ? 'présent' : 'absent (page CV en mode « demande par e-mail »)'} · URL du site ${SITE_URL || 'non renseignée'}`);
