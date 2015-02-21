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



	var loadSfx = function() {
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

		loadSounds(sounds, map);
	};



	var createPlayer = function(idx) {
		var tex = sheets.rabbit.splice(0, 18);
		var spr = new PIXI.Sprite(tex[0]);
		spr.position.x = W/2;
		spr.position.y = H/2;

		var o = {
			kcL: keys.keyCodes[ bindings[idx].l ],
			kcR: keys.keyCodes[ bindings[idx].r ],
			kcJ: keys.keyCodes[ bindings[idx].j ],
			active: true,
			textures: tex,
			sprite:   spr,
			animName: 'stand_r',
			animStep: 0,
			animSubStepsLeft: 0,

			processSprite: function() {
				if (!this.sprite) {
					var anim = rabbitStates[ this.animName ];
					if (typeof anim === 'number') {
						animSubStepsLeft = -1;
					}
					else {
						// TODO
					}
					var animI = anim;
					this.sprite.texture = this.textures[ animI ];
				}
			}
		};
		stage.addChild(o.sprite);

		return o;
	};



	var onSpriteSheetsLoaded = function(err, res) {
		if (err) { return window.alert(err); }

		var k, v, f, rgx = /([a-z]+)\.[a-z]+$/i;

		for (k in res) {
			v = res[k];
			f = rgx.exec(k)[1];
			//console.log(k, f);
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

		//console.log('levelMap', levelMap);
		//console.log('rabbitStates', rabbitStates);
		//console.log('sheets', sheets);

		//var s = new PIXI.Sprite( sheets.numbers[1] ); stage.addChild(s); // 0-9
		//var s = new PIXI.Sprite( sheets.font[30] ); s.position = new PIXI.Point(30, 30); stage.addChild(s); // 0-80
		//var s = new PIXI.Sprite( sheets.objects[0] ); stage.addChild(s); // 0-80
		//var s = new PIXI.Sprite( sheets.rabbit[0] ); stage.addChild(s); // 0-71 (18x4)

		loadSfx();

		players.push( createPlayer(0) );
		players.push( createPlayer(1) );

		requestAnimFrame( animate );

		/*
		keys.onKeyDown(function(code) {
			console.log( keys.keyNames[code] );
			return true;
		});*/
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
		
		var levelFg = new PIXI.Sprite( textures.levelFg );
		stage.addChild(levelFg);

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


		var downKeys = keys.getDownKeys();

		
		// UPDATE
		players.forEach(function(pl) {
			var dx = elInArr(pl.kcL, downKeys) ? -1 : (elInArr(pl.kcR, downKeys) ? 1 : 0);
			var dy = elInArr(pl.kcJ, downKeys) ? -1 : 0;
			pl.sprite.position.x += dx;
			pl.sprite.position.y += dy;
		});


		renderer.render(stage);
	};



	init();

})();