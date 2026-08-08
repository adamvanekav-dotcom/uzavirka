import { story } from './story.js';

export function createUI(root, engine, audio) {
  let screen = 'title'; // title | game | ending
  let modal = null;
  let panel = null; // inventory | docs | phone | log | null

  engine.subscribe(() => render());

  function render() {
    const view = engine.getView();
    if (view.state.ending) {
      screen = 'ending';
      root.innerHTML = renderEnding(view);
      bindEnding();
      return;
    }
    if (screen === 'title') {
      root.innerHTML = renderTitle();
      bindTitle();
      return;
    }
    root.innerHTML = renderGame(view);
    bindGame(view);
    if (modal) {
      root.insertAdjacentHTML('beforeend', renderModal(modal));
      bindModal();
    }
  }

  function renderTitle() {
    const hasSave = engine.hasSave();
    return `
    <div class="shell title-shell">
      <div class="title-bg" aria-hidden="true">
        <div class="water-plane"></div>
        <div class="slide-silhouette"></div>
        <div class="title-grain"></div>
      </div>
      <header class="title-header">
        <p class="eyebrow">Narativní horror · ~30 minut · jedna noc</p>
        <h1 class="logo">${story.meta.title}</h1>
        <p class="tagline">${story.meta.subtitle}</p>
        <p class="blurb">${story.meta.blurb}</p>
      </header>
      <div class="title-actions">
        <button class="btn btn-primary" data-act="new">Nová směna</button>
        ${hasSave ? '<button class="btn btn-ghost" data-act="continue">Pokračovat</button>' : ''}
        <button class="btn btn-ghost" data-act="about">O hře</button>
      </div>
      <footer class="title-foot">
        <span>WASD nepotřebuješ. Čteš, zkoumáš, rozhoduješ.</span>
        <span>Ukládání do prohlížeče.</span>
      </footer>
    </div>`;
  }

  function bindTitle() {
    root.querySelector('[data-act="new"]')?.addEventListener('click', async () => {
      await audio.init();
      audio.resume();
      audio.blip('ui');
      engine.clearSave();
      engine.startFresh();
      screen = 'game';
      render();
    });
    root.querySelector('[data-act="continue"]')?.addEventListener('click', async () => {
      await audio.init();
      audio.resume();
      if (engine.continueSave()) {
        screen = 'game';
        render();
      }
    });
    root.querySelector('[data-act="about"]')?.addEventListener('click', () => {
      modal = {
        title: 'O hře',
        body: `UZÁVĚRKA je krátká příběhová hororová hra.
Hraješ za Elišku na poslední noční směně v aquaparku Atlantis Wave.

Žádné střílení. Žádné QTE.
Lokace, předměty, dokumenty, SMS, volby.
Tři konce podle toho, co odneseš — a co otevřeš dřív.

Obsah: smrt dítěte, utonutí, cover-up, psychologický horor.
Není založeno na skutečném aquaparku.`,
      };
      render();
    });
  }

  function renderGame(view) {
    const { location: loc, state, actions, exits, inventory, docs, phone, objective } = view;
    const tensionPct = Math.round(state.tension * 100);
    const timeLabel = formatGameTime(state);

    return `
    <div class="shell game-shell mood-${loc.mood || 'lobby'} tension-${tensionBand(state.tension)}">
      <div class="scene-art art-${loc.art || 'lobby'}" aria-hidden="true">
        <div class="scene-wash"></div>
        <div class="scene-ripple"></div>
      </div>

      <header class="topbar">
        <div class="topbar-left">
          <span class="rec"><i></i> NOC</span>
          <span class="clock">${timeLabel}</span>
          <span class="chapter">Kapitola ${state.chapter}</span>
        </div>
        <div class="topbar-right">
          <div class="tension" title="Napětí">
            <span>Chlor</span>
            <div class="tension-bar"><i style="width:${tensionPct}%"></i></div>
          </div>
          <button class="icon-btn" data-panel="phone" title="Telefon">
            SMS${state.phoneUnread ? `<em>${state.phoneUnread}</em>` : ''}
          </button>
          <button class="icon-btn" data-panel="docs" title="Dokumenty">Dok</button>
          <button class="icon-btn" data-panel="inventory" title="Inventář">Inv</button>
          <button class="icon-btn" data-act="save" title="Uložit">Uložit</button>
        </div>
      </header>

      <main class="stage">
        <div class="objective">${escapeHtml(objective.text)}</div>
        <h2 class="loc-title">${escapeHtml(loc.title)}</h2>
        <p class="loc-blurb">${escapeHtml(loc.blurb)}</p>
        <div class="prose">${formatProse(loc.prose)}</div>

        <section class="actions">
          <h3>Prozkoumat</h3>
          <div class="action-grid">
            ${actions.map((a) => `<button class="action" data-action="${a.id}">${escapeHtml(a.label)}</button>`).join('') || '<p class="muted">Tady už nic nového.</p>'}
          </div>
        </section>

        <section class="exits">
          <h3>Jít</h3>
          <div class="exit-grid">
            ${exits.map((e) => `<button class="exit" data-go="${e.to}">${escapeHtml(e.label)}</button>`).join('')}
          </div>
        </section>
      </main>

      ${panel ? renderPanel(panel, view) : ''}
      <div class="toast-log" aria-live="polite">${state.log[0] ? escapeHtml(state.log[0].text) : ''}</div>
    </div>`;
  }

  function renderPanel(kind, view) {
    if (kind === 'inventory') {
      const items = view.inventory;
      return `
      <aside class="side-panel">
        <header><h3>Inventář</h3><button data-close-panel>×</button></header>
        <ul class="item-list">
          ${items.length ? items.map((it) => `
            <li>
              <div>
                <strong>${escapeHtml(it.name)}</strong>
                <p>${escapeHtml(it.desc)}</p>
              </div>
              <button data-use="${it.id}">Použít</button>
            </li>`).join('') : '<li class="empty">Prázdné kapsy.</li>'}
        </ul>
      </aside>`;
    }
    if (kind === 'docs') {
      return `
      <aside class="side-panel">
        <header><h3>Dokumenty</h3><button data-close-panel>×</button></header>
        <ul class="item-list">
          ${view.docs.length ? view.docs.map((d) => `
            <li>
              <div><strong>${escapeHtml(d.title)}</strong></div>
              <button data-read="${d.id}">Číst</button>
            </li>`).join('') : '<li class="empty">Zatím nic.</li>'}
        </ul>
      </aside>`;
    }
    if (kind === 'phone') {
      return `
      <aside class="side-panel">
        <header><h3>Telefon</h3><button data-close-panel>×</button></header>
        <ul class="sms-list">
          ${view.phone.length ? view.phone.map((m) => `
            <li>
              <span class="from">${escapeHtml(m.from)}</span>
              <p>${escapeHtml(m.body)}</p>
            </li>`).join('') : '<li class="empty">Žádné zprávy.</li>'}
        </ul>
      </aside>`;
    }
    return '';
  }

  function bindGame(view) {
    root.querySelectorAll('[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.resume();
        const result = engine.doAction(btn.getAttribute('data-action'));
        if (result) openResult(result);
      });
    });
    root.querySelectorAll('[data-go]').forEach((btn) => {
      btn.addEventListener('click', () => {
        audio.resume();
        panel = null;
        modal = null;
        engine.go(btn.getAttribute('data-go'));
      });
    });
    root.querySelectorAll('[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.getAttribute('data-panel');
        panel = panel === next ? null : next;
        if (panel === 'phone') engine.markPhoneRead(true);
        render();
      });
    });
    root.querySelector('[data-close-panel]')?.addEventListener('click', () => {
      panel = null;
      render();
    });
    root.querySelector('[data-act="save"]')?.addEventListener('click', () => {
      engine.save();
      modal = { title: 'Uloženo', body: 'Postup je v prohlížeči. Můžeš zavřít okno a vrátit se.' };
      render();
    });
    root.querySelectorAll('[data-use]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const result = engine.useItem(btn.getAttribute('data-use'));
        if (result) openResult(result);
      });
    });
    root.querySelectorAll('[data-read]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const doc = story.documents[btn.getAttribute('data-read')];
        if (!doc) return;
        modal = { title: doc.title, body: doc.body, pre: true };
        render();
      });
    });
  }

  function openResult(result) {
    if (result.ending && !result.choice) {
      // ending handled by subscribe
      return;
    }
    if (result.promptCode) {
      modal = {
        title: result.title,
        body: result.body,
        code: true,
        codeAnswer: result.codeAnswer,
        onCodeOk: result.onCodeOk,
        onCodeBad: result.onCodeBad,
      };
      render();
      return;
    }
    if (result.choice) {
      modal = {
        title: result.title,
        body: result.body,
        choices: result.choice,
      };
      render();
      return;
    }
    modal = {
      title: result.title || '…',
      body: result.body || '',
    };
    render();
  }

  function renderModal(m) {
    return `
    <div class="modal-backdrop">
      <div class="modal" role="dialog" aria-modal="true">
        <h3>${escapeHtml(m.title)}</h3>
        <div class="modal-body ${m.pre ? 'pre' : ''}">${m.pre ? escapeHtml(m.body) : formatProse(m.body)}</div>
        ${m.code ? `
          <form class="code-form">
            <input maxlength="8" inputmode="numeric" placeholder="••••" autocomplete="off" />
            <button class="btn btn-primary" type="submit">Potvrdit</button>
          </form>` : ''}
        ${m.choices ? `
          <div class="choice-list">
            ${m.choices.map((c, i) => `<button class="btn btn-ghost" data-choice="${i}">${escapeHtml(c.label)}</button>`).join('')}
          </div>` : ''}
        ${!m.code && !m.choices ? '<button class="btn btn-primary" data-close-modal>Pokračovat</button>' : ''}
        ${m.code || m.choices ? '' : ''}
      </div>
    </div>`;
  }

  function bindModal() {
    root.querySelector('[data-close-modal]')?.addEventListener('click', () => {
      modal = null;
      render();
    });
    root.querySelector('.code-form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const input = root.querySelector('.code-form input');
      const val = (input?.value || '').trim();
      const ok = val === modal.codeAnswer;
      const payload = ok ? modal.onCodeOk : modal.onCodeBad;
      modal = null;
      if (ok && payload?.flag) engine.setFlag(payload.flag);
      if (payload?.tension) engine.raiseTension(payload.tension);
      if (payload?.log) engine._pushLog(payload.log);
      if (payload?.sfx) audio.blip(payload.sfx);
      engine.emit();
      openResult(payload);
    });
    root.querySelectorAll('[data-choice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const choice = modal.choices[Number(btn.getAttribute('data-choice'))];
        modal = null;
        if (choice.ending) {
          engine.triggerEnding(choice.ending);
          return;
        }
        if (choice.go) {
          engine.go(choice.go);
          return;
        }
        render();
      });
    });
  }

  function renderEnding(view) {
    const ending = story.endings[view.state.ending];
    return `
    <div class="shell ending-shell ending-${ending.id}">
      <div class="ending-bg"></div>
      <article class="ending-card">
        <p class="eyebrow">Konec</p>
        <h1>${escapeHtml(ending.title)}</h1>
        <p class="tagline">${escapeHtml(ending.subtitle)}</p>
        <div class="prose">${formatProse(ending.body)}</div>
        <p class="epilogue">${escapeHtml(ending.epilogue)}</p>
        <div class="ending-actions">
          <button class="btn btn-primary" data-act="again">Hrát znovu</button>
          <button class="btn btn-ghost" data-act="title">Titulky</button>
        </div>
      </article>
    </div>`;
  }

  function bindEnding() {
    root.querySelector('[data-act="again"]')?.addEventListener('click', () => {
      engine.clearSave();
      engine.startFresh();
      screen = 'game';
      modal = null;
      panel = null;
      render();
    });
    root.querySelector('[data-act="title"]')?.addEventListener('click', () => {
      screen = 'title';
      modal = null;
      panel = null;
      render();
    });
  }

  // First paint
  render();

  return { render };
}

function tensionBand(t) {
  if (t < 0.35) return 'low';
  if (t < 0.65) return 'mid';
  return 'high';
}

function formatGameTime(state) {
  const base = new Date();
  base.setHours(23, 12, 0, 0);
  const elapsedMin = Math.floor((Date.now() - state.startedAt) / 60000);
  base.setMinutes(base.getMinutes() + elapsedMin);
  const h = String(base.getHours()).padStart(2, '0');
  const m = String(base.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatProse(text = '') {
  return String(text)
    .trim()
    .split(/\n\n+/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}
