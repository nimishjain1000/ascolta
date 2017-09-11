(function($){

  var pluginName = "jAudio",
      defaults = {
        defaultAlbum: undefined,
        defaultArtist: undefined,
        defaultTrack: 0,
      };

  function Plugin( $context, options )
  {
    this.settings         = $.extend( true, defaults, options );
    this.$context         = $context;
    this.domAudio         = this.$context.find("audio")[0];
    this.$domPlaylist     = this.$context.find(".jAudio--playlist");
    this.$domControls     = this.$context.find(".jAudio--controls");
    this.$domVolumeBar    = this.$context.find(".jAudio--volume");
    this.$domDetails      = this.$context.find(".jAudio--details");
    this.$domStatusBar    = this.$context.find(".jAudio--status-bar");
    this.$domProgressBar  = this.$context.find(".jAudio--progress-bar-wrapper");
    this.$domTime         = this.$context.find(".jAudio--time");
    this.$domElapsedTime  = this.$context.find(".jAudio--time-elapsed");
    this.$domTotalTime    = this.$context.find(".jAudio--time-total");
    this.$domThumb        = this.$context.find(".jAudio--thumb");
    this.currentState       = "pause";
    this.currentTrack       = this.settings.defaultTrack;
    this.currentElapsedTime = undefined;
    this.timer              = undefined;
    this.init();
  }

  Plugin.prototype = {

    init: function()
    {
      var self = this;
      self.renderPlaylist();
      self.preLoadTrack();
      self.highlightTrack();
      self.updateTotalTime();
      self.events();
      self.domAudio.volume = 1;
      window.jAudioCore = self;
    },

    play: function($btn)
    {
      var self = this;
      self.domAudio.play();
      if(self.currentState === "play") return;
      clearInterval(self.timer);
      self.timer = setInterval( self.run.bind(self), 50 );
      self.currentState = "play";
      $btn.data("action", "pause");
      $btn.html('<i class="fa fa-fw fa-pause"></i>')
    },

    pause: function($btn)
    {
      var self        = this;
      self.domAudio.pause();
      clearInterval(self.timer);
      self.currentState = "pause";
      $btn.data("action", "play");
      $btn.html('<i class="fa fa-fw fa-play"></i>');
    },

    stop: function($btn)
    {
      var self = this;
      self.domAudio.pause();
      self.domAudio.currentTime = 0;
      self.animateProgressBarPosition();
      clearInterval(self.timer);
      self.updateElapsedTime();
      self.currentState = "stop";
    },

    prev: function($btn)
    {
      var self  = this,
          track;
      (self.currentTrack === 0)
        ? track = window.playlist.length - 1
        : track = self.currentTrack - 1;
      self.changeTrack(track);
    },

    next: function($btn)
    {
      var self = this,
          track;
      (self.currentTrack === window.playlist.length - 1)
        ? track = 0
        : track = self.currentTrack + 1;
      self.changeTrack(track);
    },

    preLoadTrack: function()
    {
      var self      = this,
          defTrack  = self.settings.defaultTrack;
      self.changeTrack(defTrack);
      self.stop();
    },

    changeTrack: function(index)
    {
      var self = this;
      self.currentTrack  = index;
      self.domAudio.src  = window.playlist[index].file;
      if(self.currentState === "play") self.play();
      self.highlightTrack();
      self.updateThumb();
      self.renderDetails();
    },

    events: function()
    {
      var self = this;
      self.$domControls.on("click", ".jAudio--control", function()
      {

        var $btn    = $(this),
            action  = $btn.data("action")
        ;

        switch( action )
        {
          case "prev": self.prev.call(self, $btn); break;
          case "next": self.next.call(self, $btn); break;
          case "pause": self.pause.call(self, $btn); break;
          case "stop": self.stop.call(self, $btn); break;
          case "play": self.play.call(self, $btn); break;
        };

      });

      // - playlist events
      self.$domPlaylist.on("click", ".jAudio--playlist-item", function(e)
      {
        var item = $(this),
            track = item.data("track"),
            index = item.index();

        if(self.currentTrack === index) return;

        self.changeTrack(index);
      });

      self.$domProgressBar.on("click", function(e)
      {
        self.updateProgressBar(e);
        self.updateElapsedTime();
      });

      $(self.domAudio).on("loadedmetadata", function()
      {
        self.animateProgressBarPosition.call(self);
        self.updateElapsedTime.call(self);
        self.updateTotalTime.call(self);
      });
    },


    getAudioSeconds: function(string)
    {
      var self    = this,
          string  = string % 60;
          string  = self.addZero( Math.floor(string), 2 );

      (string < 60) ? string = string : string = "00";

      return string;
    },

    getAudioMinutes: function(string)
    {
      var self    = this,
          string  = string / 60;
          string  = self.addZero( Math.floor(string), 2 );

      (string < 60) ? string = string : string = "00";

      return string;
    },

    addZero: function(word, howManyZero)
    {
      var word = String(word);

      while(word.length < howManyZero) word = "0" + word;

      return word;
    },

    removeZero: function(word, howManyZero)
    {
      var word  = String(word),
          i     = 0;

      while(i < howManyZero)
      {
        if(word[0] === "0") { word = word.substr(1, word.length); } else { break; }

        i++;
      }

      return word;
    },

    highlightTrack: function()
    {
      var self      = this,
          tracks    = self.$domPlaylist.children(),
          className = "active";

      tracks.removeClass(className);
      tracks.eq(self.currentTrack).addClass(className);
    },

    renderDetails: function()
    {
      var self          = this,
          track         = window.playlist[self.currentTrack],
          file          = track.file,
          thumb         = track.thumb,
          trackName     = track.trackName,
          trackArtist   = track.trackArtist,
          id            = track.id,
          template      =  "";
          template += "<p>";
          template += "<span id='currentTrack' data-id='"+id+"' data-title='"+trackName+"' data-artist='"+trackArtist+"'>" + trackName + "</span>";
          template += "<span>" + trackArtist + "</span>";
          template += "</p>";
      self.$domDetails.html(template);
    },

    renderPlaylist: function()
    {
      var self = this,
          template = "";


      $.each(window.playlist, function(i, a)
      {
        var file          = a["file"],
            thumb         = a["thumb"],
            trackName     = a["trackName"],
            trackArtist   = a["trackArtist"],
            id            = a["id"],
            trackDuration = "00:00";

        template += "<div class='jAudio--playlist-item' data-track='" + file + "' data-id='"+id+"'>";
        template += "<div class='jAudio--playlist-thumb'><img src='"+ thumb +"'></div>";
        template += "<div class='jAudio--playlist-meta'>";
        template += "<p class='jAudio--playlist-meta-track-name'>" + trackName.substring(0,48) + " ...</p>";
        template += "<p class='jAudio--playlist-meta-track-artist'>" + trackArtist + "</p>";
        template += "</div>";
        template += "</div>";

      // });

      });

      self.$domPlaylist.html(template);

    },

    run: function()
    {
      var self = this;

      self.animateProgressBarPosition();
      self.updateElapsedTime();

      if(self.domAudio.ended) self.next();
    },

    animateProgressBarPosition: function()
    {
      var self        = this,
          percentage = (self.domAudio.currentTime * 100 / window.playlist[self.currentTrack].trackSeconds),
          styles      = { "width": percentage  + "%"};
      self.$domProgressBar.children().eq(0).css(styles);
    },

    updateProgressBar: function(e)
    {
      var self = this,
          mouseX,
          percentage,
          newTime;
      if(e.offsetX) mouseX = e.offsetX;
      if(mouseX === undefined && e.layerX) mouseX = e.layerX;
      percentage  = mouseX / self.$domProgressBar.width();
      newTime = window.playlist[self.currentTrack].trackSeconds * percentage;
      self.domAudio.currentTime = newTime;
      self.animateProgressBarPosition();
    },

    updateElapsedTime: function()
    {
      var self      = this,
          time      = self.domAudio.currentTime,
          minutes   = self.getAudioMinutes(time),
          seconds   = self.getAudioSeconds(time),
          audioTime = minutes + ":" + seconds;
      self.$domElapsedTime.text( audioTime );
    },

    updateTotalTime: function()
    {
      var self      = this;
      self.$domTotalTime.text( window.playlist[self.currentTrack]['trackDuration'] );
    },

    updateThumb: function()
    {
      var self = this,
          thumb = window.playlist[self.currentTrack].thumb,
          styles = {
            "background-image": "url(" + thumb + ")"
          };

      self.$domThumb.css(styles);
    },

  }

  $.fn[pluginName] = function( options )
  {
    var instantiate = function()
    {
      return new Plugin( $(this), options );
    }

    $(this).each(instantiate);
  }

})(jQuery)