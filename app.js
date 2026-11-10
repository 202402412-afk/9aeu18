const shelf = document.querySelector('.shelf');
const detail = document.querySelector('.detail');
const books = document.querySelector('#books');
const ticks = document.querySelector('.ticks');
const back = document.querySelector('.back');
const dialog = document.querySelector('.index-dialog');
const index = dialog.querySelector('.index-list');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const assetPath = path => typeof embeddedAsset === 'function' ? embeddedAsset(path) : path;
const pagePath = page => assetPath(`assets/page-${page}.webp`);
const projectHash = project => `#work/${project.id}`;
const number = value => String(value).padStart(2, '0');
const labels = new Map(projects.map((project, i) => [project.id, number(i + 1)]));
const links = new Map();
const markers = new Map();
let selected = null;
let shelfScroll = 0;
let fromShelf = false;
let updateQueued = false;
let cancelFlight = () => {};

history.scrollRestoration = 'manual';
document.querySelector('#total').textContent = number(projects.length);

// Invert the map from a unit rectangle to the four source corners, so the
// image projects onto a flat face without the surrounding mockup.
function textureMatrix(corners) {
  const [[x0,y0], [x1,y1], [x2,y2], [x3,y3]] = corners.map(([x,y]) => [x / 580, y / 858]);
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  const scale = a * e - b * d;
  return [
    e - y0 * h, x0 * h - b, b * y0 - x0 * e,
    y0 * g - d, a - x0 * g, x0 * d - a * y0,
    d * h - e * g, b * g - a * h,
  ].map(value => value / scale);
}

const textureObserver = new ResizeObserver(entries => {
  for (const { target, contentRect: { width, height } } of entries) {
    if (!width || !height) continue;
    const [a, b, c, d, e, f, g, h] = target.matrix;
    const matrix = [
      a * width / 580, d * height / 580, 0, g / 580,
      b * width / 858, e * height / 858, 0, h / 858,
      0, 0, 1, 0,
      c * width, f * height, 0, 1,
    ];
    target.firstElementChild.style.transform = `matrix3d(${matrix.join(',')})`;
  }
});

function artwork(source, priority) {
  if (!source) return '';
  return `<span class="texture" data-corners="${source.corners.flat().join(',')}">
    <img src="${source.file ? assetPath(source.file) : pagePath(source.page)}" alt="" ${priority ? 'fetchpriority="high"' : ''} decoding="async">
  </span>`;
}

function trackTextures(container) {
  for (const texture of container.querySelectorAll('.texture')) {
    const points = texture.dataset.corners.split(',').map(Number);
    texture.matrix = textureMatrix([0,2,4,6].map(i => points.slice(i,i + 2)));
    textureObserver.observe(texture);
    const image = texture.firstElementChild;
    const hideFailedTexture = () => { texture.hidden = true; };
    image.addEventListener('error', hideFailedTexture, { once: true });
    if (image.complete && !image.naturalWidth) hideFailedTexture();
  }
}

function bookMarkup(project, detailView = false) {
  const jacket = jackets[project.id];
  const [width, height] = jacket.folded ?? jacket.size ?? [160, 230];
  const length = Math.max(.74, Math.min(1, height / 260));
  const ratio = jacket.aspect ?? width / height;
  const thickness = Math.min(.12, jacket.thicknessRatio ?? (jacket.thickness ?? 10) / (jacket.unit === 'px' ? 230 : height));
  return `
    <span class="book-shadow" style="--length:${length}" aria-hidden="true"></span>
    <span class="book" aria-hidden="true" style="--length:${length};--min-thickness:${jacket.thicknessRatio ? 4 : jacket.spine ? 9 : 16}px;--ratio:${ratio};--thickness:${thickness};--jacket:${jacket.color ?? project.color};--spine-ink:${jacket.ink ?? project.ink}">
      <span class="face cover">
        <span class="cover-label"><small>${labels.get(project.id)} / ${project.category}</small><strong>${project.title}</strong></span>
        ${artwork(jacket.front, detailView)}
      </span>
      <span class="face rear">${artwork(jacket.rear)}</span>
      <span class="face spine">
        <span class="spine-number">${labels.get(project.id)}</span><span class="spine-title">${project.title}</span>
        ${artwork(jacket.spine, detailView)}
      </span>
      <span class="face edge-long paper"></span>
      <span class="face edge-left paper"></span>
      <span class="face edge-right paper"></span>
    </span>`;
}

