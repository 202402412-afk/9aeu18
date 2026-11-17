// Renders a project's detail page from `details` and drives its scroll motion.
const story = (() => {
  const esc = text => String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const src = name => (typeof embeddedAsset === 'function' ? embeddedAsset : p => p)(`assets/d/${name}.webp`);
  const img = (name, alt = '', extra = '') => {
    const [w, h] = dsizes[name] ?? [1, 1];
    return `<img src="${src(name)}" width="${w}" height="${h}" alt="${esc(alt)}" loading="lazy" decoding="async" ${extra}>`;
  };
  const paras = list => (list ?? []).map(p => `<p>${p}</p>`).join('');
  const cap = text => text ? `<figcaption>${esc(text)}</figcaption>` : '';
  const two = n => String(n).padStart(2, '0');

  const toolNames = { Id: 'InDesign', Ai: 'Illustrator', Ps: 'Photoshop', Pr: 'Premiere Pro', Procreate: 'Procreate' };

  function head(project, d, label, total, book) {
    const lead = d.lead?.length ? d.lead : [project.description];
    const meta = (d.meta ?? []).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
    const tools = d.tools?.length ? `<div class="meta-row"><dt>Used program</dt><dd class="tools">${d.tools.map(t => `<span class="tool tool-${t.toLowerCase()}" title="${toolNames[t] ?? t}">${t === 'Procreate' ? 'Pc' : t}</span>`).join('')}</dd></div>` : '';
    const fonts = d.fonts?.length ? `<div class="meta-row"><dt>Used font</dt><dd class="fonts">${d.fonts.map(f => `<span>${esc(f)}</span>`).join('')}</dd></div>` : '';
    const palette = d.palette?.length ? `<div class="meta-row"><dt>Color palette</dt><dd class="palette">${d.palette.map((c, i) => `<span style="--c:${c};--i:${i}" title="${c}"><i>${c}</i></span>`).join('')}</dd></div>` : '';
    const notes = (d.notes ?? []).map(([h, p]) => `<aside class="note"><strong>${esc(h)}</strong><p>${p}</p></aside>`).join('');
    return `
      <div class="detail-head">
        <div class="detail-visual">${book}</div>
        <article class="detail-copy">
          <p class="kicker">${label} / ${total}　·　${esc(project.category)}</p>
          <p class="eyebrow">${esc(d.eyebrow ?? '')}</p>
          <h1 id="detail-title" tabindex="-1">${esc(d.title ?? project.title)}</h1>
          ${project.subtitle && !(d.title ?? "").includes(project.subtitle) ? `<p class="subtitle">${esc(project.subtitle)}</p>` : ''}
          <div class="lead">${paras(lead)}</div>
          ${notes}
          ${meta || tools || fonts || palette ? `<dl class="meta">${meta}${tools}${fonts}${palette}</dl>` : ''}
          ${d.sections?.length || d.hero ? '<a class="jump" href="#story">작업 과정 보기 <span aria-hidden="true">↓</span></a>' : ''}
        </article>
      </div>`;
  }

  function showcase(d) {
    if (!d.hero) return '';
    const [w, h] = dsizes[d.hero];
    if (d.heroFx === 'stack') {
      return `<section class="showcase showcase-object" data-reveal>${img(d.hero, '쌓여 있는 학생들의 완성작 책들')}</section>`;
    }
    return `<section class="showcase" data-scroll style="--ratio:${w}/${h}">
      <div class="showcase-frame"><div class="showcase-img${d.heroFx === 'drift' ? ' drift' : ''}">${img(d.hero, `${d.title} 대표 이미지`, 'fetchpriority="high"')}</div></div>
    </section>`;
  }

  const render = {
    text: s => `<section class="s-text" data-reveal>
      ${s.h ? `<h2>${esc(s.h)}</h2>` : ''}
      <div class="s-body">${paras(s.p)}</div>
      ${s.aside ? `<aside class="point"><small>point</small><strong>${esc(s.aside[0])}</strong>${s.aside.slice(1).map(a => `<span>${esc(a)}</span>`).join('')}</aside>` : ''}
    </section>`,

    fig: s => `<figure class="s-fig w-${s.w ?? 'mid'} fx-${s.fx ?? 'rise'}" data-reveal ${s.bg ? `style="--bg:${s.bg}"` : ''}>
      <div class="fig-media">${img(s.img, s.cap ?? '')}</div>${cap(s.cap)}</figure>`,

    duo: s => `<div class="s-duo${s.fx === 'float' ? ' float' : ''}" data-reveal>${s.imgs.map((n, i) =>
      `<figure style="--i:${i}"><div class="fig-media">${img(n, s.caps?.[i] ?? '')}</div>${cap(s.caps?.[i])}</figure>`).join('')}</div>`,

    split: s => {
      const media = s.imgs ?? [s.img];
      return `<section class="s-split${s.flip ? ' flip' : ''}${s.small ? ' small' : ''}" data-reveal>
        <div class="split-text">${s.h ? `<h2>${esc(s.h)}</h2>` : ''}${paras(s.p)}</div>
        <figure class="split-media fx-${s.fx ?? 'rise'}">${media.map((n, i) => `<div class="fig-media" style="--i:${i}">${img(n, s.cap ?? '')}</div>`).join('')}${cap(s.cap)}</figure>
      </section>`;
    },

    chapters: s => `<section class="s-chapters">
      <div class="s-text" data-reveal><h2>${esc(s.h)}</h2><div class="s-body"><p>${s.intro}</p></div></div>
      ${s.items.map((c, i) => `<article class="chapter" data-reveal>
        <div class="chapter-copy"><span class="chapter-no">Chapter ${two(i + 1)}</span><h3>${esc(c.h)}</h3><p>${c.p}</p></div>
        <div class="posters" style="--n:${c.imgs.length}">${c.imgs.map((n, j) => { const o = j - (c.imgs.length - 1) / 2; return `<div class="poster" style="--j:${j};--o:${o};--a:${Math.abs(o)}">${img(n, '영화 포스터')}</div>`; }).join('')}</div>
      </article>`).join('')}
      <div class="s-text" data-reveal><div class="s-body"><p>${s.outro}</p></div></div>
    </section>`,

    swatches: s => `<section class="s-swatches">${s.items.map(it => `<figure class="swatch" data-reveal style="--c:${it.color}">
      <div class="swatch-chip"><span>${it.color}</span></div>
      <div class="fig-media">${img(it.img, it.cap)}</div>${cap(it.cap)}</figure>`).join('')}</section>`,

    sticky: s => `<section class="s-sticky" data-sticky style="--n:${s.items.length}">
      <div class="sticky-frame">
        <ol class="sticky-list">${s.items.map((it, i) => `<li data-i="${i}"><span>${two(i + 1)}</span>${esc(it.h)}</li>`).join('')}</ol>
        <div class="sticky-media">${s.items.map((it, i) => `<div class="sticky-slide" data-i="${i}">${img(it.img, it.h)}</div>`).join('')}</div>
      </div>
    </section>`,

    quote: s => {
      let n = 0;
      const lines = s.p.split('\n').map(line => `<span class="q-line">${line.split(' ').map(w => `<span style="--w:${n++}">${w}</span>`).join(' ')}</span>`);
      return `<blockquote class="s-quote${s.lines ? ' lined' : ''}" data-reveal><p>${lines.join(' ')}</p></blockquote>`;
    },

    skills: s => `<section class="s-skills" data-reveal>${s.items.map(([h, p], i) =>
      `<div class="skill" style="--i:${i}"><span>${two(i + 1)}</span><strong>${esc(h)}</strong><p>${esc(p)}</p></div>`).join('')}</section>`,

    pop: s => `<section class="s-pop" data-reveal style="--bg:${s.bg ?? '#f6f5f2'}">${s.imgs.map((n, i) =>
      `<div class="pop-item" style="--i:${i}">${img(n, '밀리맨 캐릭터 바리에이션')}</div>`).join('')}</section>`,

    steps: s => `<ol class="s-steps">${s.items.map(([h, p], i) => `<li data-reveal style="--i:${i}">
      <span class="step-no">${two(i + 1)}</span><div><h3>${esc(h)} 단계</h3><p>${esc(p)}</p></div></li>`).join('')}</ol>`,

    visits: s => `<section class="s-visits">${s.items.map((v, i) => `<article class="visit${v.imgs.length ? '' : ' empty'}" data-reveal style="--i:${i}">
      <div class="visit-photos">${v.imgs.map((n, j) => `<div class="visit-photo" style="--j:${j}">${img(n, v.h)}</div>`).join('') || '<span class="visit-blank">사진 준비 중</span>'}</div>
      <p>${esc(v.p)}</p><h3>${esc(v.h)}</h3></article>`).join('')}</section>`,

    hanja: s => `<section class="s-hanja" data-reveal aria-label="사람 人에서 뻗어 나온 여섯 개의 한자">
      <div class="hj root"><b>${s.root[0]}</b><small>${s.root[1]}</small></div>
      <span class="hj-line" aria-hidden="true"></span>
      ${s.chars.map(([c, r], i) => `<div class="hj" style="--i:${i}"><b>${c}</b><small>${r}</small></div>`).join('')}</section>`,

    walk: s => `<figure class="s-walk" data-reveal><div class="walkers">${s.imgs.map((n, i) =>
      `<div class="walker" style="--i:${i}">${img(n, '표지에 사용한 학생 인물 사진')}</div>`).join('')}</div>${cap(s.cap)}</figure>`,

    specs: s => `<section class="s-specs">${s.items.map((it, i) => `<article class="spec" data-reveal style="--i:${i}">
      <div class="spec-visual">${it.swatch ? `<span class="spec-swatch" style="--c:${it.swatch}">${it.swatch}</span>`
        : it.type ? `<span class="spec-type">가나다 Aa 作</span>` : img(it.img, it.h)}</div>
      <h3>${esc(it.h)}</h3><p>${esc(it.p)}</p></article>`).join('')}</section>`,

    compare: s => `<section class="s-compare" data-reveal>${s.imgs.map((n, i) =>
      `<figure style="--i:${i}"><div class="fig-media">${img(n, s.caps[i])}</div>${cap(s.caps[i])}</figure>`).join('')}</section>`,

    banners: s => `<section class="s-banners" data-reveal>${s.imgs.map((n, i) =>
      `<div class="banner" style="--i:${i}">${img(n, '지은에게 북광고 배너')}</div>`).join('')}</section>`,

    closing: s => `<section class="s-closing" data-scroll style="--bg:${s.bg};--ink:${s.ink}">
      <div class="closing-inner"><p data-reveal>${esc(s.p)}</p><div class="closing-img">${img(s.img, '')}</div></div>
    </section>`,
  };

  function pages(project, pagePath) {
    return `<details class="originals">
      <summary>원본 포트폴리오 페이지 <span>${project.pages.length}장</span></summary>
      <div class="originals-grid">${project.pages.map((page, i) => `<a href="${pagePath(page)}" target="_blank" rel="noopener" aria-label="${esc(project.title)} 원본 페이지 ${i + 1}, 새 탭에서 보기">
        <img src="${pagePath(page)}" width="1318" height="1950" alt="" loading="lazy" decoding="async"></a>`).join('')}</div>
    </details>`;
  }

  function markup(project, { label, total, book, pagePath, prev, next }) {
    const d = details[project.id] ?? { sections: [] };
    const color = project.color;
    return `
      ${head(project, d, label, total, book)}
      <div class="story" id="story" style="--accent:${color}">
        ${showcase(d)}
        ${(d.sections ?? []).map(s => render[s.t]?.(s) ?? '').join('')}
        <footer class="story-end">
          ${pages(project, pagePath)}
          <nav class="pager" aria-label="다른 작업">
            <a href="#work/${prev.id}" data-id="${prev.id}"><small>← 이전 작업</small><strong>${esc(prev.title)}</strong></a>
            <a href="#works" class="pager-home">서가로 돌아가기</a>
            <a href="#work/${next.id}" data-id="${next.id}"><small>다음 작업 →</small><strong>${esc(next.title)}</strong></a>
          </nav>
        </footer>
      </div>`;
  }

  // ---- motion ----
  let observer = null;
  let scrollers = [];
  let stickies = [];
  let queued = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  function frame() {
    queued = false;
    const vh = innerHeight;
    for (const el of scrollers) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
      el.style.setProperty('--p', p.toFixed(4));
    }
    for (const el of stickies) {
      const r = el.getBoundingClientRect();
      const span = r.height - vh;
      const p = Math.min(.999, Math.max(0, -r.top / Math.max(1, span)));
      const n = Number(el.style.getPropertyValue('--n'));
      const active = String(Math.floor(p * n));
      if (el.dataset.active !== active) {
        el.dataset.active = active;
        for (const node of el.querySelectorAll('[data-i]')) node.classList.toggle('on', node.dataset.i === active);
      }
    }
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(frame); } };

  function activate(root) {
    observer?.disconnect();
    const items = root.querySelectorAll('[data-reveal]');
    if (reduced.matches || !('IntersectionObserver' in window)) {
      items.forEach(el => el.classList.add('is-in'));
    } else {
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      }, { rootMargin: '0px 0px -12% 0px', threshold: .12 });
      items.forEach(el => observer.observe(el));
    }
    scrollers = [...root.querySelectorAll('[data-scroll]')];
    stickies = [...root.querySelectorAll('[data-sticky]')];
    queue();
  }

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);

  return { markup, activate };
})();
