import { story } from './story.js';

export function createUI(root, engine, audio, api = {}) {
  let screen = 'title';
  let modal = null;
  let panel = null;
  let hud3d = { battery: 100, stamina: 100, flashlightOn: true, prompt: null };

  engine.subscribe(() => {
    if (screen === 'game') renderGame();
    else if (screen === 'ending' || engine.state.ending) {
      screen = 'ending';
      renderEnding();
    } else if (screen === 'title') renderTitle();
  });

  function render() {
    if (engine.state.ending) {
      screen = 'ending';
      api.getGame3D?.()?.stop();
      renderEnding();
      return;
    }
    if (screen === 'title') renderTitle();
    else if (screen === 'game') renderGame();
    else if (screen === 'ending') renderEnding();
  }

  function renderTitle() {
    const hasSave = engine.hasSave();
    root.innerHTML = `
    <div class="shell title-shell">
      <div class="title-bg" aria-hidden="true">
        <div class="water-plane"></div>
        <div class="slide-silhouette"></div>
        <div class="title-grain"></div>
      </div>
      <header class="title-header">
        <p class="eyebrow">3D narativní horror · ~30 minut · Atlantis Wave</p>
        <h1 class="logo">${story.meta.title}</h1>
        <p class="tagline">${story.meta.subtitle}</p>
        <p class="blurb">${story.meta.blurb}</p>
      </header>
      <div class="title-actions">
        <button class="btn btn-primary" data-act="new">Nová směna (3D)</button>
        ${hasSave ? '<button class="btn btn-ghost" data-act="continue">Pokračovat</button>' : ''}
        <button class="btn btn-ghost" data-act="about">O hře</button>
      </div>
      <footer class="title-foot">
        <span>WASD pohyb · Myš rozhled · E interakce · F svítilna · Shift běh</span>
        <span>Příběh + první osoba · uložení v prohlížeči</span>
      </footer>
    </div>`;
    root.querySelector('[data-act="new"]')?.addEventListener('click', async () => {
      await audio.init();
      audio.resume();
      engine.clearSave();
      engine.startFresh();
      enterGame();
    });
    root.querySelector('[data-act="continue"]')?.addEventListener('click', async () => {
      await audio.init();
      audio.resume();
      if (engine.continueSave()) enterGame();
    });
    root.querySelector('[data-act="about"]')?.addEventListener('click', () => {
      modal = {
        title: 'O hře',
        body: `UZÁVĚRKA je 3D příběhový horor v aquaparku.
Procházej lokace, čti dokumenty, sbírej důkazy.
Tři konce podle voleb a pořadí ventilů.

Obsah: smrt dítěte, utonutí, cover-up.
Fiktivní park.`,
      };
      openModalOnly();
    });
  }

  function enterGame() {
    screen = 'game';
    patched = false;
    renderGame(true);
    const canvas = root.querySelector('#webgl');
    const g = api.ensure3D(canvas);
    g.onFrame = (h) => {
      hud3d = h;
      updateHudLive();
    };
    patchInteract(g);
    g.start();
  }

  let patched = false;
  function patchInteract(g) {
    if (!g || g.__uzPatched) return;
    const orig = g.tryInteract.bind(g);
    g.tryInteract = () => {
      const result = orig();
      if (result && !result.silent) openResult(result);
      if (engine.state.ending) {
        screen = 'ending';
        g.stop();
        renderEnding();
      }
      return result;
    };
    g.__uzPatched = true;
    patched = true;
  }

  function renderGame(full = true) {
    const view = engine.getView();
    if (full || !root.querySelector('.game3d-shell')) {
      root.innerHTML = `
      <div class="shell game3d-shell mood-${view.location.mood || 'lobby'}">
        <canvas id="webgl"></canvas>
        <div class="vhs-frame" aria-hidden="true"></div>
        <header class="topbar topbar-3d">
          <div class="topbar-left">
            <span class="rec"><i></i> NOC</span>
            <span class="clock" id="hud-clock">23:12</span>
            <span class="chapter">Kap. ${view.state.chapter} · ${escapeHtml(view.location.title)}</span>
          </div>
          <div class="topbar-right">
            <div class="tension"><span>Chlor</span><div class="tension-bar"><i id="hud-tension" style="width:${Math.round(view.state.tension * 100)}%"></i></div></div>
            <button class="icon-btn" data-panel="phone">SMS${view.state.phoneUnread ? `<em>${view.state.phoneUnread}</em>` : ''}</button>
            <button class="icon-btn" data-panel="docs">Dok</button>
            <button class="icon-btn" data-panel="inventory">Inv</button>
            <button class="icon-btn" data-act="save">Uložit</button>
          </div>
        </header>
        <div class="objective objective-3d" id="hud-objective">${escapeHtml(view.objective.text)}</div>
        <div class="crosshair"><b></b></div>
        <div id="interact-prompt" class="interact-prompt hidden"><kbd>E</kbd> <span id="interact-label"></span></div>
        <div class="meters-3d">
          <div class="meter"><span>Svítilna (F)</span><div class="meter-bar"><i id="hud-bat" style="width:100%"></i></div></div>
          <div class="meter"><span>Stamina</span><div class="meter-bar"><i id="hud-stam" style="width:100%"></i></div></div>
        </div>
        <div class="toast-log" id="hud-toast">${view.state.log[0] ? escapeHtml(view.state.log[0].text) : ''}</div>
        <div id="panel-slot"></div>
        <div id="modal-slot"></div>
      </div>`;
      bindGameChrome();
    } else {
      const obj = root.querySelector('#hud-objective');
      if (obj) obj.textContent = view.objective.text;
      const ch = root.querySelector('.chapter');
      if (ch) ch.textContent = `Kap. ${view.state.chapter} · ${view.location.title}`;
      const toast = root.querySelector('#hud-toast');
      if (toast && view.state.log[0]) toast.textContent = view.state.log[0].text;
      const ten = root.querySelector('#hud-tension');
      if (ten) ten.style.width = `${Math.round(view.state.tension * 100)}%`;
      renderPanelSlot(view);
    }
    if (modal) {
      root.querySelector('#modal-slot').innerHTML = renderModal(modal);
      bindModal();
    } else if (root.querySelector('#modal-slot')) {
      root.querySelector('#modal-slot').innerHTML = '';
    }
  }

  function updateHudLive() {
    const bat = root.querySelector('#hud-bat');
    const stam = root.querySelector('#hud-stam');
    const prompt = root.querySelector('#interact-prompt');
    const label = root.querySelector('#interact-label');
    if (bat) bat.style.width = `${Math.floor(hud3d.battery)}%`;
    if (stam) stam.style.width = `${Math.floor(hud3d.stamina)}%`;
    if (prompt && label) {
      if (hud3d.prompt) {
        prompt.classList.remove('hidden');
        label.textContent = hud3d.prompt;
      } else prompt.classList.add('hidden');
    }
  }

  function bindGameChrome() {
    root.querySelectorAll('[data-panel]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.exitPointerLock();
        const next = btn.getAttribute('data-panel');
        panel = panel === next ? null : next;
        if (panel === 'phone') engine.markPhoneRead(true);
        renderPanelSlot(engine.getView());
      });
    });
    root.querySelector('[data-act="save"]')?.addEventListener('click', () => {
      document.exitPointerLock();
      engine.save();
      modal = { title: 'Uloženo', body: 'Postup je v prohlížeči.' };
      renderGame(false);
    });
  }

  function renderPanelSlot(view) {
    const slot = root.querySelector('#panel-slot');
    if (!slot) return;
    if (!panel) {
      slot.innerHTML = '';
      return;
    }
    if (panel === 'inventory') {
      slot.innerHTML = `
      <aside class="side-panel">
        <header><h3>Inventář</h3><button data-close-panel>×</button></header>
        <ul class="item-list">
          ${view.inventory.length ? view.inventory.map((it) => `
            <li><div><strong>${escapeHtml(it.name)}</strong><p>${escapeHtml(it.desc)}</p></div>
            <button data-use="${it.id}">Použít</button></li>`).join('') : '<li class="empty">Prázdné</li>'}
        </ul>
      </aside>`;
    } else if (panel === 'docs') {
      slot.innerHTML = `
      <aside class="side-panel">
        <header><h3>Dokumenty</h3><button data-close-panel>×</button></header>
        <ul class="item-list">
          ${view.docs.length ? view.docs.map((d) => `
            <li><div><strong>${escapeHtml(d.title)}</strong></div>
            <button data-read="${d.id}">Číst</button></li>`).join('') : '<li class="empty">Zatím nic</li>'}
        </ul>
      </aside>`;
    } else if (panel === 'phone') {
      slot.innerHTML = `
      <aside class="side-panel">
        <header><h3>Telefon</h3><button data-close-panel>×</button></header>
        <ul class="sms-list">
          ${view.phone.length ? view.phone.map((m) => `
            <li><span class="from">${escapeHtml(m.from)}</span><p>${escapeHtml(m.body)}</p></li>`).join('') : '<li class="empty">Žádné zprávy</li>'}
        </ul>
      </aside>`;
    }
    slot.querySelector('[data-close-panel]')?.addEventListener('click', () => {
      panel = null;
      slot.innerHTML = '';
      root.querySelector('#webgl')?.requestPointerLock();
    });
    slot.querySelectorAll('[data-use]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const g = api.getGame3D?.();
        const result = g ? g.applyItemUse(btn.getAttribute('data-use')) : engine.useItem(btn.getAttribute('data-use'));
        if (result) openResult(result);
      });
    });
    slot.querySelectorAll('[data-read]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const doc = story.documents[btn.getAttribute('data-read')];
        if (doc) {
          modal = { title: doc.title, body: doc.body, pre: true };
          renderGame(false);
        }
      });
    });
  }

  function openResult(result) {
    if (!result || result.silent) return;
    if (result.ending && !result.choice) return;
    if (result.promptCode) {
      modal = {
        title: result.title,
        body: result.body,
        code: true,
        codeAnswer: result.codeAnswer,
        onCodeOk: result.onCodeOk,
        onCodeBad: result.onCodeBad,
      };
    } else if (result.choice) {
      modal = { title: result.title, body: result.body, choices: result.choice };
    } else {
      modal = { title: result.title || '…', body: result.body || '' };
    }
    document.exitPointerLock();
    renderGame(false);
  }

  function openModalOnly() {
    // title screen modal overlay
    const wrap = document.createElement('div');
    wrap.innerHTML = renderModal(modal);
    root.appendChild(wrap.firstElementChild);
    bindModal();
  }

  function renderModal(m) {
    return `
    <div class="modal-backdrop">
      <div class="modal" role="dialog">
        <h3>${escapeHtml(m.title)}</h3>
        <div class="modal-body ${m.pre ? 'pre' : ''}">${m.pre ? escapeHtml(m.body) : formatProse(m.body)}</div>
        ${m.code ? `<form class="code-form"><input maxlength="8" inputmode="numeric" placeholder="••••" /><button class="btn btn-primary" type="submit">Potvrdit</button></form>` : ''}
        ${m.choices ? `<div class="choice-list">${m.choices.map((c, i) => `<button class="btn btn-ghost" data-choice="${i}">${escapeHtml(c.label)}</button>`).join('')}</div>` : ''}
        ${!m.code && !m.choices ? '<button class="btn btn-primary" data-close-modal>Pokračovat</button>' : ''}
      </div>
    </div>`;
  }

  function bindModal() {
    root.querySelector('[data-close-modal]')?.addEventListener('click', () => {
      modal = null;
      if (screen === 'game') {
        renderGame(false);
        root.querySelector('#webgl')?.requestPointerLock();
      } else {
        root.querySelector('.modal-backdrop')?.remove();
      }
    });
    root.querySelector('.code-form')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const val = (root.querySelector('.code-form input')?.value || '').trim();
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
          screen = 'ending';
          api.getGame3D?.()?.stop();
          renderEnding();
          return;
        }
        if (choice.go) {
          engine.go(choice.go);
          api.getGame3D?.()?.world.teleportPlayer(api.getGame3D().player, choice.go);
          renderGame(false);
          root.querySelector('#webgl')?.requestPointerLock();
          return;
        }
        renderGame(false);
      });
    });
  }

  function renderEnding() {
    const ending = story.endings[engine.state.ending];
    if (!ending) return;
    root.innerHTML = `
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
    root.querySelector('[data-act="again"]')?.addEventListener('click', () => {
      engine.clearSave();
      engine.startFresh();
      enterGame();
    });
    root.querySelector('[data-act="title"]')?.addEventListener('click', () => {
      screen = 'title';
      modal = null;
      panel = null;
      renderTitle();
    });
  }

  render();
  return { render };
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
