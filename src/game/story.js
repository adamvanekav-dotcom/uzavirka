/** UZÁVĚRKA — full narrative content (~30 min play) */

export const story = {
  meta: {
    title: 'UZÁVĚRKA',
    subtitle: 'Poslední směna v Atlantis Wave',
    blurb:
      'Aquapark zítra srovnají se zemí. Ty máš jednu noc na focení pro pojišťovnu. Voda si pamatuje víc než vedení.',
  },

  items: {
    badge: {
      id: 'badge',
      name: 'Dočasná karta',
      desc: 'Plastová kartička: HOST — FOTODOKUMENTACE. Platí do 06:00.',
    },
    flashlight: {
      id: 'flashlight',
      name: 'Svítilna',
      desc: 'Těžká, s prasklým sklem. Svítí, ale baterie je slabá.',
    },
    batteries: {
      id: 'batteries',
      name: 'Baterie AA',
      desc: 'Dvě kusy z automatů u šaten. Pořád v blistru.',
    },
    locker_key: {
      id: 'locker_key',
      name: 'Klíč od skříňky 117',
      desc: 'Malý mosazný klíč s cedulkou. Na rubu je napsané: M.H.',
    },
    wristband: {
      id: 'wristband',
      name: 'Fialový náramek',
      desc: 'Dětský vstupní náramek. Uvnitř vybledlé: MATYÁŠ 12. 7.',
    },
    maintenance_notes: {
      id: 'maintenance_notes',
      name: 'Servisní poznámky',
      desc: 'Zmáčený blok s pořadím ventilů. Červeně: NEOTVÍRAT C PŘED A.',
    },
    office_key: {
      id: 'office_key',
      name: 'Klíč od kanceláře',
      desc: 'Klíč s přívěskem plavčíka. Zuby jsou obroušené.',
    },
    usb: {
      id: 'usb',
      name: 'USB disk',
      desc: 'Černý USB s páskou. Nápis: KAMERY — NEMAZAT (kopie).',
    },
    filter_key: {
      id: 'filter_key',
      name: 'Klíč od filtrace',
      desc: 'Těžký klíč od technického zázemí. Voní po oleji a chloru.',
    },
    phone: {
      id: 'phone',
      name: 'Firemní telefon',
      desc: 'Starý tlačítkový Nokia z plavčíkovy kanceláře. V inboxu jsou hlasovky.',
    },
    evidence_folder: {
      id: 'evidence_folder',
      name: 'Složka DŮKAZY',
      desc: 'Vytištěné protokoly, e-maily, fotky sacího koše. To, co mělo zmizet.',
    },
  },

  documents: {
    flyer: {
      id: 'flyer',
      title: 'Leták — Poslední víkend',
      body: `ATLANTIS WAVE
„Kde vlny nikdy nespí“

Poslední víkend provozu — 14.–15. srpna
Poté areál uzavřen. Demolice od pondělí.

Dětský klub Zlatá rybka ukončen.
Wellness zavřeno z technických důvodů.
Vlnový bazén — mimořádný provoz do 18:00.

Vstupenky nevratné.`,
    },
    guestbook: {
      id: 'guestbook',
      title: 'Výpis z knihy přání',
      body: `…běžné pochvaly…

Bez data, jiné písmo:
„On se bál mřížky. My jsme se smáli.
Teď se směju já, když jdu spát, protože jinak bych křičela.“

(otisk mokré sklenice)`,
    },
    incident_redacted: {
      id: 'incident_redacted',
      title: 'Protokol 2019/084 (cenzurováno)',
      body: `INTERNÍ — NEŠÍŘIT

Datum: 12. 7. 2019
Místo: Vlnový bazén, sektor B (hloubka 1,6 m)
Poškozený: Matyáš H., 9 let

Shrnutí:
Kolem 14:40 došlo k [REDACTED] u sacího koše.
Záchrana zahájena po [REDACTED] minutách.
Přivolána ZZS. Úmrtí konstatováno v [REDACTED].

Poznámka právní:
Veřejné prohlášení: „tragická nehoda, plavčíci postupovali správně.“
Interní audit sacího systému — ODLOŽENO.
Náhradní díly — NENAROUČENO (rozpočet Q3).

Podpis: ředitel provozu K. Valenta`,
    },
    mother_note: {
      id: 'mother_note',
      title: 'Lístek z úklidového vozíku',
      body: `Eliško — ne, to není tobě.
To píšu sobě, aby mi to zůstalo v hlavě.

Voda drží zvuk.
Když vypnou čerpadla, slyšíš plácání. I když je klidná hladina.
On říkal, že se bojí mřížky. Smáli se mu.
Já jsem ho měla držet za ruku.

Dneska jdu dolů do filtrace.
Když to najdu, dám to ven.
Když ne — ať aspoň někdo vidí, že jsem zkoušela.

— Hana H.`,
    },
    valve_order: {
      id: 'valve_order',
      title: 'Pořadí uzavření okruhu',
      body: `NOČNÍ UZÁVĚRKA — FILTRACE

1) Ventil A — přívod z vlnového bazénu
2) Ventil B — okruh tobogánů
3) Ventil C — sací větev (POUZE po A a B)
4) Bypass D — nouzový přepad

POZOR: Otevření C před A způsobí podtlak v šachtě.
V roce 2019 měřen podtlak 3× nad normu.
Nikdo to neopravil. „Je to v limitu,“ řekli.

Kód skříně jističů: 0712
(datum, který si vedení pamatuje jen jako PR katastrofu)`,
    },
    email_thread: {
      id: 'email_thread',
      title: 'E-mail: smazat zálohy kamer',
      body: `Od: k.valenta@atlantiswave.cz
Komu: it@atlantiswave.cz
Předmět: Re: archiv CAM-04

Smažte zálohy z 12. 7. 2019 z CAM-04 (sací zóna).
Právníci říkají, že „technický výpadek“ je dostatečný.
Nenechte nic na lokálních discích plavčíků.

A tu uklízečku H.H. přesuňte na noční směny mimo pool deck.
Nemá co číst u recepce.

— KV

---
Poznámka IT (rukou):
„Záloha už je pryč z serveru. Ale plavčík Marek si to zkopíroval na USB.
Říkal, že spí špatně. Já taky.“`,
    },
    voicemail_transcript: {
      id: 'voicemail_transcript',
      title: 'Přepis hlasovky — Marek',
      body: `12. 7. 2019, 23:08 — hlasovka sobě

„Já jsem ho viděl. Než spadla mřížka zpátky.
On se držel… a voda šla dolů jako do odpadu.
Přepínač vln byl pořád na MAX. Nikdo ho nevypnul.
Valenta říká, že mluvím blbě, že jsem v šoku.
Já nejsem v šoku. Já jsem zbabělec.
USB je ve skříňce 117. Heslo je jeho narozeniny.
Jestli to někdy někdo najde — nevěřte tiskové zprávě.“`,
    },
  },

  phone: {
    radek_1: {
      id: 'radek_1',
      from: 'Radek (správa)',
      body: 'Eliško, karta je u recepce v šuplíku. Fotej hlavně vlnový bazén + tobogány. Do filtrace nechoď, prý je mokro. Ozvi se, až budeš hotová.',
    },
    radek_2: {
      id: 'radek_2',
      from: 'Radek (správa)',
      body: 'Slyšíš něco divnýho v hale? Čerpadla maj bejt vypnutý. Jestli teče voda, napiš. Já jsem 40 min daleko.',
    },
    radek_3: {
      id: 'radek_3',
      from: 'Radek (správa)',
      body: 'Eliško??? Kamerový systém hlásí pohyb v sektoru B. Ty jsi sama. Nechoď k mřížce. Prosím.',
    },
    unknown_1: {
      id: 'unknown_1',
      from: 'Neznámé číslo',
      body: 'Nenech to zmizet podruhý.',
    },
  },

  objectives: [
    {
      id: 'arrive',
      chapter: 1,
      text: 'Vstoupit do Atlantis Wave a vyzvednout dočasnou kartu.',
      when: (e) => !e.flag('got_badge'),
    },
    {
      id: 'photo_brief',
      chapter: 1,
      text: 'Prozkoumat šatny a najít, co vedení nechalo zmizet.',
      when: (e) => e.flag('got_badge') && !e.flag('found_locker'),
    },
    {
      id: 'wave',
      chapter: 2,
      text: 'Zdokumentovat vlnový bazén. Něco v sektoru B nesedí.',
      when: (e) => e.flag('found_locker') && !e.flag('saw_grate'),
    },
    {
      id: 'tower',
      chapter: 2,
      text: 'Tobogánová věž a dětský klub — dojít stopám Hany H.',
      when: (e) => e.flag('saw_grate') && !e.flag('got_usb'),
    },
    {
      id: 'office',
      chapter: 3,
      text: 'Plavčíkova kancelář: důkazy, klíče, pravda.',
      when: (e) => e.flag('got_usb') && !e.flag('got_evidence'),
    },
    {
      id: 'filter',
      chapter: 3,
      text: 'Filtrace: uzavřít okruh ve správném pořadí — nebo odejít s důkazy.',
      when: (e) => e.flag('got_evidence') && !e.state.ending,
    },
  ],

  endings: {
    escape: {
      id: 'escape',
      title: 'Útěk',
      subtitle: 'Přežila jsi. Ticho ne.',
      tension: 0.4,
      sfx: 'warn',
      body: `Vyšla jsi ještě před třetí hodinou.
Kartu jsi nechala na pultě. Složku jsi nechala ve filtraci.
Radek ti napsal, že jsi „rozumná“.

Pojišťovna dostala pěkné fotky prázdného parku.
Demolice začala v pondělí.
Nikdo se nezeptal na Matyáše.

Někdy v noci, když zavřeš oči, slyšíš vlnu,
která nemá kde vzniknout.
A plácání. I když jsi daleko od vody.`,
      epilogue: 'Konec A — Útěk. Atlantis Wave zmizelo. Pravda taky.',
    },
    witness: {
      id: 'witness',
      title: 'Svědek',
      subtitle: 'Vynesla jsi to ven.',
      tension: 0.55,
      sfx: 'pickup',
      body: `USB a složka opustily park s tebou.
Do rána jsi měla tři novináře a jednoho právníka,
který řekl: „Tohle není nehoda. Tohle je systém.“

Valenta popíral. Pak mlčel.
Kamerový záznam z CAM-04 — ten, co „neexistoval“ —
ukázal mřížku, vlnu na MAX a dítě, které se drželo.

Atlantis Wave srovnali se zemí.
Na místě je teď obchodní centrum.
U vstupu je malá deska: Matyáš H., 2019.

Ty už do aquaparku nejdeš.
Ale spíš klidněji.`,
      epilogue: 'Konec B — Svědek. Nejlepší možný konec. Park je pryč. Jméno zůstalo.',
    },
    deep: {
      id: 'deep',
      title: 'Hlubina',
      subtitle: 'Došla jsi až na dno.',
      tension: 1,
      sfx: 'stinger',
      body: `Ventil C jsi otevřela dřív, než A.
Podtlak tě stáhl ke mřížce jako úlomek listí.
Svítilna zhasla. Chlor peče v nose.
Někdo ti drží zápěstí — malá ruka, studená.

Hana šeptá z temnoty potrubí:
„Teď to vidíš. Teď už to nemůžou smazat.“

Ráno našli u přepadu tvoji kartu a fialový náramek.
V protokolu stojí: uklouznutí.
Voda je čistá. Voda je tichá.

Zítra přijedou bagry.
Pod betonem zůstane ozvěna,
která čeká na další noční směnu.`,
      epilogue: 'Konec C — Hlubina. Park si vzal svědka. Příběh končí v potrubí.',
    },
  },

  locations: {},
};

