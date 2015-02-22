(function() {
	'use strict';


	var noop = function() {};

	var DOWN_KEYS = {};

	var KEY_CODES = { // http://www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes
		backspace:   8,
		tab:         9,
		enter:      13,
		shift:      16,
		ctrl:       17,
		alt:        18,
		pause:      19,
		caps:       20,
		escape:     27,
		space:      32,
		pageUp:     33,
		pageDown:   34,
		end:        35,
		home:       36,
		left:       37,
		up:         38,
		right:      39,
		down:       40,
		insert:     45,
		'delete':   46,
		0:          48,
		1:          49,
		2:          50,
		3:          51,
		4:          52,
		5:          53,
		6:          54,
		7:          55,
		8:          56,
		9:          57,
		a:          65,
		b:          66,
		c:          67,
		d:          68,
		e:          69,
		f:          70,
		g:          71,
		h:          72,
		i:          73,
		j:          74,
		k:          75,
		l:          76,
		m:          77,
		n:          78,
		o:          79,
		p:          80,
		q:          81,
		r:          82,
		s:          83,
		t:          84,
		u:          85,
		v:          86,
		w:          87,
		x:          88,
		y:          89,
		z:          90,
		leftWin:    91,
		rightWin:   92,
		select:     93,
		num0:       96,
		num1:       97,
		num2:       98,
		num3:       99,
		num4:      100,
		num5:      101,
		num6:      102,
		num7:      103,
		num8:      104,
		num9:      105,
		multipy:   106,
		add:       107,
		subtract:  109,
		decimal:   110,
		divide:    111,
		f1:        112,
		f2:        113,
		f3:        114,
		f4:        115,
		f5:        116,
		f6:        117,
		f7:        118,
		f8:        119,
		f9:        120,
		f10:       121,
		f11:       122,
		f12:       123,
		numLock:   144,
		scrollLock:145,
		semiColon: 186,
		equal:     187,
		comma:     188,
		dash:      189,
		period:    190,
		fwdSlash:  191,
		grave:     192,
		openBrkt:  219,
		backslash: 220,
		closeBrkt: 221,
		quote:     222
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
		if (DOWN_KEYS[kc]) { return; }
		DOWN_KEYS[kc] = true;
		if ( CBS.onKeyDown(kc) ) { stop(ev); }
	});

	window.addEventListener('keyup', function(ev) {
		var kc = ev.keyCode;
		if (!DOWN_KEYS[kc]) { return; }
		delete DOWN_KEYS[kc];
		if ( CBS.onKeyUp(kc) ) { stop(ev); }
	});


	var toInt = function(n) { return parseInt(n, 10); };

	window.keys = {
		onKeyDown:   function(cb) { CBS.onKeyDown = cb; },
		onKeyUp:     function(cb) { CBS.onKeyUp   = cb; },
		isKeyDown:   function(kc) { return !!DOWN_KEYS[kc]; },
		getDownKeys: function() {   return Object.keys(DOWN_KEYS).map(toInt); },
		keyCodes:    KEY_CODES,
		keyNames:    KEY_NAMES
	};
})();
