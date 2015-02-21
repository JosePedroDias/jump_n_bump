var keys = function() {
	'use strict';


	var noop = function() {};

	var IS_KEY_DOWN = {};

	var KEY_CODES = { // http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
		up:     38,
		down:   40,
		left:   37,
		right:  39,
		space:  32,
		enter:  13,
		escape: 27
	};

	var KEY_NAMES = {};
	for (var k in KEY_CODES) {
		KEY_NAMES[ KEY_CODES[k] ] = k;
	}

	var CBS = {
		onKeyDown: noop,
		onKeyUp:   noop
	};

	var stop = function(ev) {
		ev.preventDefault();
		ev.stopPropagation();
	};



	window.addEventListener('keydown', function(ev) {
		var kc = ev.keyCode;
		IS_KEY_DOWN[kc] = true;
		if ( CBS.onKeyDown(kc) ) { stop(ev); }
	});

	window.addEventListener('keyup', function(ev) {
		var kc = ev.keyCode;
		IS_KEY_DOWN[kc] = false;
		if ( CBS.onKeyUp(kc) ) { stop(ev); }
	});



	var api = {
		onKeyDown:   function(cb) { CBS.onKeyDown = cb;                  },
		onKeyUp:     function(cb) { CBS.onKeyUp   = cb;                  },
		isKeyDown:   function(kc) { return !!IS_KEY_DOWN[kc];            },
		getDownKeys: function() {   var down = Object.keys(IS_KEY_DOWN); },
		keyCodes:    KEY_CODES,
		keyNames:    KEY_NAMES
	};

	return api;
};
