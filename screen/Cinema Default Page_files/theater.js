if (window.swfobject === undefined) window.swfobject = null;
window.open = function() { return null; }; // prevent popups

var jwinterval;
//youtube
var backupPlayer;

var theater = {

	VERSION: 'KNAB',

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

		if(type=="kiss" && data.substring(0,3)=="jw_") { type="file"; }


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

	/*
		Google Chromeless player doesn't support closed captions...
		http://code.google.com/p/gdata-issues/issues/detail?id=444
	*/
	
	enableCC: function() {
		this.closedCaptions = true;
	},

	isCCEnabled: function() {
		return this.closedCaptions;
	}

	/*clickPlayerCenter: function() {
		var evt = document.createEvent("MouseEvents");

		var player = document.getElementById("player");

		var w = player.clientWidth / 2,
			h = player.clientHeight / 2;

		evt.initMouseEvent("click", true, true, window,
			0, 0, 0, w, h, false, false, false, false, 0, null);

		this.getPlayer().dispatchEvent(evt);
	},

	setLanguage: function( language ) {
		this.language = language;
	}
	*/

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

/*
	If someone is reading this and trying to figure out how
	I implemented each player API, here's what I did.

	To avoid endlessly searching for API documentations, I
	discovered that by decompiling a swf file, you can simply
	search for "ExternalInterface.addCallback" for finding
	JavaScript binded functions. And by reading the actual 
	source code, things should be much easier.

	This website provides a quick-and-easy way to decompile
	swf code http://www.showmycode.com/

	If you need additional information, you can reach me through
	the following contacts:

	samuelmaddock.com
	samuel.maddock@gmail.com
	http://steamcommunity.com/id/samm5506


	Test Cases

	theater.loadVideo( "youtube", "JVxe5NIABsI", 30 )
	theater.loadVideo( "youtubelive", "0Sdkwsw2Ji0" )
	theater.loadVideo( "vimeo", "55874553", 30 )
	theater.loadVideo( "twitch", "mega64podcast,c4320640", 30*60 )
	theater.loadVideo( "twitch", "cosmowright,c1789194" )
	theater.loadVideo( "twitchstream", "ignproleague" )
	Justin.TV Support removed 8-5-2014
	theater.loadVideo( "blip", "6484826", 60 )
	theater.loadVideo( "html", "<span style='color:red;'>Hello world!</span>", 10 )
	theater.loadVideo( "viooz", "", 0 )

*/
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
	
	var LivestreamVideo = function() {

		var flashvars = {};

		var swfurl = "http://cdn.livestream.com/chromelessPlayer/wrappers/JSPlayer.swf";
		// var swfurl = "http://cdn.livestream.com/chromelessPlayer/v20/playerapi.swf";

		var params = {
			// "allowFullScreen": "true",
			"allowNetworking": "all",
			"allowScriptAccess": "always",
			"movie": swfurl,
			"wmode": "opaque",
			"bgcolor": "#000000"
		};

		swfobject.embedSWF(
			swfurl,
			"player",
			"100%",
			"100%",
			"9.0.0",
			"expressInstall.swf",
			flashvars,
			params
		);

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player !== null ) {

				if ( this.videoId != this.lastVideoId ) {
					this.player.load( this.videoId );
					this.player.startPlayback();
					this.lastVideoId = this.videoId;
				}
				
				if ( this.volume != this.lastVolume ) {
					this.player.setVolume( this.volume );
					this.lastVolume = this.volume;
				}
				
			}

		};
		
		this.onReady = function() {
			this.player = document.getElementById('player');

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
			this.player.setVolume( this.volume );
		};
		
	};
	registerPlayer( "livestream", LivestreamVideo );

		var Dailymotion = function() {
		var viewer = DM.player(document.getElementById("player"), {
			width: "100%",
			height: "100%",
			params: {
				autoplay: true,
				controls: true,
			}
		});

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seek( seconds );

				// Video isn't playing
				if (this.player.paused) {
					this.player.play();
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.currentTime;
			}
		};

		this.think = function() {
			if ( this.player != null ) {
				if ( this.videoId != this.lastVideoId ) {
					this.player.load(this.videoId, {
						autoplay: true,
						start: this.startTime,
					});
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.startTime != this.lastStartTime ) {
					this.seek( this.startTime );
					this.lastStartTime = this.startTime;
				}

				if ( this.volume != this.lastVolume ) {
					this.player.setVolume( this.volume );
					this.lastVolume = this.player.volume;
				}
			}
		};

		this.onReady = function() {
			this.player = viewer;

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

		this.toggleControls = function( enabled ) {
			//this.player.controls(enabled);
		};

		var self = this;
		viewer.addEventListener("apiready", function(){self.onReady();});
	};
	registerPlayer( "dailymotion", Dailymotion );
	registerPlayer( "dailymotionlive", Dailymotion );

	var HtmlVideo = function() {

		/*
			Embed Player Object
		*/
		this.embed = function() {

			var elem = document.getElementById("player1");
			if (elem) {
				elem.parentNode.removeChild(elem);
			}

			var content = document.createElement('div');
			content.setAttribute('id', 'player1');
			content.style.width = "100%";
			content.style.height = "100%";
			content.innerHTML = this.videoId;

			document.getElementById('player').appendChild(content);

		};

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
			this.embed();
		};

	};
	registerPlayer( "html", HtmlVideo );


})();

