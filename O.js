(function () {
  'use strict';

  function _d(s) { try { return atob(s); } catch (e) { return ''; } }

  var U = {
    VE: _d('aHR0cHM6Ly9hcGkuc3BlZWRyYWNlbGlnaHQuY29t')
  };
  var P = {
    seed:    _d('L3NlZWQ/bWVkaWFJZD0='),
    cdn:     _d('L2Nkbi9zb3VyY2VzLXdpdGgtdGl0bGU='),
    lamovie: _d('L2xhbW92aWUvc291cmNlcy13aXRoLXRpdGxl')
  };

  if (typeof window === 'undefined' || typeof Lampa === 'undefined') return;

  function initLang() {
    Lampa.Lang.add({
      online_nova_title:     { en: 'Nova', ru: 'Nova' },
      online_nova_settings:  { en: 'Nova', ru: 'Nova' },
      online_nova_subtitle:  { en: 'Instant streams', ru: 'Мгновенный стриминг' },
      online_nova_empty:     { en: 'No available sources', ru: 'Нет доступных источников' },
      online_nova_noresults: { en: 'No results for this title', ru: 'Нет результатов по этому тайтлу' },
      online_nova_debug:     { en: 'Show debug messages', ru: 'Показывать отладочные сообщения' },
      online_nova_src_a:     { en: 'Source A', ru: 'Источник A' },
      online_nova_season:    { en: 'Season', ru: 'Сезон' },
      online_nova_episode:   { en: 'Episode', ru: 'Серия' }
    });
  }

  function initStorage() {
    if (Lampa.Params && Lampa.Params.trigger) {
      Lampa.Params.trigger('online_nova_a', true);
      Lampa.Params.trigger('online_nova_debug', false);
    }
  }

  function dbg() {
    if (Lampa.Storage.field('online_nova_debug') === true && window.console) {
      try { console.log.apply(console, ['[Nova]'].concat([].slice.call(arguments))); } catch (e) {}
    }
  }

  function resetTemplates() {
    Lampa.Template.add('online_nova_item',
      '<div class="online selector">' +
        '<div class="online__body">' +
          '<div style="position:absolute;left:0;top:-0.3em;width:2.4em;height:2.4em">' +
            '<svg style="height:2.4em;width:2.4em" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">' +
              '<circle cx="64" cy="64" r="56" stroke="white" stroke-width="16"/>' +
              '<path d="M90.5 64.3827L50 87.7654L50 41L90.5 64.3827Z" fill="white"/>' +
            '</svg>' +
          '</div>' +
          '<div class="online__title" style="padding-left:2.1em">{title}</div>' +
          '<div class="online__quality" style="padding-left:3.4em">{quality}{info}</div>' +
        '</div>' +
      '</div>');

    Lampa.Template.add('online_nova_select',
      '<div class="online nova-select selector">' +
        '<div class="online__body nova-select__body" style="display:flex;align-items:center;justify-content:space-between;gap:.9em;margin:.18em 0;padding:.6em .9em .6em 2.5em;background:rgba(60,140,255,.10);border:1px solid rgba(120,170,255,.28);border-radius:1.1em;position:relative">' +
          '<div style="position:absolute;left:.75em;top:50%;transform:translateY(-50%);width:1.25em;height:1.25em;color:#8FD0FF">{icon}</div>' +
          '<div style="font-size:1.04em;color:#f2f4f7;letter-spacing:.02em">{label}</div>' +
          '<div style="display:flex;align-items:center;gap:.45em;background:linear-gradient(135deg,#7DC6FF,#4C97FF);color:#07223a;font-weight:800;border-radius:.85em;padding:.3em .9em;font-size:1.12em;box-shadow:0 2px 8px rgba(70,130,255,.35)">' +
            '{value}<span style="opacity:.6;transform:translateY(-.05em)">&#8250;</span>' +
          '</div>' +
        '</div>' +
      '</div>');
  }
var MAGIC = [109, 118, 109, 49];
  var HASH_TABLE = [1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580];
  function u32x(x){return x>>>0}
  function mul32(a,b){return Math.imul(a,b)>>>0}
  function rotl32(x,n){x>>>=0;n&=31;return n===0?x:((x<<n)|(x>>>(32-n)))>>>0}
  function hash32(x){x=u32x(x);x^=x>>>16;x=mul32(x,2246822507);x^=x>>>13;x=mul32(x,3266489909);x^=x>>>16;return u32x(x)}
  function fnv1a(s){var h=2166136261;for(var i=0;i<s.length;i++)h=mul32(h^s.charCodeAt(i),16777619);return hash32(h)}
  function initStream(seed,sk){
    var S=new Array(61);
    var a=u32x(hash32(fnv1a(seed)^hash32(u32x((sk>>>0)^2654435769))));
    for(var i=0;i<8;i++){
      if(((i*(i+1))&1)===0){
        var idx=a%61;
        a=rotl32(a+u32x(2654435769),7+(7&i));
        S[idx]=u32x(a^hash32(a));
        a=hash32(u32x(a+idx));
      } else { S[i]=HASH_TABLE[15&i]; }
    }
    return {S:S,acc:u32x(hash32(2779096485^a))};
  }
  function nextByte(st,ctr){
    var r=st.S,o=st.acc,n=o%61;
    var inSet=0-Number(n in r);
    var d=r[n]>>>0;
    var x=u32x(d^mul32(2654435769,ctr+1));
    var y=u32x((o^x)|(o&x&inSet));
    var no=hash32(u32x(rotl32(u32x(y+o),31&n)^rotl32(o,31&Math.imul(n,7)))+2654435769);
    r[n]=no>>>0;st.acc=no;return no>>>0;
  }
  function keystream(seed,sk,len){
    var st=initStream(seed,sk),out=new Uint8Array(len),ctr=0;
    for(var i=0;i<len;){
      var b=nextByte(st,ctr++);
      out[i++]=255&b;
      if(i<len) out[i++]=(b>>>8)&255;
      if(i<len) out[i++]=(b>>>16)&255;
      if(i<len) out[i++]=(b>>>24)&255;
    }
    return out;
  }
  function b64Bytes(b64){
    var s=String(b64).replace(/-/g,'+').replace(/_/g,'/');
    while(s.length%4) s+='=';
    var bin=atob(s),out=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
    return out;
  }
  function toUtf8(bytes){
    if(typeof TextDecoder!=='undefined'){try{return new TextDecoder('utf-8').decode(bytes)}catch(e){}}
    var s='';for(var i=0;i<bytes.length;i++)s+=String.fromCharCode(bytes[i]);
    try{return decodeURIComponent(escape(s))}catch(e){return s}
  }
  function decryptPayload(payload,seed,sk){
    var data=b64Bytes(payload);
    var ks=keystream(seed,sk,data.length);
    for(var i=0;i<data.length;i++) data[i]^=ks[i];
    for(var j=0;j<MAGIC.length;j++) if(data[j]!==MAGIC[j]) throw new Error('bad payload');
    return toUtf8(data.subarray(MAGIC.length));
  }
function component(object) {
    var self    = this;
    var network = new Lampa.Reguest();
    var scroll  = new Lampa.Scroll({ mask: true, over: true });
    var files   = new Lampa.Explorer(object);

    var movie   = object.movie || object;
    var title   = object.search || movie.title || movie.name || '';
    var isTv    = !!(movie.number_of_seasons || movie.first_air_date || movie.name);

    // NOTE: do NOT hard-code to 1. Default to the last season (Lampa convention)
    // and let the user change season/episode via the in-component selector.
    var lastSE  = movie.last_episode_to_air || {};
    var season  = parseInt((object.season || movie.number_of_seasons || lastSE.season_number || 1), 10) || 1;
    var episode = parseInt((object.episode || lastSE.episode_number || 1), 10) || 1;

    // Guards against stale async responses when the user switches S/E mid-request.
    var runToken = 0;

    var enabled = {
      a: Lampa.Storage.field('online_nova_a') === true
    };
    var total = (enabled.a?1:0);
    var done = 0, added = 0;

    scroll.body().addClass('torrent-list');

    function active() {
      return self._token === runToken;
    }

    function addStream(name, url, subs) {
      if (!active()) return;
      added++;
      var hash = Lampa.Utils.hash((movie.original_title || title) + '|' + name + '|' + (isTv ? (season+':'+episode) : ''));
      var view = Lampa.Timeline.view(hash);
      var el = {
        title: name,
        quality: '360p ~ 1080p',
        info: (subs && subs.length) ? ' / ' + subs.length + ' subs' : '',
        stream: url,
        subtitles: (subs && subs.length) ? subs : false,
        timeline: view
      };
      var item = Lampa.Template.get('online_nova_item', el);
      item.append(Lampa.Timeline.render(view));

      item.on('hover:enter', function () {
        if (movie.id) Lampa.Favorite.add('history', movie, 100);
        Lampa.Player.play({
          url: el.stream,
          quality: false,
          subtitles: el.subtitles,
          timeline: el.timeline,
          title: title + ' / ' + name + (isTv ? ' / S' + season + 'E' + episode : '')
        });
      });
      scroll.append(item);
    }

    function sourceDone() {
      if (!active()) return;
      done++;
      if (done < total) return;
      if (!added) {
        var empty = Lampa.Template.get('list_empty');
        if (empty && empty.length) empty.find('.empty__descr').text(Lampa.Lang.translate('online_nova_noresults'));
        scroll.append(empty);
      }
      if (self.activity) {
        self.activity.loader(false);
        Lampa.Controller.toggle('content');
      }
    }

    function seasonCount() {
      if (movie.number_of_seasons) return parseInt(movie.number_of_seasons, 10);
      if (Array.isArray(movie.seasons)) return movie.seasons.length;
      return 1;
    }

    // Load the list of episodes for a season from TMDB.
    function loadEpisodes(s, cb) {
      var tmdb = Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb;
      if (tmdb && tmdb.get) {
        tmdb.get('tv/' + movie.id + '/season/' + s, {}, function (data) {
          cb((data && data.episodes) || []);
        }, function () {
          cb([]);
        });
      } else {
        cb([]);
      }
    }

    function refresh() {
      self._token = ++runToken;   // any in-flight request is now stale
      done = 0;
      added = 0;
      scroll.clear();
      if (self.activity) self.activity.loader(true);
      renderSelectors();
      runA();
    }

    function chooseSeason() {
      var items = [];
      var totalSeasons = seasonCount() || 1;
      for (var i = 1; i <= totalSeasons; i++) {
        items.push({
          title: Lampa.Lang.translate('online_nova_season') + ' ' + i,
          season: i,
          selected: season === i
        });
      }
      if (!items.length) return;
      Lampa.Select.show({
        title: Lampa.Lang.translate('online_nova_season'),
        items: items,
        onSelect: function (item) {
          if (!item || !item.season) { Lampa.Select.close(); return; }
          season = item.season;
          episode = 1; // reset to the first episode when the season changes
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
              title: Lampa.Lang.translate('online_nova_episode') + ' ' + n + (ep.name ? ' — ' + ep.name : ''),
              episode: n,
              selected: episode === n
            });
          });
        }
        // Fallback if TMDB failed / no episode data: numeric chooser.
        if (!items.length) {
          for (var k = 1; k <= 24; k++) {
            items.push({
              title: Lampa.Lang.translate('online_nova_episode') + ' ' + k,
              episode: k,
              selected: episode === k
            });
          }
        }
        Lampa.Select.show({
          title: Lampa.Lang.translate('online_nova_episode'),
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
        var item = Lampa.Template.get('online_nova_select', {
          label: label,
          value: value,
          icon: icon
        });
        item.on('hover:enter', function () { handler(); });
        scroll.append(item);
      };
      row(Lampa.Lang.translate('online_nova_season'), season, ICONS.season, chooseSeason);
      row(Lampa.Lang.translate('online_nova_episode'), episode, ICONS.episode, chooseEpisode);
    }
function runA() {
      var token = runToken;
      if (!active()) return;
      if (!enabled.a) return sourceDone();
      var tmdb = movie.id;
      var imdb = movie.imdb_id || '';
      var year = String(movie.release_date || movie.first_air_date || '').slice(0, 4);
      if (!tmdb) { dbg('a: no id'); return sourceDone(); }

      network.clear(); network.timeout(15000);
      network["native"](U.VE + P.seed + tmdb, function (sd) {
        if (token !== runToken) return;
        var seed = sd && sd.seed;
        if (!seed) { dbg('a: no seed'); return sourceDone(); }
        var servers = [
          [Lampa.Lang.translate('online_nova_src_a'), U.VE + P.cdn],
          [Lampa.Lang.translate('online_nova_src_a') + ' 2', U.VE + P.lamovie]
        ];
        var i = 0;
        (function next() {
          if (token !== runToken) return;
          if (i >= servers.length) { dbg('a: no stream'); return sourceDone(); }
          var nm = servers[i][0], base = servers[i][1]; i++;
          var url = base
            + '?title='     + encodeURIComponent(title)
            + '&mediaType=' + (isTv ? 'TV%20Series' : 'Movie')
            + '&year='      + year
            + '&tmdbId='    + tmdb
            + '&imdbId='    + (imdb || '')
            + '&enc=2&seed=' + encodeURIComponent(seed);
          if (isTv) url += '&seasonId=' + season + '&episodeId=' + episode;

          network.clear(); network.timeout(15000);
          network["native"](url, function (enc) {
            if (token !== runToken) return;
            if (!enc || enc.length < 20 || enc.charAt(0) === '<') return next();
            try {
              var data = JSON.parse(decryptPayload(enc, seed, String(tmdb)));
              var first = data.sources && data.sources[0];
              var playlist = data.playlist || (first && first.url);
              var subs = (Array.isArray(data.subtitles) ? data.subtitles : [])
                .filter(function (s) { return s && s.url; })
                .map(function (s, k) { return { label: s.label || s.lang || ('Sub ' + (k + 1)), url: s.url }; });
              if (playlist && playlist.indexOf('.m3u8') !== -1) {
                dbg('a: ok', isTv ? ('S' + season + 'E' + episode) : '');
                addStream(nm, playlist, subs);
                return sourceDone();
              }
            } catch (e) { dbg('a: decrypt fail', e && e.message); }
            next();
          }, function (a) { dbg('a: http', a && a.status); next(); }, false, { dataType: 'text' });
        })();
      }, function (a) { dbg('a: seed fail', a && a.status); sourceDone(); });
    }

    this.create = function () {
      self._token = runToken;
      if (self.activity) self.activity.loader(true);
      files.appendFiles(scroll.render());
      this.render();

      if (total === 0) {
        var empty = Lampa.Template.get('list_empty');
        if (empty && empty.length) empty.find('.empty__descr').text(Lampa.Lang.translate('online_nova_empty'));
        scroll.append(empty);
        if (self.activity) self.activity.loader(false);
        return this.render();
      }

      renderSelectors();
      runA();
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
    this.destroy = function () {
      network.clear();
      files.destroy();
      scroll.destroy();
    };
  }
function initMain() {
    resetTemplates();
    Lampa.Component.add('online_nova', component);

    var button = '<div class="full-start__button selector view--online_nova" data-subtitle="online_nova">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 244 260" style="enable-background:new 0 0 512 512">' +
        '<path d="M242,88v170H10V88h41l-38,38h37.1l38-38h38.4l-38,38h38.4l38-38h38.3l-38,38H204L242,88L242,88z M228.9,2l8,37.7l0,0 L191.2,10L228.9,2z M160.6,56l-45.8-29.7l38-8.1l45.8,29.7L160.6,56z M84.5,72.1L38.8,42.4l38-8.1l45.8,29.7L84.5,72.1z M10,88 L2,50.2L47.8,80L10,88z" fill="currentColor"/>' +
      '</svg><span>#{online_nova_title}</span></div>';

    Lampa.Listener.follow('full', function (e) {
      if (e.type !== 'complite') return;
      var container = e.object.activity.render();
      if (container.find('.view--online_nova').length) return;
      var btn = $(Lampa.Lang.translate(button));
      btn.on('hover:enter', function () {
        var m = e.data.movie;
        Lampa.Activity.push({
          url: '',
          title: Lampa.Lang.translate('online_nova_title'),
          component: 'online_nova',
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
    Lampa.Template.add('settings_online_nova',
      '<div>' +
        '<div class="settings-param selector" data-name="online_nova_a" data-type="toggle">' +
          '<div class="settings-param__name">#{online_nova_src_a}</div><div class="settings-param__value"></div>' +
        '</div>' +
        '<div class="settings-param selector" data-name="online_nova_debug" data-type="toggle">' +
          '<div class="settings-param__name">#{online_nova_debug}</div><div class="settings-param__value"></div>' +
        '</div>' +
      '</div>');

    function addFolder() {
      if (!Lampa.Settings || !Lampa.Settings.main || !Lampa.Settings.main()) return;
      var body = Lampa.Settings.main().render();
      if (!body || !body.length) return;
      if (body.find('[data-component="online_nova"]').length) return;

      var field = $('<div class="settings-folder selector" data-component="online_nova">' +
        '<div class="settings-folder__icon">' +
          '<svg height="260" viewBox="0 0 244 260" fill="none">' +
            '<path d="M242,88v170H10V88h41l-38,38h37.1l38-38h38.4l-38,38h38.4l38-38h38.3l-38,38H204L242,88L242,88z" fill="white"/>' +
          '</svg>' +
        '</div>' +
        '<div class="settings-folder__name">' + Lampa.Lang.translate('online_nova_settings') + '</div>' +
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
    initMain();
    initSettings();
  }

  if (window.appready) startPlugin();
  else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') startPlugin(); });

})();
