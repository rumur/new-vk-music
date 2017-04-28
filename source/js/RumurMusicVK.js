(function (window, undefined) {

  class RumurMusicVK {
    constructor() {
      this.foundClassName = 'js-rumur-found';
      this.audioSelector = 
      `._audio_row:not(.${this.foundClassName}):not(.audio_page_player):not(.claimed)`;
      this.playlistSelector = `._wall_audio_rows:not(.${this.foundClassName})`;
      this.downloadBtnClassName = 'js-rumur-dwl-btn';
      this.audioElements = [];
      this.playlistElements = [];
      this.audioIntervalID = null;
      this.playlistIntervalID = null;
      this.updateTreshold = 500;
      this.iAmLoading = false;

      this.onAudioClick = this.onAudioClick.bind(this);
      this.onPlaylistClick = this.onPlaylistClick.bind(this);
      this.onVisibility = this.onVisibility.bind(this);

      this.addEventListeners();
      this.setSpy();
      this.fire();
    }

    setSpy() {
      const head = document.getElementsByTagName('head')[0];
      let script = document.createElement('script');

      script.innerHTML = `
        function rumurSingleSpy(btn) {
          var element = domClosest("_audio_row", btn);
          var utils = AudioUtils.getContextPlaylist(element);
          var audioTarget = utils.getAudio(btn.dataset.fullId);
          
          if (audioTarget !== null) {
            if (audioTarget[2]) {
              btn.dataset.src = unmaskAudioUrl(audioTarget[2]);
              btn.dataset.loaded = 1;
            } else {
              ajax.post("al_audio.php", {
                act: "reload_audio",
                al: 1,
                ids: btn.dataset.fullId
              }, {
                onDone: function(response) {
                  response.map((i) => {
                    const unavailable_url_with_extra = i[2];
                    const hopeItValidUrl = unmaskAudioUrl(unavailable_url_with_extra);

                    return btn.dataset.src = hopeItValidUrl;
                  });
                  btn.dataset.loaded = 1;
                }
              })
            }
          }
        }

        function rumurPlaylistSpy(btn) {
          ajax.post("al_audio.php", {
            act: "reload_audio",
            ids: btn.dataset.idPack
          }, {
            onDone: function(response) {
              var source = [];
              response.map((i) => {
                let innerSrc = {
                  url: unmaskAudioUrl(i[2]),
                  name: i.slice(3, 5).reverse().join(' - '),
                };
                source.push(JSON.stringify(innerSrc));
              });
              btn.dataset.src = "[" + source + "]";
              btn.dataset.loaded = 1;
            }
          })
        }

        function unmaskAudioUrl(t) {
          if (~t.indexOf("audio_api_unavailable")) {
              var i = t.split("?extra=")[1].split("#"),
                  e = checkHash(i[1]);
              if (i = checkHash(i[0]), !e || !i)
                  return t;
              e = e.split(String.fromCharCode(9));
              for (var a, r, l = e.length; l--;) {
                  if (r = e[l].split(String.fromCharCode(11)),
                      a = r.splice(0, 1, i)[0], !s[a])
                      return t;
                  i = s[a].apply(null, r)
              }
              if (i && "http" === i.substr(0, 4))
                  return i
          }
          return t;
        }

        function checkHash(t) {
            if (!t || t.length % 4 == 1)
                return !1;
            for (var i, e, o = 0, s = 0, r = ""; e = t.charAt(s++);)
                e = a.indexOf(e), ~e && (i = o % 4 ? 64 * i + e : e,
                    o++ % 4) && (r += String.fromCharCode(255 & i >> (-2 * o & 6)));
            return r
        }

        var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=",
            s = {
              v: function(t) {
                  return t.split("").reverse().join("")
              },
              r: function(t, i) {
                  t = t.split("");
                  for (var e, o = a + a, s = t.length; s--;)
                      e = o.indexOf(t[s]), ~e && (t[s] = o.substr(e - i, 1));
                  return t.join("")
              },
              x: function(t, i) {
                  var e = [];
                  return i = i.charCodeAt(0),
                      each(t.split(""), function(t, o) {
                          e.push(String.fromCharCode(o.charCodeAt(0) ^ i))
                      }),
                      e.join("")
              }
          };
      `;

      head.appendChild(script);
    }

    fire() {
      this.updateAudio();
      this.updatePlayList();
    }

    getAudioElements() {
      if (!this.audioElements.length) {
        this.audioElements = this.getElements(this.audioSelector);
      }

      return this.audioElements;
    }

    getPlaylistElements() {
      if (!this.playlistElements.length) {
        this.playlistElements = this.getElements(this.playlistSelector);
      }

      return this.playlistElements;
    }

    getElements(selector) {
      return Array.from(document.querySelectorAll(selector));
    }

    getPlaylistStack(element) {
      return Array.from(element.closest('.post_info')
                        .querySelectorAll(`.${this.downloadBtnClassName}`));
    }

    clearAudioElements() {
      return this.audioElements = [];
    }

    clearPlaylistElements() {
      return this.playlistElements = [];
    }

    onVisibility() {
      if (document.hidden) {
        clearInterval(this.audioIntervalID);
        clearInterval(this.playlistIntervalID);
      } else {
        this.fire();
      }
    }

    insertAudioDownloadElement(parentNode) {
      const atts = JSON.parse(parentNode.dataset.audio);
      let btn = document.createElement('div');
      const innerCoverNode = parentNode.querySelector('.audio_row_inner');
      
      btn.classList.add(this.downloadBtnClassName);

      btn.setAttribute('onclick', 'rumurSingleSpy(this)');

      btn.dataset.fullId = parentNode.dataset.fullId;
      btn.dataset.title = atts[3] || 'NoTitle';
      btn.dataset.singer = atts[4] || 'NoSinger';
      btn.dataset.src = '';
      btn.dataset.loaded = 0;

      btn.addEventListener('click', (evt) => this.onAudioClick(evt, btn));
      innerCoverNode.insertBefore(btn, innerCoverNode.querySelector('.audio_info'));
    }

    insertPlaylistDownloadElement(parentNode, count = 0, packIds = []) {
      const wrap = document.createElement('div');
      const icon = document.createElement('i');
      const title = document.createElement('span');
      const counter = document.createElement('span');

      wrap.classList.add('_rumur_pl_wrap');
      icon.classList.add('_icon');
      title.classList.add('_rumur_pl_link');
      counter.classList.add('_rumur_pl_count');

      title.innerText = 'Download';
      counter.innerText = count;

      wrap.appendChild(icon);
      wrap.appendChild(title);
      wrap.appendChild(counter);

      parentNode.appendChild(wrap);
      wrap.dataset.idPack = packIds;
      wrap.dataset.loaded = 0;
      wrap.dataset.src = [];
      wrap.setAttribute('onclick', 'rumurPlaylistSpy(this)');
      wrap.addEventListener('click', (evt) => this.onPlaylistClick(evt, wrap));
    }

    onAudioClick(evt, btn) {
      let intID;
      let stack = [];
      if (btn.dataset.loaded === '1') {
        stack = [{
          name: `${btn.dataset.singer} - ${btn.dataset.title}`,
          url: btn.dataset.src,
        }];
        this.browserDownloadAction(stack);
      } else {
        if (!intID) {
          intID = setInterval( () => {
            if (btn.dataset.loaded === '1') {
              clearInterval(intID);
               stack = [{
                name: `${btn.dataset.singer} - ${btn.dataset.title}`,
                url: btn.dataset.src,
              }];
              this.browserDownloadAction(stack);
            }
          }, 100);
        }
      }
      evt.cancelBubble = true;
    }

    onPlaylistClick(evt, wrapper) {
      let intID;
      let stack = [];
      if (wrapper.dataset.loaded === '1') {
        stack = JSON.parse(wrapper.dataset.src);
        this.browserDownloadAction(stack);
      } else {
        if (!intID) {
          intID = setInterval( () => {
            if (wrapper.dataset.loaded === '1') {
              clearInterval(intID);
              stack = JSON.parse(wrapper.dataset.src);
              this.browserDownloadAction(stack);
            }
          }, 100);
        }
      }
    }

    browserDownloadAction(stack = []) {
      if (!stack.length) {
        return;
      }
      stack.map((item, index) => {
        stack[index].name = `${this.sanitizeFilename(item.name)}.mp3`;
      });
      chrome.runtime.sendMessage({
        action: 'downloadFile',
        stack: stack,
      });
    }

    sanitizeFilename(filename) {
      filename = this.htmlEntities(filename);
      filename = filename.replace(/(<([^>]+)>)|[`~"/:\*\?]|[<|>]/ig, '');
      return filename;
    }

    htmlEntities(str) {
      return String(str).replace(/\&amp;/mg, '&')
          .replace(/\&quot;/mg, '"')
          .replace(/\&quote;/mg, '"')
          .replace(/\&#0?95;/mg, '_')
          .replace(/\&#0?39;/mg, "'")
          .replace(/\&#0?34;/mg, '"')
          .replace(/\&#0?62;/mg, '>')
          .replace(/\&#0?60;/mg, '<');
    }

    updateAudio() {
      this.audioIntervalID = setInterval(() => {
        this.audioElements = this.getAudioElements();
        if (this.audioElements.length) {
          this.audioElements.map((audio) => {
            audio.classList.add(this.foundClassName);
            this.insertAudioDownloadElement(audio);
          });
          this.clearAudioElements();
        }
      }, this.updateTreshold);
    }

    updatePlayList() {
      this.playlistIntervalID = setInterval(() => {
        this.playlistElements = this.getPlaylistElements();
        if (this.playlistElements.length) {
          this.playlistElements.map((playList) => {
            playList.classList.add(this.foundClassName);
            const children = Array.from(playList.children);
            const claimed = playList.querySelectorAll('.claimed');
            const count = children.length - claimed.length;
            let packIds = [];
            if (count > 2) {
              children.map((child) => packIds.push(child.dataset.fullId));
              const playListWrap = 
              playList.closest('.post_info').querySelector('.post_full_like');
              this.insertPlaylistDownloadElement(playListWrap, count, packIds);
            }
          });
          this.clearPlaylistElements();
        }
      }, this.updateTreshold);
    }

    addEventListeners() {
      document.addEventListener('visibilitychange', this.onVisibility);
    }

  }
  
  window.addEventListener('load', () => new RumurMusicVK);

})(window);