for (const project of projects) {
  const link = document.createElement('a');
  link.id = `book-${project.id}`;
  link.className = 'book-link';
  link.href = projectHash(project);
  link.title = project.title;
  link.setAttribute('aria-label', `${project.title} — ${project.category}`);
  link.innerHTML = bookMarkup(project);
  books.append(link);
  trackTextures(link);
  links.set(project.id, link);

  const tick = document.createElement('a');
  tick.className = 'tick';
  tick.href = `#${link.id}`;
  tick.title = project.title;
  tick.setAttribute('aria-label', `${labels.get(project.id)}. ${project.title}`);
  ticks.append(tick);
  markers.set(project.id, tick);

  const indexLink = document.createElement('a');
  indexLink.className = 'index-link';
  indexLink.href = projectHash(project);
  indexLink.innerHTML = `<small>${labels.get(project.id)}</small><strong>${project.title}</strong><small>${project.category}</small>`;
  index.append(indexLink);

  link.addEventListener('click', event => follow(event, () => openProject(project, true)));
  indexLink.addEventListener('click', event => follow(event, () => {
    dialog.close();
    openProject(project, false);
  }));
  tick.addEventListener('click', event => follow(event, () => {
    if (selected) openProject(project, false);
    else link.scrollIntoView({ block: 'center', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }));
}

function follow(event, action) {
  if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  action();
}

function updateMarker(project) {
  for (const [id, marker] of markers) {
    if (id === project.id) marker.setAttribute('aria-current', 'true');
    else marker.removeAttribute('aria-current');
  }
}

function updateShelf() {
  updateQueued = false;
  if (selected) return;
  let nearest = projects[0];
  let smallest = Infinity;
  const center = innerHeight * .48;
  const positions = projects.map(project => {
    const link = links.get(project.id);
    const box = link.getBoundingClientRect();
    return [project, link, box.top + box.height / 2 - center];
  });
  for (const [project, link, offset] of positions) {
    if (Math.abs(offset) < smallest) {
      smallest = Math.abs(offset);
      nearest = project;
    }
    const normalized = Math.max(-1, Math.min(1, offset / (innerHeight * .52)));
    link.style.setProperty('--angle', `${89 - normalized * 9}deg`);
  }
  updateMarker(nearest);
}

function queueShelfUpdate() {
  if (updateQueued || selected) return;
  updateQueued = true;
  requestAnimationFrame(updateShelf);
}

function pose(stage) {
  if (!stage) return null;
  const book = stage.querySelector('.book');
  const rect = stage.getBoundingClientRect();
  const style = getComputedStyle(book);
  return { book, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2,
    width: parseFloat(style.width), thickness: style.getPropertyValue('--t'), transform: style.transform };
}

function animateBook(start, finish, opening) {
  if (!start || !finish || reducedMotion.matches) return;
  if (Math.max(start.y, finish.y) < 0 || Math.min(start.y, finish.y) > innerHeight) return;
  const flight = document.createElement('div');
  flight.className = 'flight';
  flight.setAttribute('aria-hidden', 'true');
  const replica = start.book.cloneNode(true);
  replica.style.setProperty('--w', `${start.width}px`);
  replica.style.setProperty('--t', start.thickness);
  flight.append(replica);
  document.body.append(flight);
  finish.book.classList.add('in-flight');

  const duration = opening ? 760 : 580;
  const options = { duration, easing: 'cubic-bezier(.24,.74,.19,1)', fill: 'both' };
  const midTransform = 'rotateZ(27deg) rotateX(43deg) rotateY(-13deg) scale(1.07)';
  const movement = flight.animate([
    { transform: `translate(${start.x}px, ${start.y}px)` },
    { transform: `translate(${finish.x}px, ${finish.y}px)` },
  ], options);
  replica.animate([
    { transform: start.transform },
    { transform: midTransform, offset: .43 },
    { transform: `scale(${finish.width / start.width}) ${finish.transform}` },
  ], options);

  cancelFlight = () => {
    flight.remove();
    finish.book.classList.remove('in-flight');
    cancelFlight = () => {};
  };
  movement.onfinish = cancelFlight;
}

function renderDetail(project) {
  const jacket = jackets[project.id];
  for (const texture of detail.querySelectorAll('.texture')) textureObserver.unobserve(texture);
  const format = jacket.size ? `${jacket.size.join(' × ')} ${jacket.unit ?? 'mm'}` : '';
  detail.innerHTML = `
    <div class="detail-visual">
      <div class="detail-stage" role="img" aria-label="${project.title} ${jacket.front ? '프로젝트 표지' : '작업 제목'}">${bookMarkup(project, true)}</div>
    </div>
    <article class="detail-copy">
      <p class="kicker">${labels.get(project.id)} / ${number(projects.length)}　·　${project.category}</p>
      <h1 id="detail-title" tabindex="-1">${project.title}</h1>
      ${project.subtitle ? `<p class="subtitle">${project.subtitle}</p>` : ''}
      <p class="description">${project.description}</p>
      ${format ? `<p class="format"><span>원본 규격</span> ${format}${jacket.folded ? ' · 3단 접지' : ''}</p>` : ''}
      ${jacket.partial ? '<p class="art-note">포트폴리오에서 확인되는 부분을 표지에 사용했습니다.</p>' : ''}
      ${jacket.front ? '' : '<p class="art-note">표지 원본이 준비되면 이 자리에 표시됩니다.</p>'}
      <a class="jump" href="#project-pages">작업 이미지 보기 <span aria-hidden="true">↓</span></a>
      <section class="gallery" id="project-pages" aria-labelledby="gallery-title">
        <h2 id="gallery-title" tabindex="-1">작업 이미지 · ${project.pages.length}장</h2>
        ${project.pages.map((page, i) => `
          <figure><a href="${pagePath(page)}" target="_blank" rel="noopener" aria-label="${project.title} 작업 이미지 ${i + 1}, 새 탭에서 크게 보기">
            <img src="${pagePath(page)}" width="1317" height="1950" alt="${project.title} 포트폴리오 페이지 ${i + 1}" loading="lazy" decoding="async">
          </a></figure>`).join('')}
      </section>
      <footer class="detail-footer"><a href="#works">← 서가로 돌아가기</a></footer>
    </article>`;
  trackTextures(detail);
  detail.querySelector('.jump').addEventListener('click', event => follow(event, () => {
    detail.querySelector('#gallery-title').focus({ preventScroll: true });
    detail.querySelector('.gallery').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }));
  detail.querySelector('.detail-footer a').addEventListener('click', event => follow(event, returnToShelf));
}

function showProject(project, animate) {
  cancelFlight();
  const start = animate && !selected ? pose(links.get(project.id)) : null;
  if (!selected) shelfScroll = scrollY;
  selected = project;
  renderDetail(project);
  shelf.hidden = true;
  detail.hidden = false;
  back.hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' });
  updateMarker(project);
  document.title = `${project.title} — 김가을`;
  detail.querySelector('h1').focus({ preventScroll: true });
  if (start) {
    animateBook(start, pose(detail.querySelector('.detail-stage')), true);
    if (!reducedMotion.matches) detail.querySelector('.detail-copy').animate(
      [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { delay: 245, duration: 470, easing: 'ease-out', fill: 'backwards' }
    );
  }
}

function openProject(project, animate) {
  if (selected === project) return;
  if (!selected) {
    history.replaceState({ shelfScroll: scrollY }, '');
    history.pushState({ fromShelf: true }, '', projectHash(project));
  } else {
    history.replaceState({ fromShelf }, '', projectHash(project));
  }
  fromShelf = Boolean(history.state?.fromShelf);
  showProject(project, animate);
}

function showShelf(restore = shelfScroll) {
  cancelFlight();
  const previous = selected;
  const start = previous ? pose(detail.querySelector('.detail-stage')) : null;
  selected = null;
  shelf.hidden = false;
  detail.hidden = true;
  back.hidden = true;
  document.title = '김가을 — 편집 디자인 포트폴리오';
  window.scrollTo({ top: restore, behavior: 'instant' });
  updateShelf();
  if (previous) {
    const link = links.get(previous.id);
    const rect = link.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight) {
      link.focus({ preventScroll: true });
      animateBook(start, pose(link), false);
    } else {
      document.querySelector('.identity').focus({ preventScroll: true });
    }
  }
}

function returnToShelf() {
  if (selected && fromShelf) history.back();
  else if (selected) {
    history.replaceState(null, '', '#works');
    showShelf();
  } else {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
}

function route() {
  fromShelf = Boolean(history.state?.fromShelf);
  const project = projects.find(item => projectHash(item) === location.hash);
  if (project && selected !== project) showProject(project, false);
  else if (!project) showShelf(history.state?.shelfScroll ?? shelfScroll);
}

for (const link of [back, document.querySelector('.identity'), document.querySelector('#top')]) {
  link.addEventListener('click', event => follow(event, returnToShelf));
}
document.querySelector('.browse').addEventListener('click', event => follow(event, () => {
  document.querySelector('#shelf-title').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
}));
document.querySelector('.index-button').addEventListener('click', () => dialog.showModal());
dialog.querySelector('.close-index').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right) dialog.close();
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && selected && !dialog.open && !event.defaultPrevented) returnToShelf();
});
window.addEventListener('popstate', route);
window.addEventListener('scroll', queueShelfUpdate, { passive: true });
window.addEventListener('resize', queueShelfUpdate);
route();