// --- Locations (defined after story shell so closures can reference story) ---

story.locations = {
  parking: {
    id: 'parking',
    title: 'Parkoviště',
    chapter: 1,
    mood: 'outside',
    art: 'parking',
    blurb: 'Asfalt ještě drží denní teplo. Nad tebou mrtvý neon: ATLANTIS WAVE.',
    prose: `Noční směna začíná tady — na prázdném parkovišti s jednou blikající lampou.

Za plotem je tropický svět z 90. let: sklolaminátové vlny, bleděmodré tobogány,
vstupní brána s plastovými mušlemi. Zítra tohle všechno zmizí.

V kabelce máš focení brief od pojišťovny a jméno kontaktu: Radek.
V kapse vibruje telefon.`,
    actions: [
      {
        id: 'park_look_sign',
        label: 'Přečíst ceduli u brány',
        once: true,
        run: () => ({
          title: 'Cedule',
          body: `AREÁL UZAVŘEN — VSTUP ZAKÁZÁN
Výjimka: dokumentace pojišťovny (noční směna)
Kontakt správy: Radek · 777 212 090

Dole někdo přelepil páskou:
„VODA SI PAMATUJE“`,
          tension: 0.05,
          log: 'Cedule u brány. Někdo tu byl před tebou.',
          phone: 'radek_1',
        }),
      },
      {
        id: 'park_listen',
        label: 'Zastavit se a poslouchat',
        once: true,
        run: () => ({
          title: 'Ticho',
          body: `Město je daleko. Vítr táhne přes prázdné lehátka za plotem.
Pak — jedno plácnutí. Jako když dítě kopne do hladiny.
Pak zase nic.

Čerpadla mají být vypnutá.`,
          tension: 0.08,
          sfx: 'warn',
        }),
      },
    ],
    exits: [
      { to: 'lobby', label: 'Vstoupit do vstupní haly' },
    ],
  },

  lobby: {
    id: 'lobby',
    title: 'Vstupní hala',
    chapter: 1,
    mood: 'lobby',
    art: 'lobby',
    tensionOnEnter: 0.03,
    blurb: 'Vlhké dlaždice. Pach chloru a starého popcornu.',
    prose: `Hala je větší, než si pamatuješ z denních návštěv.
Bez lidí působí jako nádraží po posledním spoji.

Recepční pult je zamčený, ale spodní šuplík má vyviklaný zámek.
Na stěně visí vybledlá mapa areálu a leták POSLEDNÍ VÍKEND.

Nouzové světlo hází zelený pruh přes pokladnu.`,
    onEnter(engine, prev) {
      if (prev === 'parking' && !engine.flag('entered_once')) {
        engine.setFlag('entered_once');
        engine._pushLog('Vstupní hala. Chlor, ticho, zelené nouzové světlo.');
      }
    },
    actions: [
      {
        id: 'lobby_drawer',
        label: 'Otevřít šuplík u recepce',
        hideIfFlag: 'got_badge',
        run: (e) => {
          e.addItem('badge');
          e.addItem('flashlight');
          e.setFlag('got_badge');
          return {
            title: 'Dočasná karta',
            body: `V šuplíku je karta HOST — FOTODOKUMENTACE a těžká svítilna.
Pod kartou leží leták. V zadní části šuplíku se leskne blistr baterií.

Radek psal pravdu. Aspoň o kartě.`,
            log: 'Máš kartu a svítilnu.',
            sfx: 'pickup',
          };
        },
      },
      {
        id: 'lobby_batteries_fix',
        label: 'Vzít baterie z šuplíku',
        requireFlag: 'got_badge',
        hideIfItem: 'batteries',
        once: true,
        run: () => ({
          title: 'Baterie',
          body: 'Dvě AA. Budou se hodit — svítilna bliká už teď.',
          item: 'batteries',
        }),
      },
      {
        id: 'lobby_flyer',
        label: 'Sebrat leták z pultu',
        once: true,
        run: () => ({
          title: 'Leták',
          body: 'Poslední víkend. Vstupenky nevratné. Wellness „z technických důvodů“ zavřeno.',
          doc: 'flyer',
        }),
      },
      {
        id: 'lobby_map',
        label: 'Prohlédnout mapu areálu',
        once: true,
        run: () => ({
          title: 'Mapa',
          body: `Sektor A — vstup + šatny
Sektor B — vlnový bazén (hloubka až 1,8 m)
Sektor C — tobogánová věž
Sektor D — dětský klub Zlatá rybka
Sektor E — wellness (ZAVŘENO)
Sektor F — technika / filtrace (ZAMČENO)

U sektoru B je propiskou kroužek a otazník.`,
          log: 'Mapa: sektor B je zakroužkovaný.',
        }),
      },
      {
        id: 'lobby_guest_book',
        label: 'Otevřít knihu přání u vchodu',
        once: true,
        run: () => ({
          title: 'Kniha přání',
          body: `Poslední zápisy jsou z neděle odpoledne.
„Bylo to super, škoda že končíte.“
„Tobogán Černá díra je nejlepší.“

Pak, jiným písmem, bez data:
„On se bál mřížky. My jsme se smáli.
Teď se směju já, když jdu spát, protože jinak bych křičela.“

Pod tím jen vodní kruh — jako od mokrého dna sklenice.`,
          tension: 0.07,
          doc: 'guestbook',
        }),
      },
      {
        id: 'lobby_vending',
        label: 'Kopnout do rozbitého automatu',
        once: true,
        run: () => ({
          title: 'Automat',
          body: `Sklo je prasklé. Uvnitř ztvrdlé tyčinky a jedna plechovka.
Z výdejního otvoru vypadne zmačkaný účtenkový papírek:

12. 7. 2019 14:22
2× voda 0.5
1× nanuk
POZNÁMKA: reklamace — dítě plakalo u bazénu, rodič žádal refund vstupného.
ZAMÍTNUTO — „vlny jsou součástí zážitku.“`,
          tension: 0.06,
          flag: 'saw_receipt',
        }),
      },
      {
        id: 'lobby_turnstile',
        label: 'Projít turniketem s kartou',
        requireItem: 'badge',
        hideIfFlag: 'turnstile_ok',
        run: (e) => {
          e.setFlag('turnstile_ok');
          return {
            title: 'Turniket',
            body: `Píp. Zelená.
Turniket se neochotně pootočí. Za ním mokrá stopa bosých nohou —
malá, dětská — vede k šatnám a dál se ztrácí na dlaždicích.

Nikdo tu dnes neměl být.`,
            tension: 0.1,
            sfx: 'warn',
            flag: 'seen_footprints',
            phone: 'radek_2',
          };
        },
      },
    ],
    itemUses: {
      batteries: (e) => {
        if (!e.has('flashlight')) {
          return { title: 'Baterie', body: 'Nejdřív potřebuješ svítilnu.' };
        }
        e.setFlag('flashlight_fresh');
        e.removeItem('batteries');
        return {
          title: 'Svítilna nabitá',
          body: 'Klik. Kužel světla je ostřejší. Už nebliká.',
          removeItem: 'batteries',
          flag: 'flashlight_fresh',
          log: 'Svítilna má nové baterie.',
          sfx: 'pickup',
        };
      },
    },
    exits: [
      { to: 'parking', label: 'Zpět na parkoviště' },
      {
        to: 'lockers',
        label: 'Do šaten',
        requireFlag: 'got_badge',
      },
      {
        to: 'wavepool',
        label: 'K vlnovému bazénu',
        requireFlag: 'turnstile_ok',
      },
    ],
  },

  lockers: {
    id: 'lockers',
    title: 'Šatny',
    chapter: 1,
    mood: 'lockers',
    art: 'lockers',
    tensionOnEnter: 0.04,
    blurb: 'Řady skříněk. Vzduch stojí. Kapky tikají do odtoku.',
    prose: `Dámská i pánská strana jsou otevřené — zámek na společných dveřích visí naprázdno.
Podlaha je lepivá. V koutě stojí úklidový vozík s hadry a poloprázdnou lahví chloru.

Skříňka 117 má jiný zámek než ostatní. Novější. Někdo ji chtěl udržet zavřenou.

Na zrcadle je zevnitř napsáno prstem ve stejném: NENECH TO ZMIZET.`,
    actions: [
      {
        id: 'lockers_cart',
        label: 'Prohledat úklidový vozík',
        once: true,
        run: () => ({
          title: 'Úklidový vozík',
          body: `Mezi hadry je zmačkaný lístek.
Písmo je úhledné, skoro školní. Podpis: Hana H.

Pod vozíkem leží mosazný klíč s cedulkou 117.`,
          doc: 'mother_note',
          item: 'locker_key',
          tension: 0.06,
          log: 'Klíč 117 a lístek od Hany H.',
        }),
      },
      {
        id: 'lockers_117',
        label: 'Otevřít skříňku 117',
        requireItem: 'locker_key',
        hideIfFlag: 'found_locker',
        run: (e) => {
          e.setFlag('found_locker');
          e.addItem('wristband');
          return {
            title: 'Skříňka 117',
            body: `Uvnitř: srolovaný plavecký ručník, fialový dětský náramek
a obálka s razítkem INTERNÍ.

Náramek: MATYÁŠ 12. 7.
V obálce je cenzurovaný protokol. Čísla jsou začerněná.
Ale jméno ne.`,
            item: 'wristband',
            doc: 'incident_redacted',
            tension: 0.12,
            sfx: 'warn',
            log: 'Skříňka 117: náramek a protokol 2019.',
            phone: 'unknown_1',
          };
        },
      },
      {
        id: 'lockers_mirror',
        label: 'Otřít zrcadlo',
        once: true,
        run: () => ({
          title: 'Zrcadlo',
          body: `Pod vrstvou vodního kamene je ještě jedna věta, dřív neviditelná:
„KÓD JE DATUM.“

Vedle je malý otisk dlaně. Dětský.`,
          tension: 0.08,
          flag: 'know_code_hint',
        }),
      },
      {
        id: 'lockers_drain',
        label: 'Naklonit se k odtoku',
        once: true,
        run: () => ({
          title: 'Odtok',
          body: `Z odtoku táhne studený vzduch a slabý hukot —
jako vzdálená voda v potrubí.

Na mřížce visí vlas. Dlouhý. Tmavý.
Ne tvůj.`,
          tension: 0.1,
          sfx: 'warn',
        }),
      },
    ],
    exits: [
      { to: 'lobby', label: 'Zpět do haly' },
      {
        to: 'wavepool',
        label: 'K vlnovému bazénu',
        requireFlag: 'turnstile_ok',
      },
      {
        to: 'kids',
        label: 'K dětskému klubu',
        requireFlag: 'found_locker',
      },
    ],
  },

  wavepool: {
    id: 'wavepool',
    title: 'Vlnový bazén',
    chapter: 2,
    mood: 'pool',
    art: 'wavepool',
    tensionOnEnter: 0.08,
    blurb: 'Hladina je černé zrcadlo. Vlny jsou vypnuté. Skoro.',
    prose: `Bazén je vypuštěný jen napůl. Voda sahá ke stupňům.
Modré dlaždice mizí ve tmě. Na dně se lesknou penízky a jeden ztracený brýlový obrouček.

Sektor B je vlevo — u sacího koše. Tam, kde mapa měla otazník.
Plavčíkova kukaň ční nad hladinou jako opuštěná kazatelna.

Když stojíš tiše, hladina se jednou zvedne. Jen o centimetr.
Bez motoru. Bez větru.`,
    onEnter(engine) {
      if (!engine.flag('wave_entered')) {
        engine.setFlag('wave_entered');
        engine._queuePhone('radek_3');
      }
    },
    actions: [
      {
        id: 'wave_photo',
        label: 'Vyfotit bazén pro pojišťovnu',
        once: true,
        run: () => ({
          title: 'Fotka',
          body: `Cvak.
Na displeji je všechno, co má být: prázdný bazén, lehátka, tobogány v pozadí.
Ale v pravém dolním rohu — rozmazaná světlá skvrna u mřížky.
Jako ruka. Nebo odlesk.

Fotku si necháš. Brief plníš. Tělo ne.`,
          flag: 'took_photo',
          tension: 0.05,
        }),
      },
      {
        id: 'wave_grate',
        label: 'Jít k sacímu koši (sektor B)',
        requireFlag: 'found_locker',
        hideIfFlag: 'saw_grate',
        run: (e) => {
          e.setFlag('saw_grate');
          e.raiseTension(0.15);
          return {
            title: 'Sací koš',
            body: `Mřížka je novější než okolní dlaždice. Šrouby jsou přetažené.
Pod ní je tma, která dýchá.

Když posvítíš dovnitř, uvidíš něco, co vypadá jako dětský plavecký klips na nose.
A rýhu ve stěně potrubí — jako když se někdo drží nehty.

Fialový náramek v kapse je najednou těžší.`,
            tension: 0.15,
            sfx: 'stinger',
            log: 'Sací koš. Stopa po nehtech v potrubí.',
          };
        },
      },
      {
        id: 'wave_grate_again',
        label: 'Znovu se podívat do mřížky',
        requireFlag: 'saw_grate',
        once: true,
        run: () => ({
          title: 'Ozvěna',
          body: `Tentokrát zespodu uslyšíš hlas. Ne slova — jen výdech,
jako když se někdo učí říct „mámo“ pod vodou.

Pak cvaknutí. Jako přepínač vln na MAX.
Hladina se netrhne. Ale ty ucítíš tah v kotnících,
i když stojíš na suchu.`,
          tension: 0.12,
          sfx: 'warn',
        }),
      },
      {
        id: 'wave_tower_look',
        label: 'Zvednout hlavu k tobogánové věži',
        once: true,
        run: () => ({
          title: 'Věž',
          body: `Nahoře na plošině bliká světlo — krátce, jako baterka.
Pak zhasne.

Radek je 40 minut daleko.
Ty jsi sama.`,
          tension: 0.08,
          flag: 'saw_tower_light',
        }),
      },
      {
        id: 'wave_lifeguard_chair',
        label: 'Prohledat plavčíkovu kukaň',
        requireFlag: 'saw_grate',
        hideIfFlag: 'got_office_key',
        run: (e) => {
          e.setFlag('got_office_key');
          e.addItem('office_key');
          e.addItem('maintenance_notes');
          e.addDoc('valve_order');
          return {
            title: 'Kukaň',
            body: `V přihrádce je píšťalka, krém na opalování s datem 2018
a klíč s přívěskem — plastový žralok.
Na žralokovi je propiskou: KANCELÁŘ.

Pod sedátkem je servisní blok:
červeně NEOTVÍRAT C PŘED A. Kód skříně: 0712.`,
            log: 'Klíč od kanceláře + servisní poznámky.',
            sfx: 'pickup',
          };
        },
      },
      {
        id: 'wave_steps',
        label: 'Sesednout na schody bazénu',
        once: true,
        run: () => ({
          title: 'Schody',
          body: `Voda ti olízne kotníky. Je teplejší, než by v noci měla být.
Něco tvrdého se ti dotkne chodidla — ne mince. Spíš kroužek.
Když sáhneš, je to jen odlesk dlaždice.

Zvedneš nohy. Mokré stopy na suché dlažbě za tebou
nejsou jen tvoje. Jsou kratší.`,
          tension: 0.1,
          sfx: 'warn',
        }),
      },
    ],
    itemUses: {
      wristband: () => ({
        title: 'Náramek',
        body: `Držíš náramek nad hladinou. Nic se nestane.
Pak se voda u mřížky lehce promáčkne dovnitř —
jako nádech.

Něco ví, že jsi tady.`,
        tension: 0.1,
        sfx: 'warn',
      }),
      flashlight: (e) => {
        if (!e.flag('flashlight_fresh') && e.has('batteries')) {
          return {
            title: 'Svítilna',
            body: 'Bliká. Dej do ní baterie (použij baterie v inventáři v hale nebo tady).',
          };
        }
        return {
          title: 'Kužel světla',
          body: 'Projedeš světlem po hladině. Odlesky. Nic víc. Zatím.',
        };
      },
      batteries: (e) => {
        e.setFlag('flashlight_fresh');
        e.removeItem('batteries');
        return {
          title: 'Svítilna nabitá',
          body: 'Teď svítí pořádně i na dno u mřížky.',
          removeItem: 'batteries',
          flag: 'flashlight_fresh',
          sfx: 'pickup',
        };
      },
    },
    exits: [
      { to: 'lobby', label: 'Zpět do haly' },
      { to: 'lockers', label: 'Do šaten' },
      {
        to: 'tower',
        label: 'Na tobogánovou věž',
        requireFlag: 'saw_grate',
      },
      {
        to: 'kids',
        label: 'K dětskému klubu',
        requireFlag: 'found_locker',
      },
      {
        to: 'office',
        label: 'Do plavčíkovy kanceláře',
        requireItem: 'office_key',
      },
    ],
  },

  tower: {
    id: 'tower',
    title: 'Tobogánová věž',
    chapter: 2,
    mood: 'tower',
    art: 'tower',
    tensionOnEnter: 0.1,
    blurb: 'Kovové schody. Echo kapek v trubkách.',
    prose: `Stoupáš po mokrých schodech. Zábradlí je studené.
Každý dopad nohy zní dvakrát — jednou tady, jednou někde v trubce pod tebou.

Nahoře jsou čtyři ústí tobogánů: spirála, kamikadze, černá díra, duha.
Černá díra má cítít jako teplý dech. I když je noc a vzduch stojí.

Na plošině je odložená vysílačka. Baterie je mrtvá. Ale na displeji bliká poslední kanál: HELP.`,
    actions: [
      {
        id: 'tower_blackhole',
        label: 'Naklonit se do Černé díry',
        once: true,
        run: () => ({
          title: 'Černá díra',
          body: `Ze tmy přijede kapka a dopadne ti na čelo.
Pak hlas — chlapecký, rozmazaný vodou:

„Nesmíš pustit.“

Nevíš, jestli myslí mřížku, náramek, nebo tebe.`,
          tension: 0.14,
          sfx: 'stinger',
          flag: 'heard_boy',
        }),
      },
      {
        id: 'tower_radio',
        label: 'Zkusit vysílačku',
        once: true,
        run: () => ({
          title: 'Vysílačka',
          body: `Tlačítko zmáčkneš. Praskot.
Na vteřinu slyšíš ženský hlas: „…filtraci… USB… 117…“
Pak ticho a pískání.

Hana. Nebo nahrávka. Nebo park, který se učí mluvit jejími větami.`,
          tension: 0.1,
          flag: 'heard_hana_radio',
        }),
      },
      {
        id: 'tower_look_down',
        label: 'Podívat se dolů na bazén',
        once: true,
        run: () => ({
          title: 'Pohled dolů',
          body: `Z výšky je sací koš jen tmavý kruh.
Kolem něj je hladina o něco nižší — jako důlek.

Někdo tam dole stojí.
Malý.
Díváš se sekundu, dvě.
Pak je tam jen odlesk nouzového světla.`,
          tension: 0.12,
          sfx: 'warn',
        }),
      },
    ],
    exits: [
      { to: 'wavepool', label: 'Dolů k vlnovému bazénu' },
      {
        to: 'kids',
        label: 'Přes lávku k dětskému klubu',
      },
    ],
  },

  kids: {
    id: 'kids',
    title: 'Dětský klub Zlatá rybka',
    chapter: 2,
    mood: 'kids',
    art: 'kids',
    tensionOnEnter: 0.07,
    blurb: 'Mělké dno. Plastové ryby. Hračky v řadě, jako po kontrole.',
    prose: `Fontánka uprostřed nefunguje, ale voda v misce se chvěje.
Na stěně jsou obrázky dětí — výtvory z příměstského tábora 2019.
Jeden chybí. Rám je prázdný, sklo prasklé.

V koutě je skříňka s nápisem ANIMÁTOŘI.
Zámek je pryč. Uvnitř páchne mokré ručníky a lepidlo na papír.`,
    actions: [
      {
        id: 'kids_drawings',
        label: 'Prohlédnout dětské obrázky',
        once: true,
        run: () => ({
          title: 'Obrázky',
          body: `Většina je slunce, tobogán, zmrzlina.
Jeden — bez jména — ukazuje černý kruh na dně bazénu
a postavu, která se drží mřížky.

Učitelka napsala propiskou: „Matyáš — silné emoce, probrat.“
Datum: 10. 7. 2019. Dva dny předtím.`,
          tension: 0.1,
          flag: 'saw_drawing',
        }),
      },
      {
        id: 'kids_cabinet',
        label: 'Prohledat skříň animátorů',
        requireFlag: 'heard_boy',
        hideIfFlag: 'got_usb',
        run: (e) => {
          e.setFlag('got_usb');
          e.addItem('usb');
          return {
            title: 'USB',
            body: `Ve vaničce s pečetěmi je černý USB disk s páskou.
Nápis: KAMERY — NEMAZAT (kopie).

Vedle leží lísteček od Marka — plavčíka:
„Když to najdeš, nenech to ve skříňce. Valenta maže servery.
Heslo nahrávky = datum na náramku.“`,
            tension: 0.1,
            sfx: 'pickup',
            log: 'Máš USB s kamerami.',
            phone: 'unknown_1',
          };
        },
      },
      {
        id: 'kids_cabinet_early',
        label: 'Prohledat skříň animátorů',
        hideIfFlag: 'got_usb',
        visible: (e) => !e.flag('heard_boy'),
        run: () => ({
          title: 'Skříň',
          body: `Lepidlo, nůžky, pečetě, ztracené ponožky.
Nic, co by pojišťovna chtěla.
Něco ti říká, že důležité věci jsou jinde — výš, v trubkách, v hlasech.`,
        }),
      },
      {
        id: 'kids_fountain',
        label: 'Sáhnout do misky fontánky',
        once: true,
        run: () => ({
          title: 'Fontánka',
          body: `Voda je ledová. Na dně je korálek z náramku — fialový.
Stejný odstín jako ten v kapse.

Když korálek zvedneš, fontánka jednou škytne.
Zvuk jako smích. Krátký. Ulitý.`,
          tension: 0.09,
          sfx: 'warn',
        }),
      },
    ],
    exits: [
      { to: 'lockers', label: 'Zpět do šaten' },
      { to: 'wavepool', label: 'K vlnovému bazénu' },
      { to: 'tower', label: 'Na tobogánovou věž' },
      {
        to: 'wellness',
        label: 'K wellness (zavřeno)',
        requireFlag: 'got_usb',
      },
    ],
  },

  wellness: {
    id: 'wellness',
    title: 'Wellness — zavřeno',
    chapter: 2,
    mood: 'wellness',
    art: 'wellness',
    tensionOnEnter: 0.06,
    blurb: 'Páska. Teplo, které nemá odkud jít.',
    prose: `Dveře jsou přelepené páskou TECHNICKÁ ZÁVADA.
Páska je stará. Rohy se loubou.

Za sklem sauny je tma. Na lavici leží bílý ručník složený do čtverce —
jako by ho někdo připravil na hosta, který nepřijde.

Vzduch voní cedrem a něčím kyselejším.`,
    actions: [
      {
        id: 'well_break',
        label: 'Strhnout pásku a vejít',
        once: true,
        run: (e) => {
          e.setFlag('wellness_open');
          return {
            title: 'Sauna',
            body: `Lavice vrzne. V koutě je odložený firemní telefon — stará Nokia.
Vedle vytištěný e-mail o mazání záloh kamer.

Někdo tu seděl a četl si, co se nemá číst.`,
            item: 'phone',
            doc: 'email_thread',
            tension: 0.08,
            log: 'Firemní telefon a e-mail o mazání kamer.',
          };
        },
      },
      {
        id: 'well_phone',
        label: 'Poslechnout hlasovky na Nokii',
        requireItem: 'phone',
        once: true,
        run: () => ({
          title: 'Hlasovka',
          body: `Marek. 12. 7. 2019. 23:08.
Slyšíš dech. Slyšíš, jak se hlas láme.
Slyšíš větu o USB ve skříňce 117 — a o vlně na MAX.

Přepis si necháš. Hlas už nechceš slyšet znovu.`,
          doc: 'voicemail_transcript',
          tension: 0.12,
          sfx: 'warn',
        }),
      },
    ],
    exits: [
      { to: 'kids', label: 'Zpět do dětského klubu' },
      {
        to: 'office',
        label: 'Do plavčíkovy kanceláře',
        requireItem: 'office_key',
      },
    ],
  },

  office: {
    id: 'office',
    title: 'Plavčíkova kancelář',
    chapter: 3,
    mood: 'office',
    art: 'office',
    tensionOnEnter: 0.08,
    blurb: 'Zářivka bliká. Na stole je pořádek, který lže.',
    prose: `Kancelář je malá: stůl, skříň, nástěnka s rozpisy směn,
monitor s osmi černými okny kamer.

Na nástěnce je fotka týmu 2019. Marek stojí vzadu.
Hana H. tam není — úklid se na týmové fotky nedává.

V šuplíku je složka s nápisem DŮKAZY — rukou, ne tiskem.`,
    actions: [
      {
        id: 'office_folder',
        label: 'Otevřít složku DŮKAZY',
        hideIfFlag: 'got_evidence',
        run: (e) => {
          e.setFlag('got_evidence');
          e.addItem('evidence_folder');
          e.addItem('filter_key');
          return {
            title: 'Složka',
            body: `Protokoly. Maily. Fotky poškozeného sacího koše z května 2019 —
měsíc a půl před Matyášem.
Poznámka: „výměna odložena — náklad.“

Na dně složky je klíč od filtrace
a lístek: „Eliška (nebo kdokoli) — když čteš tohle, odnes to VEN.
Dolů jdi jen když musíš uzavřít vodu. Pořadí platí. C nikdy první.“`,
            item: 'evidence_folder',
            tension: 0.1,
            sfx: 'pickup',
            log: 'Důkazy + klíč od filtrace.',
          };
        },
      },
      {
        id: 'office_filter_key_fix',
        label: 'Vzít klíč od filtrace ze složky',
        requireFlag: 'got_evidence',
        hideIfItem: 'filter_key',
        run: () => ({
          title: 'Klíč',
          body: 'Těžký. Voní po oleji a chloru.',
          item: 'filter_key',
        }),
      },
      {
        id: 'office_cctv',
        label: 'Zapnout kamerový monitor',
        requireItem: 'usb',
        once: true,
        run: (e) => {
          e.setFlag('saw_cctv');
          return {
            title: 'CAM-04',
            body: `Monitor ožije šumem.
CAM-04 — sací zóna — přehrává soubor z USB.
12. 7. 2019, 14:39.

Vidíš vlnu. Vidíš mřížku.
Vidíš dítě.
Vidíš, jak přepínač v pozadí zůstává na MAX,
zatímco dospělí běží pozdě.

Záznam končí. Naživo CAM-04 ukazuje tebe —
jak stojíš v kanceláři. Ale ty se nehýbeš směrem, který kamera kreslí.
Zpoždění. Nebo dvojník. Nebo park, který zkouší, jestli se lekneš.`,
            tension: 0.18,
            sfx: 'stinger',
            log: 'Viděla jsi CAM-04. Už to nejde odvidět.',
          };
        },
      },
      {
        id: 'office_leave_early',
        label: 'Vzít důkazy a odejít z parku (konec)',
        requireFlag: 'got_evidence',
        requireItem: 'usb',
        run: () => ({
          title: 'Odejít',
          body: `Můžeš odejít teď.
S USB. Se složkou.
Filtraci nechat Radkovi. Parku. Bagřům.

Nebo dojít na konec potrubí a zavřít vodu pořádně —
pořadím, které nikdo nedodržel.`,
          // This opens a choice modal via special choice result
          choice: [
            {
              label: 'Odejít s důkazy do auta',
              ending: 'witness',
            },
            {
              label: 'Nechat důkazy a zmizet bez nich',
              ending: 'escape',
            },
            {
              label: 'Zůstat — jít do filtrace',
              go: 'filtration',
            },
          ],
        }),
      },
    ],
    exits: [
      { to: 'wavepool', label: 'Zpět k vlnovému bazénu' },
      {
        to: 'filtration',
        label: 'Do filtrace',
        requireItem: 'filter_key',
      },
      {
        to: 'lobby',
        label: 'Utíkat do haly',
        requireFlag: 'got_evidence',
      },
    ],
  },

  filtration: {
    id: 'filtration',
    title: 'Filtrace',
    chapter: 3,
    mood: 'filter',
    art: 'filtration',
    tensionOnEnter: 0.15,
    blurb: 'Hukot. Mokré schody. Potrubí jako střeva parku.',
    prose: `Sestupuješ do betonu. Chlor je tady hustší než vzduch.
Čtyři hlavní ventily: A, B, C, D. Červené rukojeti. Štítek s varováním je odřený.

U rozvaděče je skříň jističů s kódovým zámkem.
Na zemi je kaluž, která se hýbe proti spádu podlahy.

Někdo tu šeptá zpoza mřížky přepadu.
Šeptá tvoje jméno. Nebo Hanino. Je těžké to rozeznat.`,
    actions: [
      {
        id: 'filter_code',
        label: 'Zadat kód do skříně jističů',
        hideIfFlag: 'power_ok',
        run: (e) => ({
          title: 'Kód',
          body: `Čtyři čísla.
Hint ze zrcadla: KÓD JE DATUM.
Náramek: 12. 7. → 0712.
Servisní poznámky to potvrzují.`,
          promptCode: true,
          codeAnswer: '0712',
          onCodeOk: {
            title: 'Jističe',
            body: `Skříň cvakne. Světla v šachtě zesílí.
Teď vidíš ventily pořádně — a mokrou stopu k ventilu C.`,
            flag: 'power_ok',
            tension: 0.05,
            sfx: 'pickup',
            log: 'Jističe nahodily. Kód 0712.',
          },
          onCodeBad: {
            title: 'Špatný kód',
            body: 'Píp. Červená. Zkus datum z náramku — den a měsíc.',
            tension: 0.03,
            sfx: 'warn',
          },
        }),
      },
      {
        id: 'filter_listen',
        label: 'Poslouchat přepad',
        once: true,
        run: () => ({
          title: 'Přepad',
          body: `„Pořadí,“ říká hlas.
„A. B. Pak C. Jinak si mě vezme znovu.
Jinak si vezme tebe.“

Kaluž se stáhne k ventilu A — jako by ukazovala prstem.`,
          tension: 0.12,
          sfx: 'warn',
          flag: 'heard_order_voice',
        }),
      },
      {
        id: 'valve_a',
        label: 'Otočit ventil A (přívod vlnového bazénu)',
        requireFlag: 'power_ok',
        hideIfFlag: 'valve_a',
        run: (e) => {
          e.setFlag('valve_a');
          return {
            title: 'Ventil A',
            body: 'Kov skřípe. Hukot v potrubí klesne. Jedna větev mrtvá.',
            flag: 'valve_a',
            log: 'Ventil A zavřen.',
            sfx: 'ui',
          };
        },
      },
      {
        id: 'valve_b',
        label: 'Otočit ventil B (tobogány)',
        requireFlag: 'valve_a',
        hideIfFlag: 'valve_b',
        run: (e) => {
          e.setFlag('valve_b');
          return {
            title: 'Ventil B',
            body: 'Druhá větev ztichne. Teď zbývá sací C — a přepad D.',
            flag: 'valve_b',
            log: 'Ventil B zavřen.',
            sfx: 'ui',
          };
        },
      },
      {
        id: 'valve_c_correct',
        label: 'Otočit ventil C (sací větev)',
        requireFlag: 'valve_b',
        hideIfFlag: 'valve_c',
        run: (e) => {
          e.setFlag('valve_c');
          return {
            title: 'Ventil C',
            body: `Podtlak klesne. Mřížka nahoře v bazénu přestane „dýchat“.
Z přepadu jde dlouhý výdech — úleva, ne hrozba.

Můžeš zavřít D a odejít s důkazy.
Nebo zůstat a poslouchat, jestli park řekne ještě něco.`,
            flag: 'valve_c',
            log: 'Ventil C správně. Okruh je skoro mrtvý.',
            sfx: 'pickup',
            tension: -0.1,
          };
        },
      },
      {
        id: 'valve_c_early',
        label: 'Otočit ventil C hned (ignorovat pořadí)',
        requireFlag: 'power_ok',
        visible: (e) => !e.flag('valve_b') && !e.flag('valve_c'),
        run: () => ({
          title: 'Podtlak',
          body: `C před A.
Varování byla pravda.
Vzduch zmizí. Světlo zmizí.
Někdo ti chytí zápěstí.`,
          ending: 'deep',
          sfx: 'stinger',
        }),
      },
      {
        id: 'valve_d',
        label: 'Zavřít bypass D a odejít s důkazy',
        requireFlag: 'valve_c',
        run: (e) => {
          if (e.has('usb') && e.has('evidence_folder')) {
            return {
              title: 'Uzávěrka hotová',
              body: `D cvakne. Park je tichý.
Stoupáš nahoru se složkou a USB.
Venku už šedá ráno.

Radek volá. Nezvedneš.
Nejdřív noviny.`,
              ending: 'witness',
            };
          }
          return {
            title: 'Odcházíš nalehko',
            body: `Okruh je zavřený. Ty ale nemáš kompletní důkazy u sebe.
Venku řekneš sobě, že to stačilo.
Nestačilo.`,
            ending: 'escape',
          };
        },
      },
      {
        id: 'filter_flee',
        label: 'Vyběhnout ven bez uzavření (nechat to být)',
        run: () => ({
          title: 'Útěk ze šachty',
          body: `Necháváš ventily jak jsou.
Schody, hala, turniket, asfalt.
Srdce ti buší až v autě.

Za sebou slyšíš jedno plácnutí.
Pak bagry v hlavě. Na tři dny dopředu.`,
          ending: 'escape',
          sfx: 'warn',
        }),
      },
    ],
    exits: [
      {
        to: 'office',
        label: 'Zpět do kanceláře',
        visible: (e) => !e.flag('valve_c'),
      },
      {
        to: 'lobby',
        label: 'Utíkat do haly',
      },
    ],
  },
};
