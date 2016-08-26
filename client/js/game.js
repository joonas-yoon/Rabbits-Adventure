/**
 *   Script for Game
 *   with Phaser.io
 * 
 *   File: game.js
 **/
 
var game;
var bgColors = [0x62bd18, 0xff5300, 0xd21034, 0xff475c, 0x8f16b2, 0x588c7e, 0x8c4646];

window.onload = function() {
    game = new Phaser.Game(1170, 520, Phaser.AUTO, "gameContainer");
    game.state.add("PlayGame", playGame);
    game.state.add("GameIntro", gameIntro);
    game.state.add("LevelSelect", levelSelect);
    // game.state.start("PlayGame", true, false, 'stage1');
    game.state.start("GameIntro");
}

var playGame = function(game){};
playGame.prototype = {
    
    player_facing: 'left',
    facingFrame: ['down', 'left', 'right', 'up'],
    playing: false,
    score: 0,
    deathTile: [26, 27, 51, 52, 76, 101, 126],
    HUD: {
        text: {},
        graphics: {}
    },
    
    stageName: '',
    stageInfo: {},
    
    init: function(name){
        this.stageName = name;
    },
    preload: function(){
        game.load.image('ground_1x1', 'assets/tilemaps/tiles/ground_1x1.png');
        game.load.image('carrot_32x32', 'assets/carrot_32x32.png');
        game.load.spritesheet('rabbit', 'assets/rabbit.png', 32, 32);
        game.load.spritesheet('ground_sprite', 'assets/tilemaps/tiles/ground_1x1.png', 32, 32);
    },
    flushLocalData: function(){
        this.score = 0;
        this.playing = false;
        this.player_facing = 'left';
    },
    create: function(){
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        var backColor = bgColors[game.rnd.between(0, bgColors.length - 1)];
        game.stage.backgroundColor = backColor;

        this.load_map(this.stageName);
        
        //  Our controls.
        this.cursors = game.input.keyboard.createCursorKeys();
        
        //  Our painting marker
        this.marker = game.add.graphics();
        this.marker.lineStyle(2, 0xffcc00, 1);
        this.marker.drawRect(0, 0, 32, 32);
        
        this.playing = true;
        
        // 스코어 텍스트
        this.HUDLayer = game.add.group();
        this.HUD.text.score = game.add.text(0, 0, "score: " + this.score, { font: "bold 24px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "right" }, this.HUDLayer);
        this.HUD.text.score.setShadow(3, 3, 'rgba(0,0,0,0.5)', 2);
    },
    update: function(){
        if( ! this.player ) return;
        
        game.world.bringToTop(this.HUDLayer);
        
        //  Reset the players velocity (movement)
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        this.player.bringToTop();
        
        if(this.playing !== true) return;
        
        //  Collide the player and the stars with the platforms
        game.physics.arcade.collide(this.player, this.wallsLayer);
        game.physics.arcade.overlap(this.player, this.carrots, this.collectCarrots, null, this);
    
        if (this.cursors.left.isDown)
        {
            //  Move to the left
            this.player.body.velocity.x = -150;
            
            this.player.animations.play('left');
            this.player_facing = 'left';
        }
        else if (this.cursors.right.isDown)
        {
            //  Move to the right
            this.player.body.velocity.x = 150;
    
            this.player.animations.play('right');
            this.player_facing = 'right';
        }
        else if (this.cursors.up.isDown)
        {
            //  Move to the up
            this.player.body.velocity.y = -150;
    
            this.player.animations.play('up');
            this.player_facing = 'up';
        }
        else if (this.cursors.down.isDown)
        {
            //  Move to the down
            this.player.body.velocity.y = 150;
    
            this.player.animations.play('down');
            this.player_facing = 'down';
        }
        else {
            //  Stand still
            this.player.animations.stop();
            
            if( this.facingFrame.indexOf(this.player_facing) != -1 ){
                this.player.frame = this.facingFrame.indexOf(this.player_facing) * 12 + 1;
            }
        }
        
        this.updateMarker();
    },
    updateMarker: function(){
        var curTileX = this.tilesLayer.getTileX(this.player.body.center.x);
        var curTileY = this.tilesLayer.getTileY(this.player.body.center.y);
        
        // 플레이어가 다른 타일로 이동함
        if( this.player.tileX !== curTileX || this.player.tileY !== curTileY )
        {
            // 이전에 있던 타일을 삭제, 닿으면 죽게 바꿈
            if( this.player.tileX != null && this.player.tileY != null ){
                this.changeToDeathZone(this.player.tileX, this.player.tileY);
            }
            
            // 플레이어의 위치를 갱신
            this.player.tileX = curTileX;
            this.player.tileY = curTileY;
            
            this.marker.x = this.player.tileX * 32;
            this.marker.y = this.player.tileY * 32;
        }
        
        this.checkDeathPosition(this.player.tileX, this.player.tileY);
    },
    checkDeathPosition: function(tileX, tileY){
        var currentTile = this.map.getTile(tileX, tileY, this.tilesLayer);
        if(this.deathTile.indexOf(currentTile.index) !== -1){
            this.endGame();
        }
    },
    changeToDeathZone: function(tileX, tileY){
        this.map.putTile(26, tileX, tileY, this.tilesLayer);
        
        var tile = game.add.sprite(tileX * 32, tileY * 32, 'ground_sprite');
        // player.body.setSize(16, 16, 8, 20);
        tile.animations.add('destory', [25, 50, 75, 100, 125], 15, false);
        tile.animations.add('water', [26, 51], 2, true);
        game.time.events.add(Phaser.Timer.SECOND * 0.2, function(){
            tile.animations.play('destory');
            tile.animations.currentAnim.onComplete.add(function () {
                tile.animations.play('water');
            }, this);
        }, this);
        
        this.updateScore(+10, true);
    },
    collectCarrots: function(player, carrot){
        this.updateScore(+100, true);
        
        carrot.destroy();
        
        // 당근을 모두 먹었으면 게임 성공
        if(this.carrots.children.length === 0){
            this.clearGame();
        }
    },
    updateScore: function(getScore, updateDisplay){
        this.score += Math.floor(getScore + 0);
        if(updateDisplay) this.HUD.text.score.text = 'score: ' + this.score;
    },
    
    
    new_map: function(name){
        this.map = game.add.tilemap(name);
    
        this.map.addTilesetImage('ground_1x1');
        // 충돌이 일어나는 타일셋 프레임 범위
        this.map.setCollisionBetween(1, 1000);
        for(var i in this.deathTile){
            //  해당 ID인 타일과 충돌이 일어나면 endGame을 호출함
            this.map.setTileIndexCallback(this.deathTile[i], this.endGame, this);
        }
    
        this.tilesLayer = this.map.createLayer('Tile Layer');
        this.wallsLayer = this.map.createLayer('Wall Layer');
        //  Scroll it
        this.wallsLayer.resizeWorld();
        
        // 오브젝트 그룹 추가
        this.carrots = game.add.group();
        this.carrots.enableBody = true;
    
        //  And now we convert all of the Tiled objects with an ID of 34 into sprites within the coins group
        this.map.createFromObjects('Carrots', 151, 'carrot_32x32', 0, true, false, this.carrots);
        
        this.set_player();
    },
    load_map: function(name){
        if(game.cache.checkTilemapKey(name)) return;
        
        game.load.text('stageInfo', 'assets/data/' + name + '.json');
		game.load.start();
		game.load.onLoadComplete.addOnce(this.load_map_download, this);
		
        console.log('Load Map Data...');
    },
    load_map_download: function(){
        var jsonData = game.cache.getText('stageInfo');
        this.stageInfo = JSON.parse(jsonData);
        game.load.tilemap(this.stageInfo.name, 'assets/tilemaps/maps/' + this.stageInfo.tilemap + '.json', null, Phaser.Tilemap.TILED_JSON);
		game.load.start();
		game.load.onLoadComplete.add(this.load_map_success, this);
    },
    load_map_success: function(){
        console.log('Success Load Map Data');
        this.new_map(this.stageInfo.name);
    },
    
    set_player: function(){
        // The player and its settings
        var playerTileX = this.stageInfo.starting_point.x, playerTileY = this.stageInfo.starting_point.y;
        this.player = game.add.sprite(32 * playerTileX + 1, 32 * playerTileY, 'rabbit');
    
        //  We need to enable physics on the player
        game.physics.arcade.enable(this.player);
        this.player.body.fixedRotation = true;
        this.player.body.collideWorldBounds = true;
        this.player.body.setSize(16, 16, 8, 20);
    
        //  Our two animations, walking left and right.
        this.player.animations.add('down', [1, 0, 1, 2], 10, true);
        this.player.animations.add('left', [13, 12, 13, 14], 10, true);
        this.player.animations.add('right', [25, 24, 25, 26], 10, true);
        this.player.animations.add('up', [37, 36, 37, 38], 10, true);
        this.player.animations.add('dead', [1, 13, 25, 37], 10, true);
        
        game.camera.follow(this.player);
    },
    
    
    endGame: function(){
        // 게임 실패로 인한 종료
        
        var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    
        //  The Text is positioned at 0, 0
        var text = game.add.text(0, 0, "You Die", style);
        text.setTextBounds(0, 0, game.width, game.height);
        
        this.player.animations.play("dead");
        game.add.tween(this.player.scale).to({x: 0.5, y: 0.5}, 2400, Phaser.Easing.Cubic.Out, true);
        
        game.time.events.add(Phaser.Timer.SECOND * 2, function(){
            // 현재 게임을 재시작
            game.state.start("PlayGame", true, false, this.stageName);
        }, this);
        
        this.flushLocalData();
        
        return false;
    },
    clearGame: function(){
        // 스테이지 클리어
        
        game.time.events.add(Phaser.Timer.SECOND * 0.1, function(){
            this.playing = false;
        }, this);
        
        var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    
        var text = game.add.text(0, 0, "Game Clear!", style);
        text.setTextBounds(0, 0, game.width, game.height);
    }
}