(function() {

	'use strict';


	/*
		http://www.goodboydigital.com/pixijs/docs/
		http://www.pixijs.com/examples/
	*/


	var  W = 400; // 22 (+3 UX)
	var  WW = 22;
	var  H = 256; // 16
	var  HH = 16;
	var  S =  16;
	var t0 = -1/30;


	var SFX_ON   = true;
	var MUSIC_ON = true;



	// levelMap possibilities
	var BAN_VOID   = 0;
	var BAN_SOLID  = 1;
	var BAN_WATER  = 2;
	var BAN_ICE	   = 3;
	var BAN_SPRING = 4;



	// object types
	var OBJ_SPRING      = 0;
	var OBJ_SPLASH      = 1;
	var OBJ_SMOKE       = 2;
	var OBJ_YEL_BUTFLY  = 3;
	var OBJ_PINK_BUTFLY = 4;
	var OBJ_FUR         = 5;
	var OBJ_FLESH       = 6;
	var OBJ_FLESH_TRACE = 7;



	/*
		FRIGGIN' SHIFT TRICKS

		int x
		x >> 4   ~>   ~~(x / 16)
	*/



	//GET_BAN_MAP_XY(x,y) ban_map[(y) >> 4][(x) >> 4]
	var xyToTile = function(x, y) {
		if (x < 0 || y < 0 || x >= W || y >= H) { return BAN_SOLID; }
		return levelMap[ y>>4 ][ x>>4 ];
	};

	// #define GET_BAN_MAP_IN_WATER(s1, s2)
	var isXyInWater = function(x, y) {
		return (
			(
				xyToTile(x,    y+7) === BAN_VOID ||
				xyToTile(x+15, y+7) === BAN_VOID
			) &&
			(
				xyToTile(x,    y+8) === BAN_WATER ||
				xyToTile(x+15, y+8) === BAN_WATER
			)
		);
	};


	var stage;
	var renderer;
	var levelMap;
	var rabbitStates;
	var textures = {};
	var sheets = {};
	var sounds = {};
	var players = [];
	var scoreNums = [];
	var bindings = [
		{l:'left', r:'right', j:'up'},
		{l:'a',    r:'d',     j:'w'},
		{l:'j',    r:'l',     j:'i'},
		{l:'num4', r:'num6',  j:'num8'}
	];

	//window.sounds = sounds;



	var rnd = function(n) {
		return ~~( Math.random() * n );
	};



	var processSpriteSheet = function(baseTexture, sheet) {
		return sheet.map(function(o) {
			return new PIXI.Texture(baseTexture, new PIXI.Rectangle(o.pos[0], o.pos[1], o.dims[0], o.dims[1]));
		});
	};



	var readSpriteSheets = function(cb) {
		var urls = [
			'assets/levelmap.txt',
			'assets/gfx/sprites/font.json',
			'assets/gfx/sprites/numbers.json',
			'assets/gfx/sprites/objects.json',
			'assets/gfx/sprites/rabbit.json',
			'assets/gfx/sprites/rabbitStates.json'
		];

		var left = urls.length;

		var res = {};

		var innerCb = function(err, xhr) {
			if (err) { return cb(err); }

			var resp = xhr.responseText;

			if (this.lastIndexOf('.json') !== -1) {
				resp = JSON.parse(resp);
			}

			res[this] = resp;
			--left;

			if (left === 0) {
				cb(null, res);
			}
		};
		
		urls.forEach(function(url) {
			ajax({
				uri: url,
				cb:  innerCb.bind(url)
			});
		});
	};



	var loadSfx = function(cb) {
		var preM = 'assets/sfx/music/';
		var preS = 'assets/sfx/samples/';
		var suf = '.ogg';

		var map = {
			bumpM:   preM + 'bump'   + suf,
			jumpM:   preM + 'jump'   + suf,
			scoresM: preM + 'scores' + suf,

			death:  preS + 'death'  + suf,
			fly:    preS + 'fly'    + suf,
			jump:   preS + 'jump'   + suf,
			splash: preS + 'splash' + suf,
			spring: preS + 'spring' + suf
		};

		loadSounds(sounds, map, cb);
	};



	var positionPlayer = function(playerNum) {
		var x, y, pl = players[playerNum];

		while (true) {
			while (true) { // choose position in void and below solid or ice
				x = rnd(WW);
				y = rnd(HH-1);
				if (levelMap[y][x] === BAN_VOID &&
					( levelMap[y+1][x] === BAN_SOLID || levelMap[y+1][x] === BAN_ICE ) ) { break; }
			}

			if (players.length > 1 && players.some(function(pll) { // check player to player collisions
				if (!pll.enabled) { return; } // disabled - skip
				if (pll === pl) { return; } // same player - skip
				if ( (Math.abs( x*S - pll.sprite.position.x ) < 2*S) &&
					 (Math.abs( y*S - pll.sprite.position.y ) < 2*S) ) { return true; } // partial collision - abort this position
			})) { continue; }
			else {
				// console.log('%d x %d', x, y);
				return [x, y]; // all is well...
			}
		}
	};



	var createPlayer = function() {
		var idx = players.length;

		var tex = sheets.rabbit.splice(0, 18);
		var spr = new PIXI.Sprite(tex[0]);

		var o = {
			enabled: true,
			index: idx,
			score: 0,
			kcL: keys.keyCodes[ bindings[idx].l ],
			kcR: keys.keyCodes[ bindings[idx].r ],
			kcJ: keys.keyCodes[ bindings[idx].j ],
			active: true,
			jump: 0,
			textures: tex,
			sprite:   spr,
			animName: 'stand_r',
			animStep: 0,
			animSubStepsLeft: 0,

			incrScore: function() {
				++this.score;
				updateScore(this.index, this.score);
			},
			getDir: function() {
				return this.animName[ this.animName.length-1 ];
			},
			getAnim: function() {
				return this.animName;
			},
			setAnim: function(animName) {
				//console.log(animName);
				this.animName = animName;
				this.animStep = 0;
				this.animSubStepsLeft = 0;
			},
			processSprite: function() {
				var pair, animI, anim = rabbitStates[ this.animName ];
				if (typeof anim === 'number') {
					animI = anim;
				}
				else {
					this.animSubStepsLeft -= 20;
					//console.log(this.animName, this.animStep, this.animSubStepsLeft);
					if (this.animSubStepsLeft < 0) {
						++this.animStep;
						if (this.animStep >= anim.length) {
							this.animStep = 0;
						}
						pair = anim[ this.animStep ];
						this.animSubStepsLeft = pair[1];
						animI = pair[0];
					}
					else { return; }
				}
				this.sprite.texture = this.textures[ animI ];
			}
		};
		stage.addChild(o.sprite);
		players.push(o);

		var pos = positionPlayer(idx);
		spr.position.x = pos[0]*S; // W/2;
		spr.position.y = pos[1]*S; // H/2;

		return o;
	};



	var updateScore = function(playerIdx, score) {
		var playerNums = scoreNums[playerIdx];
		var units = score % 10;
		var tens = ~~(score / 10);
		playerNums[0].texture = sheets.numbers[ tens ];
		playerNums[1].texture = sheets.numbers[ units ];
	};



	var setupScores = function() {
		var g = new PIXI.Graphics();
		var s, nums = [], playerNums;

		g.beginFill(0x606060);
		var x, y;
		x = 400-40;
		for (var i = 0; i < 4; ++i) {
			y = 34+i*64;
			g.drawRect(x, y, S*2, 22);

			playerNums = [];

			s = new PIXI.Sprite( sheets.numbers[0] );
			s.position.set(x, y);
			nums.push(s);
			playerNums.push(s);

			s = new PIXI.Sprite( sheets.numbers[0] );
			s.position.set(x+S, y);
			nums.push(s);
			playerNums.push(s);

			scoreNums.push(playerNums);
		}
		stage.addChild(g);

		nums.forEach(function(s) {
			stage.addChild(s);
		});
	};



	// get_closest_player_to_point
	var closestPlayerToPoint = function(x, y) {
		var closestPlayer, closestDistSquared = Number.MAX_VALUE;

		players.forEach(function(pl) {
			if (!pl.enabled) { return; }
			var dx = (x - ((pl.sprite.position.x) + 8));
			var dy = (y - ((pl.sprite.position.y) + 8));
			var distSquared = dx*dx + dy*dy;
			if (distSquared < closestDistSquared) {
				closestPlayer = pl;
				closestDistSquared = distSquared;
			}
		});

		if (closestPlayer === undefined) { return; }

		return {
			player: closestPlayer,
			dist:   Math.sqrt(closestDistSquared)
		};
	};



	var onSfxLoaded = function() {
		createPlayer();
		createPlayer();
		createPlayer();
		createPlayer();

		//console.log('closest to center: ', closestPlayerToPoint(W/2, H/2) );

		var levelFg = new PIXI.Sprite( textures.levelFg );
		stage.addChild(levelFg);

		setupScores();

		if (MUSIC_ON) {
			playSound(sounds.bumpM, true);
		}

		keys.onKeyDown(function(kc) {
			players.some(function(pl) {
				if (kc === pl.kcL) {
					pl.setAnim('walk_l'); return true;
				}
				else if (kc === pl.kcR) {
					pl.setAnim('walk_r'); return true;
				}
				else if (kc === pl.kcJ) {
					pl.setAnim('jump_' + pl.getDir());
					return true;	
				}
			});
		});

		keys.onKeyUp(function(kc) {
			players.some(function(pl) {
				if (kc === pl.kcJ) {
					if (pl.dx === 0) {
						pl.setAnim('stand_' + pl.getDir());
					}
					else {
						pl.setAnim('walk_' + pl.getDir());
					}
					return true;
				}
				else if (kc === pl.kcL || kc === pl.kcR) {
					pl.setAnim('stand_' + pl.getDir()); return true;
				}
			});
		});

		requestAnimFrame( animate );
	};



	var tilesOverlay = function() {
		var g = new PIXI.Graphics();
		var colors = [0x000000, 0xFF0000, 0x00FF00, 0x0000FF, 0xFFFFFF]; // 0=air, 1=ground, 2=water, 3=ice, 4=spring
		var x, y, i;
		for (y = 0; y < HH; ++y) {
			for (x = 0; x < WW; ++x) {
				//i = (x+y) % 2;
				i = levelMap[y][x];
				g.beginFill( colors[i] , 0.33);
				g.drawRect(x*S, y*S, S, S);
			}
		}
		stage.addChild(g);
	};



	var onSpriteSheetsLoaded = function(err, res) {
		if (err) { return window.alert(err); }

		var k, v, f, rgx = /([a-z]+)\.[a-z]+$/i;

		for (k in res) {
			v = res[k];
			f = rgx.exec(k)[1];
			
			if (f === 'levelmap') {
				levelMap = v.split('\n').map(function(line) {
					return line.split('').map(function(s) { return parseInt(s, 10); });
				});
			}
			else if (f === 'rabbitStates') {
				rabbitStates = v;
			}
			else {
				sheets[f] = processSpriteSheet(textures[f], v);
			}
		}

		//var s = new PIXI.Sprite( sheets.font[30] ); s.position = new PIXI.Point(30, 30); stage.addChild(s); // 0-80
		//var s = new PIXI.Sprite( sheets.objects[0] ); stage.addChild(s); // 0-80
		//var s = new PIXI.Sprite( sheets.rabbit[0] ); stage.addChild(s); // 0-71 (18x4)

		//tilesOverlay();

		loadSfx(onSfxLoaded);
	};



	var init = function() {
		stage = new PIXI.Stage(0x000000);
		renderer = PIXI.autoDetectRenderer(W, H);

		textures.levelBg = PIXI.Texture.fromImage('assets/gfx/screens/level.gif');
		textures.levelFg = PIXI.Texture.fromImage('assets/gfx/screens/level_fg.gif');
		textures.font    = PIXI.Texture.fromImage('assets/gfx/sprites/font.gif');
		textures.numbers = PIXI.Texture.fromImage('assets/gfx/sprites/numbers.gif');
		textures.objects = PIXI.Texture.fromImage('assets/gfx/sprites/objects.gif');
		textures.rabbit  = PIXI.Texture.fromImage('assets/gfx/sprites/rabbit.gif');

		var levelBg = new PIXI.Sprite( textures.levelBg );
		stage.addChild(levelBg);

		document.body.appendChild(renderer.view);

		readSpriteSheets(onSpriteSheetsLoaded);
	};



	var getBelows = function(pl) {
		var x = pl.sprite.position.x;
		var y = pl.sprite.position.y;
		
		var o = {
			t: xyToTile(x+0.5*S, y),
			l: xyToTile(x,       y),
			b: xyToTile(x+0.5*S, y+S),
			r: xyToTile(x+S,     y)
		};

		//console.log('%d | %d | %d', o.l, o.b, o.r);

		return o;
	};



	var animate = function(t) {
		requestAnimFrame( animate );

		t /= 1000;
		var dt = t - t0;
		t0 = t;
		
		// UPDATE
		players.forEach(function(pl) {
			var o = getBelows(pl);

			if (pl.jump <= 0 && keys.isKeyDown(pl.kcJ) && o.b !== BAN_VOID) {
				pl.jump = 3.2;
				if (SFX_ON) {
					playSound(sounds.jump);
				}
				pl.incrScore();
			};
			
			if (keys.isKeyDown(pl.kcL)) {
				pl.dx = (o.l === BAN_VOID) ? -1 : 0;
			}
			else if (keys.isKeyDown(pl.kcR)) {
				pl.dx = (o.r === BAN_VOID) ? 1 : 0;
			}
			else {
				pl.dx = 0;
			}

			pl.dy = (o.b === BAN_VOID) ? 1 : 0;

			if (o.t !== BAN_VOID && pl.dy - pl.jump < 0) { pl.jump = 0; }

			pl.sprite.position.x += pl.dx * dt * 110;
			pl.sprite.position.y += (pl.dy - pl.jump) * dt * 110;

			if (pl.jump > 0) {
				pl.jump -= 0.1;
			}

			pl.processSprite();
		});

		renderer.render(stage);
	};

	init();

})();
