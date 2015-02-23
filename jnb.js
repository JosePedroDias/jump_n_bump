(function() {

	'use strict';


	/*
		http://www.goodboydigital.com/pixijs/docs/
		http://www.pixijs.com/examples/
	*/


	var  W = 400; // 22 (+3 UX)
	var  H = 256; // 16
	var  S =  16;
	var t0 = -1/30;


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



	var createPlayer = function(idx) {
		var tex = sheets.rabbit.splice(0, 18);
		var spr = new PIXI.Sprite(tex[0]);
		spr.position.x = W/2;
		spr.position.y = H/2;

		var o = {
			index: idx,
			score: 0,
			kcL: keys.keyCodes[ bindings[idx].l ],
			kcR: keys.keyCodes[ bindings[idx].r ],
			kcJ: keys.keyCodes[ bindings[idx].j ],
			active: true,
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



	var onSfxLoaded = function() {
		players.push( createPlayer(0) );
		//players.push( createPlayer(1) );
		//players.push( createPlayer(2) );
		//players.push( createPlayer(3) );

		var levelFg = new PIXI.Sprite( textures.levelFg );
		stage.addChild(levelFg);

		setupScores();

		/*updateScore(0, 12);
		updateScore(1, 34);
		updateScore(2, 56);
		updateScore(3, 78);*/

		requestAnimFrame( animate );

		setTimeout(function() {
			playSound(sounds.bumpM, 0);
		}, 1500);



		keys.onKeyDown(function(kc) {
			players.some(function(pl) {
				if (kc === pl.kcL) {
					pl.setAnim('walk_l'); return true;
				}
				else if (kc === pl.kcR) {
					pl.setAnim('walk_r'); return true;
				}
				else if (kc === pl.kcJ) {
					pl.setAnim('jump_' + pl.getDir()); playSound(sounds.jump, 0); pl.incrScore(); return true;	
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


	var elInArr = function(el, arr) {
		return arr.indexOf(el) !== -1;
	};

	var animate = function(t) {
		requestAnimFrame( animate );

		t /= 1000;
		var dt = t - t0;
		t0 = t;
		//log(t, dt);
		
		// UPDATE
		players.forEach(function(pl) {
			pl.dx = keys.isKeyDown(pl.kcL) ? -1 : (keys.isKeyDown(pl.kcR) ? 1 : 0);
			pl.dy = keys.isKeyDown(pl.kcJ) ? -1 : 0;
			//if (dy === -1) { playSound(sounds.jump, 0);}
			pl.sprite.position.x += pl.dx;
			pl.sprite.position.y += pl.dy;
			pl.processSprite();
		});


		renderer.render(stage);
	};



	init();

})();