(function () {
  'use strict';

  if (typeof window === 'undefined' || typeof Lampa === 'undefined') return;

  function _d(b64) {
    var bin = atob(b64), out = new Uint8Array(bin.length), i;
    for (i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return new TextDecoder('utf-8').decode(out);
  }

  var K = {
    h:   'aHR0cHM6Ly9kYXRhLnZpZHNyYy5zaA==',
    api: 'L2FwaS5waHA/',
    su:  'JnN0cmVhbV91cmxz',
    se:  'JnNlYXNvbj0=',
    ep:  'JmVwaXNvZGU9',
    tk:  'JHRva2VuPQ==',
    tok: 'L2dlbmVyYXRlLnBocA==',
    t:   'dHlwZT0=',
    d:   'ZGF0YQ==',
    s:   'c3RyZWFtX3VybHM=',
    vs:  'dnM=',
    w:   'd2FzbV91cmw=',
    j:   'ZXlK',
    m:   'JnRtZGI9',
    js:  'YXBwbGljYXRpb24vanNvbg==',
    tp:  'dGV4dC9wbGFpbg=='
  };

  var HOSTS = { api: _d(K.h) };
  var DBGKEY = 'pl_debug';

  var TIME = { api: 15000, wasm: 20000, token: 15000 };
  var TOK_TTL = 3600 * 1000;
  var RETRIES = 3;

  var WASM = { inst: null, ready: null };

  function dbg() {
    if (Lampa.Storage.field(DBGKEY) !== true) return;
    if (!window.console) return;
    try { console.log.apply(console, ['[pl]'].concat([].slice.call(arguments))); } catch (e) {}
  }

  function b64ToBytes(b64) {
    var s = String(b64).replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  function bytesToUtf8(bytes) {
    if (typeof TextDecoder !== 'undefined') {
      try { return new TextDecoder('utf-8').decode(bytes); } catch (e) {}
    }
    var s = '';
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    try { return decodeURIComponent(escape(s)); } catch (e) { return s; }
  }

  function originOf(url) {
    var m = /^([a-z]+:\/\/[^/]+)/i.exec(url);
    return m ? m[1] : '';
  }

  function getText(url, opts) {
    opts = opts || {};
    var tries = opts.retries == null ? RETRIES : opts.retries;
    var attempt = 0;

    function once(resolve, reject) {
      var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctl ? setTimeout(function () { ctl.abort(); }, opts.timeout || TIME.api) : null;

      var init = { method: 'GET', mode: 'cors', credentials: 'omit' };
      if (ctl) init.signal = ctl.signal;
      init.headers = { 'Accept': opts.accept || 'application/json' };
      if (opts.referer) init.referrer = opts.referer;

      fetch(url, init).then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      }).then(resolve, function (err) {
        if (timer) clearTimeout(timer);
        attempt++;
        var hard = err && /HTTP 4(?!29)/.test(err.message || '');
        if (attempt >= tries || hard) return reject(err);
        setTimeout(function () { once(resolve, reject); }, 800 * attempt);
      });
    }

    return new Promise(once);
  }

  function getBinary(url) {
    return fetch(url, { method: 'GET', mode: 'cors', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.arrayBuffer();
      });
  }


  function loadWasm(url) {
    if (WASM.ready) return WASM.ready;

    WASM.ready = getBinary(url)
      .then(function (buf) { return WebAssembly.instantiate(buf, {}); })
      .then(function (res) {
        var inst = res.instance || res;
        var ex = inst.exports;
        if (!ex || !ex.alloc || !ex.decrypt || !ex.memory) {
          throw new Error('bad module');
        }
        WASM.inst = inst;
        dbg('ready');
        return inst;
      })
      .catch(function (err) {
        WASM.ready = null;
        throw err;
      });

    return WASM.ready;
  }

  function decrypt(cipherB64, wasmUrl) {
    return loadWasm(wasmUrl).then(function (inst) {
      var ex = inst.exports;
      var data = b64ToBytes(cipherB64);

      var ptr = ex.alloc(data.length);
      new Uint8Array(ex.memory.buffer, ptr, data.length).set(data);

      var outLen = ex.decrypt(ptr, data.length);
      var raw = new Uint8Array(ex.memory.buffer, ptr + 12, outLen);

      return bytesToUtf8(raw).split('\n')
        .map(function (l) { return l.trim(); })
        .filter(function (l) { return l.length > 0; });
    });
  }


  var tokenCache = {};

  function getToken(origin) {
    var hit = tokenCache[origin];
    if (hit && (Date.now() - hit.ts) < TOK_TTL) return Promise.resolve(hit.token);

    return getText(origin + _d(K.tok), {
      accept: _d(K.tp),
      timeout: TIME.token,
      referer: origin + '/'
    }).then(function (txt) {
      txt = (txt || '').trim();
      if (txt.indexOf(_d(K.j)) !== 0) throw new Error('bad token');
      tokenCache[origin] = { token: txt, ts: Date.now() };
      dbg('token ok');
      return txt;
    }).catch(function (err) {
      if (hit) return hit.token;
      throw err;
    });
  }


  function resolve(tmdb, isTv, season, episode) {
    var q = _d(K.t) + (isTv ? 'tv' : 'movie') + _d(K.m) + tmdb + _d(K.su);
    if (isTv) q += _d(K.se) + season + _d(K.ep) + episode;

    var apiUrl = HOSTS.api + _d(K.api) + q;
    dbg('req');

    return getText(apiUrl, { accept: _d(K.js), timeout: TIME.api })
      .then(function (body) {
        var payload;
        try { payload = JSON.parse(body); }
        catch (e) { throw new Error('bad json'); }

        var blob = payload && payload[_d(K.d)] && payload[_d(K.d)][_d(K.s)];
        var wasmUrl = payload && payload[_d(K.vs)] && payload[_d(K.vs)][_d(K.w)];
        if (!blob || !wasmUrl) throw new Error('no data');
        return decrypt(blob, wasmUrl);
      })
      .then(function (urls) {
        if (!urls || !urls.length) throw new Error('no results');
        dbg('got', urls.length);
        return getToken(originOf(urls[0])).then(function (token) {
          return urls.map(function (u, i) {
            var sep = u.indexOf('?') === -1 ? '?' : '&';
            return { url: u + sep + _d(K.tk) + token, index: i };
          });
        });
      });
  }

  Lampa.Pl = {
    resolve: resolve,
    getToken: getToken,
    clearTokens: function () { tokenCache = {}; }
  };


  function component(object) {
    var self    = this;
    var scroll  = new Lampa.Scroll({ mask: true, over: true });
    var files   = new Lampa.Explorer(object);

    var movie = object.movie || object;
    var title = object.search || movie.title || movie.name || '';
    var isTv  = !!(movie.number_of_seasons || movie.first_air_date || movie.name);

    var lastSE = movie.last_episode_to_air || {};
    var season  = parseInt((object.season  || movie.number_of_seasons || lastSE.season_number  || 1), 10) || 1;
    var episode = parseInt((object.episode || lastSE.episode_number || 1), 10) || 1;

    var runToken = 0;
    var added = 0;

    scroll.body().addClass('pl-list');

    function active() { return self._token === runToken; }

    function addStream(name, url) {
      if (!active()) return;
      added++;
      var key = (movie.original_title || title) + '|' + name + '|' +
                (isTv ? (season + ':' + episode) : '');
      var view = Lampa.Timeline.view(Lampa.Utils.hash(key));
      var el = { title: name, quality: 'auto', info: '', stream: url, timeline: view };
      var item = Lampa.Template.get('pl_item', el);
      item.append(Lampa.Timeline.render(view));
      item.on('hover:enter', function () {
        if (movie.id) Lampa.Favorite.add('history', movie, 100);
        Lampa.Player.play({
          url: el.stream,
          quality: false,
          timeline: el.timeline,
          title: title + ' / ' + name + (isTv ? ' / S' + season + 'E' + episode : '')
        });
      });
      scroll.append(item);
    }

    function sourceDone() {
      if (!active()) return;
      if (!added) {
        var empty = Lampa.Template.get('list_empty');
        if (empty && empty.length) {
          empty.find('.empty__descr').text(Lampa.Lang.translate('pl_noresults'));
          scroll.append(empty);
        }
      }
      if (self.activity) self.activity.loader(false);
      Lampa.Controller.toggle('content');
    }

    function seasonCount() {
      if (movie.number_of_seasons) return parseInt(movie.number_of_seasons, 10);
      if (Array.isArray(movie.seasons)) return movie.seasons.length;
      return 1;
    }

    function loadEpisodes(s, cb) {
      var api = Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb;
      if (api && api.get) {
        api.get('tv/' + movie.id + '/season/' + s, {}, function (data) {
          cb((data && data.episodes) || []);
        }, function () { cb([]); });
      } else cb([]);
    }

    function refresh() {
      self._token = ++runToken;
      added = 0;
      scroll.clear();
      if (self.activity) self.activity.loader(true);
      renderSelectors();
      run();
    }

    function chooseSeason() {
      var items = [];
      var totalSeasons = seasonCount() || 1;
      for (var i = 1; i <= totalSeasons; i++) {
        items.push({
          title: Lampa.Lang.translate('pl_season') + ' ' + i,
          season: i,
          selected: season === i
        });
      }
      if (!items.length) return;
      Lampa.Select.show({
        title: Lampa.Lang.translate('pl_season'),
        items: items,
        onSelect: function (item) {
          if (!item || !item.season) { Lampa.Select.close(); return; }
          season = item.season;
          episode = 1;
          Lampa.Select.close();
          refresh();
        }
      });
    }

    function chooseEpisode() {
      loadEpisodes(season, function (eps) {
        var items = [];
        if (eps && eps.length) {
          eps.forEach(function (ep) {
            var n = parseInt(ep.episode_number, 10);
            if (!n) return;
            items.push({
              title: Lampa.Lang.translate('pl_episode') + ' ' + n + (ep.name ? ' — ' + ep.name : ''),
              episode: n,
              selected: episode === n
            });
          });
        }

        if (!items.length) {
          for (var k = 1; k <= 24; k++) {
            items.push({
              title: Lampa.Lang.translate('pl_episode') + ' ' + k,
              episode: k,
              selected: episode === k
            });
          }
        }
        Lampa.Select.show({
          title: Lampa.Lang.translate('pl_episode'),
          items: items,
          onSelect: function (item) {
            if (!item || !item.episode) { Lampa.Select.close(); return; }
            episode = item.episode;
            Lampa.Select.close();
            refresh();
          }
        });
      });
    }

    function renderSelectors() {
      if (!isTv) return;
      var ICONS = {
        season: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 7h-2V3a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM9 4h6v3H9V4zm10 15H5V9h14v10zM7 12h5v2H7v-2z"/></svg>',
        episode: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5z"/></svg>'
      };
      var row = function (label, value, icon, handler) {
        var item = Lampa.Template.get('pl_select', { label: label, value: value, icon: icon });
        item.on('hover:enter', function () { handler(); });
        scroll.append(item);
      };
      row(Lampa.Lang.translate('pl_season'), season, ICONS.season, chooseSeason);
      row(Lampa.Lang.translate('pl_episode'), episode, ICONS.episode, chooseEpisode);
    }

    function run() {
      var token = runToken;
      if (!active()) return;
      var tmdb = movie.id;
      if (!tmdb) { dbg('no tmdb id'); return sourceDone(); }

      dbg('resolve', tmdb, isTv, season, episode);
      Lampa.Pl.resolve(tmdb, isTv, season, episode)
        .then(function (list) {
          if (token !== runToken) return;
          if (!list || !list.length) return sourceDone();
          list.forEach(function (s) {
            addStream(Lampa.Lang.translate('pl_source') + ' ' + (s.index + 1), s.url);
          });
          sourceDone();
        })
        .catch(function (err) {
          if (token !== runToken) return;
          dbg('failed', err && err.message);
          sourceDone();
        });
    }

    this.create = function () {
      self._token = runToken;
      if (self.activity) self.activity.loader(true);
      files.appendFiles(scroll.render());
      this.render();
      renderSelectors();
      run();
      return this.render();
    };

    this.start = function () {
      Lampa.Controller.add('content', {
        toggle: function () {
          Lampa.Controller.collectionSet(scroll.render(), files.render());
          Lampa.Controller.collectionFocus(false, scroll.render());
        },
        up:    function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
        down:  function () { Navigator.move('down'); },
        left:  function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
        right: function () { if (Navigator.canmove('right')) Navigator.move('right'); },
        back:  function () { self.back(); }
      });
      if (Lampa.Background && Lampa.Utils && Lampa.Utils.cardImgBackground) {
        try { Lampa.Background.immediately(Lampa.Utils.cardImgBackground(movie)); } catch (e) {}
      }
      Lampa.Controller.toggle('content');
    };

    this.render  = function () { return files.render(); };
    this.back    = function () { Lampa.Activity.backward(); };
    this.pause   = function () {};
    this.stop    = function () {};
    this.destroy = function () { files.destroy(); scroll.destroy(); };
  }


  function initLang() {
    Lampa.Lang.add({
      pl_title:     { en: 'Premium', ru: 'Premium', pt: 'Premium' },
      pl_settings:  { en: 'Premium', ru: 'Premium', pt: 'Premium' },
      pl_source:    { en: 'Source',  ru: 'Источник',     pt: 'Fonte' },
      pl_subtitle:  { en: 'Instant streams', ru: 'Мгновенный стриминг', pt: 'Streams instantâneos' },
      pl_empty:     { en: 'No available sources', ru: 'Нет доступных источников', pt: 'Nenhuma fonte disponÃvel' },
      pl_noresults: { en: 'No results for this title', ru: 'Нет результатов по этому тайтлу', pt: 'Nenhum resultado para este tÃ­tulo' },
      pl_debug:     { en: 'Show debug messages', ru: 'Показывать отладочные сообщения', pt: 'Mostrar mensagens de depuraÃ§Ã£o' },
      pl_season:    { en: 'Season',  ru: 'Сезон',  pt: 'Temporada' },
      pl_episode:   { en: 'Episode', ru: 'Серия',  pt: 'EpisÃ³dio' }
    });
  }

  function initStorage() {
    if (Lampa.Params && Lampa.Params.trigger) {
      Lampa.Params.trigger('pl_debug', false);
    }
  }

  function initTemplates() {
    Lampa.Template.add('pl_item',
      '<div class="online selector">' +
        '<div class="online__body">' +
          '<div style="position:absolute;left:0;top:-0.3em;width:2.4em;height:2.4em">' +
            '<svg style="height:2.4em;width:2.4em" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<circle cx="64" cy="64" r="56" stroke="white" stroke-width="16"/>' +
              '<path d="M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z" fill="white"/>' +
            '</svg>' +
          '</div>' +
          '<div class="online__title" style="padding-left:2.1em">{title}</div>' +
          '<div class="online__quality" style="padding-left:2.1em">{quality}{info}</div>' +
        '</div>' +
      '</div>');

    Lampa.Template.add('pl_select',
      '<div class="online pl-select selector">' +
        '<div class="online__body pl-select__body" style="display:flex;align-items:center;justify-content:space-between;gap:.9em;margin:.18em 0;padding:.6em .9em .6em 2.5em;background:rgba(60,140,255,.10);border:1px solid rgba(120,170,255,.28);border-radius:1.1em;position:relative">' +
          '<div style="position:absolute;left:.75em;top:50%;transform:translateY(-50%);width:1.25em;height:1.25em;color:#8FD0FF">{icon}</div>' +
          '<div style="font-size:1.04em;color:#f2f4f7;letter-spacing:.02em">{label}</div>' +
          '<div style="display:flex;align-items:center;gap:.45em;background:linear-gradient(135deg,#7DC6FF,#4C97FF);color:#07223a;font-weight:800;border-radius:.85em;padding:.3em .9em;font-size:1.12em;box-shadow:0 2px 8px rgba(70,130,255,.35)">' +
            '{value}<span style="opacity:.6;transform:translateY(-.05em)">&#8250;</span>' +
          '</div>' +
        '</div>' +
      '</div>');
  }




  function initMain() {
    Lampa.Component.add('pl', component);

    var button = '<div class="full-start__button selector view--pl" data-subtitle="pl">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 244 260" style="enable-background:new 0 0 512 512">' +
        '<path d="M242,88v170H10V88h41l-38,38h37.1l38-38h38.4l-38,38h38.4l38-38h38.3l-38,38H204L242,88L242,88z M228.9,2l8,37.7l0,0 L191.2,10L228.9,2z M160.6,56l-45.8-29.7l38-8.1l45.8,29.7L160.6,56z M84.5,72.1L38.8,42.4l38-8.1l45.8,29.7L84.5,72.1z M10,88 L2,50.2L47.8,80L10,88z" fill="currentColor"/>' +
      '</svg><span>#{pl_title}</span></div>';

    Lampa.Listener.follow('full', function (e) {
      if (e.type !== 'complite') return;
      var container = e.object.activity.render();
      if (container.find('.view--pl').length) return;
      var btn = $(Lampa.Lang.translate(button));
      btn.on('hover:enter', function () {
        var m = e.data.movie;
        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate('pl_title'),
          component: 'pl',
          search: m.title || m.name,
          movie: m,
          page: 1
        });
      });
      var anchor = container.find('.view--torrent');
      if (anchor.length) anchor.after(btn);
      else container.find('.full-start__buttons').append(btn);
    });
  }

  function initSettings() {
    Lampa.Template.add('settings_pl',
      '<div>' +
        '<div class="settings-param selector" data-name="pl_debug" data-type="toggle">' +
          '<div class="settings-param__name">#{pl_debug}</div><div class="settings-param__value"></div>' +
        '</div>' +
      '</div>');

    function addFolder() {
      if (!Lampa.Settings || !Lampa.Settings.main || !Lampa.Settings.main()) return;
      var body = Lampa.Settings.main().render();
      if (!body || !body.length) return;
      if (body.find('[data-component="pl"]').length) return;

      var field = $('<div class="settings-folder selector" data-component="pl">' +
        '<div class="settings-folder__icon">' +
          '<svg height="260" viewBox="0 0 244 260" fill="none">' +
            '<path d="M242,88v170H10V88h41l-38,38h37.1l38-38h38.4l-38,38h38.4l38-38h38.3l-38,38H204L242,88L242,88z" fill="white"/>' +
          '</svg>' +
        '</div>' +
        '<div class="settings-folder__name">' + Lampa.Lang.translate('pl_settings') + '</div>' +
      '</div>');

      var anchor = body.find('[data-component="more"]');
      if (anchor.length) anchor.after(field);
      else body.append(field);
      Lampa.Settings.main().update();
    }

    if (window.appready) addFolder();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') addFolder(); });
  }

  function startPlugin() {
    initLang();
    initStorage();
    initTemplates();
    initMain();
    initSettings();
  }

  if (window.appready) startPlugin();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });

})();
