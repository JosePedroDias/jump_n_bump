# Game Notes


## screen size

	400 x 256 px
	352px wide (play screen)
	 48px wide (ui)


## tiles

	22 x 16 tiles
	(see gfx/levelmaking/making1.gif)


## tile size

	16 x 16 px


## tile behaviours (assets/levelmap.txt)

	0	air
	1	ground
	2	water
	3	ice
	4	spring


## sprites

	numbers 0- 9       16x22
	font    0-80   max 12x12
	objects 0-80   max 30x12
	rabbit  0-71   max 17x16 (18x4colors)


## misc

	You can jump up to 3 blocks.
	If you are using the "BUNNIESINSPACE" cheat, you can jump up to 6 blocks.
	And jumping on a spring, 6 blocks too.
	The water is useful for "fly".
	If you alternate ground and air, you can run over there without falling.


## keybindings

	          left  right  jump
	player 1  left  right  up
	player 2  a     d      w
	player 3  j     l      i
	player 4  kp4   kp6    kp8


## relevant source files

* [globals.pre](http://git.icculus.org/?p=crow/jumpnbump.git;a=blob_plain;f=globals.pre;hb=e2bcb0a928cee4190ef0b86b06eb7ec083bf23f8)
	* _

* [main.c](http://git.icculus.org/?p=crow/jumpnbump.git;a=blob_plain;f=main.c;hb=e2bcb0a928cee4190ef0b86b06eb7ec083bf23f8)
	* game_loop()
	* position_player(playerNum)
	* player\_action\_left(playerNum) and player\_action\_right(playerNum)
	* steer_players()
	* collision_check()

* ([menu.c](http://git.icculus.org/?p=crow/jumpnbump.git;a=blob_plain;f=menu.c;hb=e2bcb0a928cee4190ef0b86b06eb7ec083bf23f8))
	* _

* ([fireworks.c](http://git.icculus.org/?p=crow/jumpnbump.git;a=blob_plain;f=fireworks.c;hb=e2bcb0a928cee4190ef0b86b06eb7ec083bf23f8))
	* _