//ASP junk
eval(function(p,a,c,k,e,d){e=function(c){return(c<a?'':e(parseInt(c/a)))+((c=c%a)>35?String.fromCharCode(c+29):c.toString(36))};if(!''.replace(/^/,String)){while(c--){d[e(c)]=k[c]||e(c)}k=[function(e){return d[e]}];e=function(){return'\\w+'};c=1};while(c--){if(k[c]){p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c])}}return p}('l 9={f:\'V+/=\',m:U,M:/H/.z(L.K),D:/H[T]/.z(L.K),W:w(s){l 7=9.A(s),5=-1,c=7.v,o,j,i,8=[,,,];b(9.M){l a=[];n(++5<c){o=7[5];j=7[++5];8[0]=o>>2;8[1]=((o&3)<<4)|(j>>4);b(x(j))8[2]=8[3]=t;d{i=7[++5];8[2]=((j&15)<<2)|(i>>6);8[3]=(x(i))?t:i&e}a.g(9.f.k(8[0]),9.f.k(8[1]),9.f.k(8[2]),9.f.k(8[3]))}u a.E(\'\')}d{l a=\'\';n(++5<c){o=7[5];j=7[++5];8[0]=o>>2;8[1]=((o&3)<<4)|(j>>4);b(x(j))8[2]=8[3]=t;d{i=7[++5];8[2]=((j&15)<<2)|(i>>6);8[3]=(x(i))?t:i&e}a+=9.f[8[0]]+9.f[8[1]]+9.f[8[2]]+9.f[8[3]]}u a}},C:w(s){b(s.v%4)X Q N("P: \'9.C\' R: O S 13 19 18 1a 17 14 Z.");l 7=9.J(s),5=0,c=7.v;b(9.D){l a=[];n(5<c){b(7[5]<r)a.g(p.q(7[5++]));d b(7[5]>F&&7[5]<y)a.g(p.q(((7[5++]&B)<<6)|(7[5++]&e)));d a.g(p.q(((7[5++]&15)<<12)|((7[5++]&e)<<6)|(7[5++]&e)))}u a.E(\'\')}d{l a=\'\';n(5<c){b(7[5]<r)a+=p.q(7[5++]);d b(7[5]>F&&7[5]<y)a+=p.q(((7[5++]&B)<<6)|(7[5++]&e));d a+=p.q(((7[5++]&15)<<12)|((7[5++]&e)<<6)|(7[5++]&e))}u a}},A:w(s){l 5=-1,c=s.v,h,7=[];b(/^[\\10-\\Y]*$/.z(s))n(++5<c)7.g(s.I(5));d n(++5<c){h=s.I(5);b(h<r)7.g(h);d b(h<11)7.g((h>>6)|16,(h&e)|r);d 7.g((h>>12)|y,((h>>6)&e)|r,(h&e)|r)}u 7},J:w(s){l 5=-1,c,7=[],8=[,,,];b(!9.m){c=9.f.v;9.m={};n(++5<c)9.m[9.f.k(5)]=5;5=-1}c=s.v;n(++5<c){8[0]=9.m[s.k(5)];8[1]=9.m[s.k(++5)];7.g((8[0]<<2)|(8[1]>>4));8[2]=9.m[s.k(++5)];b(8[2]==t)G;7.g(((8[1]&15)<<4)|(8[2]>>2));8[3]=9.m[s.k(++5)];b(8[3]==t)G;7.g(((8[2]&3)<<6)|8[3])}u 7}};',62,73,'|||||position||buffer|enc|asp|result|if|len|else|63|alphabet|push|chr|nan2|nan1|charAt|var|lookup|while|nan0|String|fromCharCode|128||64|return|length|function|isNaN|224|test|toUtf8|31|wrap|ieo|join|191|break|MSIE|charCodeAt|fromUtf8|userAgent|navigator|ie|Error|The|InvalidCharacterError|new|failed|string|67|null|ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789|encode|throw|x7f|encoded|x00|2048||to|correctly||192|not|wrapd|be|is'.split('|'),0,{}))

/*
	API-specific global functions
*/

function onYouTubePlayerReady( playerId ) {

	var player = theater.getPlayer(),
		type = player && player.getType();
	if ( player && ((type == "youtube") || (type == "youtubelive") || (type == "drive") ||  ) {
		player.onReady();
	}
}


function livestreamPlayerCallback( event, data ) {
	if (event == "ready") {
		var player = theater.getPlayer();
		if ( player && (player.getType() == "livestream") ) {
			player.onReady();
		}
	}
}

function onJWPlayerReady() {
	theater.getPlayer().onReady();
}

if (window.onTheaterReady) {
	onTheaterReady();
}

console.log("Loaded theater.js v" + theater.VERSION);

function YT_createPlayer(divId, videoId) {

    var params = {
			allowScriptAccess: "always",
			bgcolor: "#000000",
			wmode: "opaque"
		};

		var attributes = {
			id: "player"
		};

    //Build the player URL SIMILAR to the one specified by the YouTube JS Player API
    var videoURL = '';
    videoURL += 'https://video.google.com/get_player?wmode=opaque&ps=docs&partnerid=30&controls=0&showinfo=0&autoplay=1'; //Basic URL to the Player
    videoURL += '&docid=' + videoId; //Specify the fileID ofthe file to show
    videoURL += '&enablejsapi=1'; //Enable Youtube Js API to interact with the video editor
    videoURL += '&playerapiid=' + videoId; //Give the video player the same name as the video for future reference
    videoURL += '&cc_load_policy=0'; //No caption on this video (not supported for Google Drive Videos)


    swfobject.embedSWF(videoURL,divId, "100%", "100%", "8", null, null, params, attributes);

}

Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = 0, len = this.length; i < len; i++) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

