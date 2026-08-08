const SAVE_KEY = 'uzavirka_save_v1';

export function createInitialState() {
  return {
    location: 'lobby',
    inventory: [],
    flags: {},
    docs: [],
    log: [],
    tension: 0.15,
    minutesPlayed: 0,
    startedAt: Date.now(),
    ending: null,
    phoneUnread: 0,
    chapter: 1,
  };
}

export class Engine {
  constructor(story, audio) {
    this.story = story;
    this.audio = audio;
    this.state = createInitialState();
    this.listeners = new Set();
    this._tickTimer = null;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit() {
    for (const fn of this.listeners) fn(this.getView());
  }

  getView() {
    const loc = this.story.locations[this.state.location];
    const actions = this._availableActions(loc);
    const exits = this._availableExits(loc);
    return {
      state: this.state,
      location: loc,
      actions,
      exits,
      inventory: this.state.inventory.map((id) => this.story.items[id]),
      docs: this.state.docs.map((id) => this.story.documents[id]),
      phone: this._phoneMessages(),
      objective: this._currentObjective(),
      canSave: !this.state.ending,
    };
  }

  startFresh() {
    this.state = createInitialState();
    this._startClock();
    this.audio.setTension(this.state.tension);
    this._pushLog('Vstupní hala. Chlor, ticho, zelené nouzové světlo.');
    this.emit();
  }

  hasSave() {
    try {
      return Boolean(globalThis.localStorage?.getItem(SAVE_KEY));
    } catch {
      return false;
    }
  }

  save() {
    if (this.state.ending) return false;
    try {
      globalThis.localStorage?.setItem(SAVE_KEY, JSON.stringify(this.state));
    } catch {
      return false;
    }
    this._pushLog('Postup uložen.');
    this.emit();
    return true;
  }

  clearSave() {
    try {
      globalThis.localStorage?.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
  }

  continueSave() {
    let raw = null;
    try {
      raw = globalThis.localStorage?.getItem(SAVE_KEY);
    } catch {
      return false;
    }
    if (!raw) return false;
    try {
      this.state = { ...createInitialState(), ...JSON.parse(raw) };
      this._startClock();
      this.audio.setTension(this.state.tension);
      this.emit();
      return true;
    } catch {
      return false;
    }
  }

  _startClock() {
    clearInterval(this._tickTimer);
    this._tickTimer = setInterval(() => {
      if (this.state.ending) return;
      this.state.minutesPlayed = Math.floor((Date.now() - this.state.startedAt) / 60000);
      if (this.state.chapter >= 2 && this.state.tension < 0.85) {
        this.state.tension = Math.min(0.85, this.state.tension + 0.002);
        this.audio.setTension(this.state.tension);
      }
    }, 15000);
    if (typeof this._tickTimer.unref === 'function') this._tickTimer.unref();
  }

  _pushLog(text) {
    this.state.log.unshift({ t: Date.now(), text });
    if (this.state.log.length > 40) this.state.log.length = 40;
  }

  has(itemId) {
    return this.state.inventory.includes(itemId);
  }

  flag(key) {
    return Boolean(this.state.flags[key]);
  }

  setFlag(key, value = true) {
    this.state.flags[key] = value;
  }

  addItem(itemId) {
    if (!this.has(itemId) && this.story.items[itemId]) {
      this.state.inventory.push(itemId);
      this.audio.blip('pickup');
      this._pushLog(`Sebráno: ${this.story.items[itemId].name}`);
    }
  }

  removeItem(itemId) {
    this.state.inventory = this.state.inventory.filter((id) => id !== itemId);
  }

  addDoc(docId) {
    if (!this.state.docs.includes(docId) && this.story.documents[docId]) {
      this.state.docs.push(docId);
      this.audio.blip('ui');
      this._pushLog(`Dokument: ${this.story.documents[docId].title}`);
    }
  }

  raiseTension(amount) {
    this.state.tension = Math.max(0, Math.min(1, this.state.tension + amount));
    this.audio.setTension(this.state.tension);
  }

  go(locationId) {
    const loc = this.story.locations[locationId];
    if (!loc) return;
    const prev = this.state.location;
    this.state.location = locationId;
    if (loc.chapter) this.state.chapter = Math.max(this.state.chapter, loc.chapter);
    if (loc.tensionOnEnter != null) this.raiseTension(loc.tensionOnEnter);
    if (typeof loc.onEnter === 'function') {
      loc.onEnter(this, prev);
    }
    this.audio.blip('ui');
    this.emit();
  }

  doAction(actionId) {
    const loc = this.story.locations[this.state.location];
    const action = (loc.actions || []).find((a) => a.id === actionId);
    if (!action) return null;
    if (action.requireFlag && !this.flag(action.requireFlag)) return null;
    if (action.requireItem && !this.has(action.requireItem)) return null;
    if (action.hideIfFlag && this.flag(action.hideIfFlag)) return null;
    if (action.once && this.flag(`done_${action.id}`)) return null;

    const result = typeof action.run === 'function' ? action.run(this) : action.result || {};
    if (action.once) this.setFlag(`done_${action.id}`);

    if (result.item) this.addItem(result.item);
    if (result.removeItem) this.removeItem(result.removeItem);
    if (result.doc) this.addDoc(result.doc);
    if (result.flag) this.setFlag(result.flag, result.flagValue !== false);
    if (result.flags) {
      for (const [k, v] of Object.entries(result.flags)) this.setFlag(k, v);
    }
    if (result.tension) this.raiseTension(result.tension);
    if (result.log) this._pushLog(result.log);
    if (result.phone) this._queuePhone(result.phone);
    if (result.go) this.go(result.go);
    if (result.ending) this.triggerEnding(result.ending);
    if (result.sfx) this.audio.blip(result.sfx);

    this.emit();
    return result;
  }

  _queuePhone(messageId) {
    if (!this.state.flags._phone) this.state.flags._phone = [];
    if (!this.state.flags._phone.includes(messageId)) {
      this.state.flags._phone.push(messageId);
      this.state.phoneUnread += 1;
      this.audio.blip('phone');
    }
  }

  markPhoneRead(silent = false) {
    this.state.phoneUnread = 0;
    if (!silent) this.emit();
  }

  _phoneMessages() {
    const ids = this.state.flags._phone || [];
    return ids.map((id) => this.story.phone[id]).filter(Boolean);
  }

  _currentObjective() {
    const o = this.story.objectives;
    for (let i = o.length - 1; i >= 0; i--) {
      if (o[i].when(this)) return o[i];
    }
    return o[0];
  }

  _availableActions(loc) {
    return (loc.actions || []).filter((a) => {
      if (a.requireFlag && !this.flag(a.requireFlag)) return false;
      if (a.requireItem && !this.has(a.requireItem)) return false;
      if (a.hideIfFlag && this.flag(a.hideIfFlag)) return false;
      if (a.hideIfItem && this.has(a.hideIfItem)) return false;
      if (a.once && this.flag(`done_${a.id}`)) return false;
      if (typeof a.visible === 'function' && !a.visible(this)) return false;
      return true;
    });
  }

  _availableExits(loc) {
    return (loc.exits || []).filter((e) => {
      if (e.requireFlag && !this.flag(e.requireFlag)) return false;
      if (e.requireItem && !this.has(e.requireItem)) return false;
      if (e.blockedIf && this.flag(e.blockedIf)) return false;
      if (typeof e.visible === 'function' && !e.visible(this)) return false;
      return true;
    });
  }

  triggerEnding(endingId) {
    const ending = this.story.endings[endingId];
    if (!ending) return;
    this.state.ending = endingId;
    this.audio.blip(ending.sfx || 'stinger');
    this.audio.setTension(ending.tension ?? 1);
    this.clearSave();
    this.emit();
  }

  useItem(itemId) {
    const loc = this.story.locations[this.state.location];
    const handler = loc.itemUses && loc.itemUses[itemId];
    if (!handler) {
      return {
        title: this.story.items[itemId]?.name || itemId,
        body: 'Tady to teď nepoužiješ.',
      };
    }
    const result = handler(this);
    if (result?.item) this.addItem(result.item);
    if (result?.removeItem) this.removeItem(result.removeItem);
    if (result?.doc) this.addDoc(result.doc);
    if (result?.flag) this.setFlag(result.flag);
    if (result?.flags) {
      for (const [k, v] of Object.entries(result.flags)) this.setFlag(k, v);
    }
    if (result?.tension) this.raiseTension(result.tension);
    if (result?.log) this._pushLog(result.log);
    if (result?.phone) this._queuePhone(result.phone);
    if (result?.go) this.go(result.go);
    if (result?.ending) this.triggerEnding(result.ending);
    if (result?.sfx) this.audio.blip(result.sfx);
    this.emit();
    return result;
  }
}
