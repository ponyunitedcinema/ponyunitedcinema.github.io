if (window.swfobject === undefined) window.swfobject = null;
window.open = function() { return null; }; // prevent popups

var theater = {

	playerContainer: null,
	playerContent: null,
	// closedCaptions: false,
	// language: "en",
	hdPlayback: false,
	player: null,
	volume: 25,
	syncMaxDiff: 5,

	getPlayerContainer: function() {
		if ( this.playerContainer === null ) {
			this.playerContainer = document.getElementById('player-container') ||
				document.createElement('div');
		}
		return this.playerContainer;
	},

	getPlayerContent: function() {
		if ( this.playerContent === null ) {
			this.playerContent = document.getElementById('content') ||
				document.createElement('div');
		}
		return this.playerContent;
	},

	resetPlayer: function() {
		if ( this.player ) {
			this.player.onRemove();
			delete this.player;
		}
		this.getPlayerContainer().innerHTML = "<div id='player'></div>";
	},

	enablePlayer: function() {
		// Show player
		var player = this.getPlayerContainer();
		player.style.display = "block";

		// Hide content
		var content = this.getPlayerContent();
		content.style.display = "none";
	},

	disablePlayer: function() {
		// Hide player
		var player = this.getPlayerContainer();
		player.style.display = "none";

		this.resetPlayer();

		// Show content
		var content = this.getPlayerContent();
		content.style.display = "block";
	},

	getPlayer: function() {
		return this.player;
	},

	loadVideo: function( type, data, startTime ) {

		if ( ( type === null ) || ( data === null ) ) return;
		
		if ( type === "" ) {
			this.disablePlayer();
			return;
		}

		startTime = Math.max( 0, startTime );

		var player = this.getPlayer();

		// player doesn't exist or is different video type
		if ( (player === null) || (player.getType() != type) ) {

			this.resetPlayer();
			this.enablePlayer();

			var playerObject = getPlayerByType( type );
			if ( playerObject !== null ) {
				this.player = new playerObject();
			} else {
				this.getPlayerContainer().innerText = "Video type not yet implemented.";
				return;
			}

		}

		this.player.setVolume( (this.volume !== null) ? this.volume : 25 );
		this.player.setStartTime( startTime || 0 );
		this.player.setVideo( data );

	},

	setVolume: function( volume ) {
		this.volume = volume;
		if ( this.player !== null ) {
			this.player.setVolume( volume );
		}
	},

	seek: function( seconds ) {
		var player = this.getPlayer();
		if ( player ) {
			player.seek( seconds );
		}
	},

	enableHD: function() {
		this.hdPlayback = true;
	},

	isHDEnabled: function() {
		return this.hdPlayback;
	},

	sync: function( time ) {

		if ( time === null ) return;

		if ( this.player !== null ) {

			var current = this.player.getCurrentTime();
			if ( ( current !== null ) &&
				( Math.abs(time - current) > this.syncMaxDiff ) ) {
				this.player.setStartTime( time );
			}

		}

	},

	toggleControls: function( enabled ) {
		if ( this.player !== null ) {
			this.player.toggleControls( enabled );
		}
	},
	
	enableCC: function() {
		this.closedCaptions = true;
	},

	isCCEnabled: function() {
		return this.closedCaptions;
	}

};


var players = [];

function getPlayerByType( type ) {
	return players[ type ];
}

var DefaultVideo = function() {};
DefaultVideo.prototype = {
	player: null,

	lastVideoId: null,
	videoId: null,

	lastVolume: null,
	volume: 0.123,

	currentTime: 0,

	getCurrentTime: function() {
		return null;
	},

	lastStartTime: 0,
	startTime: 0,

	setVolume: function( volume ) {},
	setStartTime: function( seconds ) {},
	seek: function( seconds ) {},
	onRemove: function() {},
	toggleControls: function() {}
};

function registerPlayer( type, object ) {
	object.prototype = new DefaultVideo();
	object.prototype.type = type;
	object.prototype.getType = function() {
		return this.type;
	};

	players[ type ] = object;
}

