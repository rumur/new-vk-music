(function (window, undefined) {

  class RumurMusicVK {
    constructor() {
      this.foundClassName = 'js-rumur-found';
      this.querySelector = `._audio_row:not(.${this.foundClassName}):not(.audio_page_player)`;
      this.elements = [];
      this.intervalID = null;
      this.updateTreshold = 500;

      this.onClick = this.onClick.bind(this);
      this.onVisibility = this.onVisibility.bind(this);

      this.addEventListeners();
      this.setSpy();
      this.update();
    }

    setSpy() {
      const head = document.getElementsByTagName('head')[0];
      let script = document.createElement('script');

      script.innerHTML = `
        function rumurSpy(btn) {
          var element = domClosest("_audio_row", btn);
          var utils = AudioUtils.getContextPlaylist(element);
          var audioTarget = utils.getAudio(btn.dataset.fullId);
         
          if (audioTarget[2]) {
            btn.dataset.src = audioTarget[2];
            btn.dataset.loaded = 1;
          } else {
            ajax.post("al_audio.php", {
              act: "reload_audio",
              ids: btn.dataset.fullId
            }, {
              onDone: function(response) {
                response.map((i) => btn.dataset.src = i[2]);
                btn.dataset.loaded = 1;
              }
            })
          }
        }
      `;

      head.appendChild(script);
    }

    getElements() {
      if (!this.elements.length) {
        this.elements = Array.from(document.querySelectorAll(this.querySelector));
      }

      return this.elements;
    }

    clearElements() {
      return this.elements = [];
    }

    onVisibility() {
      if (document.hidden) {
        clearInterval(this.intervalID);
      } else {
        this.update();
      }
    }

    insertDownloadElement(parentNode) {
      const atts = JSON.parse(parentNode.dataset.audio);
      let btn = document.createElement('span');

      btn.classList.add('js-rumur-dwl-btn');

      btn.setAttribute('onclick', 'rumurSpy(this)');

      btn.dataset.fullId = parentNode.dataset.fullId;
      btn.dataset.title = atts[3] || 'NoTitle';
      btn.dataset.singer = atts[4] || 'NoSinger';
      btn.dataset.src = '';
      btn.dataset.loaded = 0;

      btn.addEventListener('click', (evt) => this.onClick(evt, btn));
      parentNode.insertBefore(btn, parentNode.children[1]);
    }

    onClick(evt, btn) {
      let intID;
      if (btn.dataset.loaded === '1') {
        this.browserDownloadAction(btn);
      } else {
        if (!intID) {
          intID = setInterval( () => {
            if (btn.dataset.loaded === '1') {
              clearInterval(intID);
              this.browserDownloadAction(btn);
            }
          }, 100);
        }
      }
      evt.cancelBubble = true;
    }

    browserDownloadAction(btn) {
      let filename = `${btn.dataset.singer} - ${btn.dataset.title}`;
      filename = this.sanitizeFilename(filename);
      chrome.runtime.sendMessage({
        action: 'downloadFile',
        url: btn.dataset.src,
        name: `${filename}.mp3`
      });
    }

    sanitizeFilename(filename) {
      return filename.replace(/[`"/:\*\?]|[<|>]/g, "");
    }

    update() {
      this.intervalID = setInterval(() => {
        this.elements = this.getElements();
        if (this.elements.length) {
          this.elements.map((audio) => {
            audio.classList.add(this.foundClassName);
            this.insertDownloadElement(audio);
          });
          this.clearElements();
        }
      }, this.updateTreshold);
    }

    addEventListeners() {
      document.addEventListener('visibilitychange', this.onVisibility);
    }

  }
  
  window.addEventListener('load', () => new RumurMusicVK);

})(window);