(function() {

	var YouTubeIframeVideo = function() {

		var player;

		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;

			if (player) { return; }

			player = new YT.Player('player', {
				height: '100%',
				width: '100%',
				videoId: id,
				playerVars: {
					autoplay: 1,
					controls: 0,
					showinfo: 0,
					modestbranding: 1,
					rel: 0,
					iv_load_policy: 3, // hide annotations
					cc_load_policy: theater.closedCaptions ? 1 : 0
				},
				events: {
					onReady: onYouTubePlayerReady,
				}
			});
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player !== null ) {
				this.player.seekTo( seconds, true );

				// Video isn't playing
				if ( this.player.getPlayerState() != 1 ) {
					this.player.playVideo();
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		this.getCurrentTime = function() {
			if ( this.player !== null ) {
				return this.player.getCurrentTime();
			}
		};

		this.canChangeTime = function() {
			if ( this.player !== null ) {
				//Is loaded and it is not buffering
				return this.player.getVideoBytesTotal() != -1 &&
				this.player.getPlayerState() != 3;
			}
		};

		this.think = function() {

			if ( this.player !== null ) {

				if ( this.videoId != this.lastVideoId ) {
					this.player.loadVideoById( this.videoId, this.startTime );
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.player.getPlayerState() != -1 ) {

					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}

					if ( this.volume != this.lastVolume ) {
						this.player.setVolume( this.volume );
						this.lastVolume = this.volume;
					}

				}
			}

		};

		this.onReady = function() {
			this.player = player;

			if ( theater.isHDEnabled() ) {
				this.player.setPlaybackQuality("hd720");
			}

			this.interval = setInterval( this.think.bind(this), 100 );
		};

	};
	registerPlayer( "youtubelive", YouTubeIframeVideo );


	//plays drive and youtube
	//yva_video is a weird thing i found... i think it's supposed to be for ads, but it works for this lol
	var YouTubeFlashVideo = function() {
		
		var params = {
			allowScriptAccess: "always",
			bgcolor: "#000000",
			wmode: "opaque"
		};

		var attributes = {
			id: "player",
		};

		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.videoId = id;

			var url = 'https://youtube.googleapis.com/yva_video?enablejsapi=1&amp;autoplay=1&amp;fs=1&amp;hl=en&amp;modestbranding=1&amp;autohide=1&amp;showinfo=0&amp;controls=0';

			if ( theater.isCCEnabled() ) {
				url += "&cc_load_policy=1";
				url += "&yt:cc=on";
			}

			if (id.length > 11) {
				url += '&amp;docid=' + id + '&amp;ps=docs&amp;partnerid=30';
			} 

			swfobject.embedSWF(url, "player", "126.6%", "104.2%", "9", null, null, params, attributes);
		}

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seekTo( seconds, true );

				if ( this.player.getPlayerState() != 1 ) {
					this.player.playVideo();
				}
			}
			var self = this;
			setTimeout(function() {
				if (self.getCurrentTime() < seconds - 30) {
					self.player.setPlaybackQuality("default");
					setTimeout(function() {
						self.player.seekTo( seconds, true );
					}, 2500);
				}
			}, 2500);
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.getCurrentTime();
			}
		};

		this.think = function() {
			if ( this.player != null ) {
				if ( (typeof(this.player.getPlayerState) === "function") && this.player.getPlayerState() != -1 ) {
					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}
					if ( this.volume != this.player.getVolume() ) {
						this.player.setVolume( this.volume );
						this.volume = this.player.getVolume();
					}
				}
			}
		};

		this.onReady = function() {
			this.player = document.getElementById('player');
			this.player.style.marginLeft = "-24.2%";
			this.player.style.marginTop = "-2%";

			this.ytforceres="large";
			
			if (theater.isHDEnabled()) {
				this.ytforceres = "hd720";
			}
			
			if (this.videoId.length <= 11) {
				this.player.loadVideoById( this.videoId, this.startTime, this.ytforceres);
				this.lastStartTime = this.startTime;
			} else {
				this.player.setPlaybackQuality(this.ytforceres);
			}

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

	};
	registerPlayer( "youtube", YouTubeFlashVideo );
	registerPlayer( "drive", YouTubeFlashVideo );

})();

/*
	API-specific global functions
*/

function onYouTubePlayerReady( playerId ) {
	var player = theater.getPlayer(),
		type = player && player.getType();
	if ( player && ((type == "youtube") || (type == "youtubelive")) || (type == "drive") ) {
		player.onReady();
	}
}

if (window.onTheaterReady) {
	onTheaterReady();
}