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
    
    // game.state.start("PlayGame", true, false, 'stage1-1');
    // game.state.start("GameIntro");
    game.state.start("LevelSelect");
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
        
        game.load.spritesheet('button', 'assets/buttons/button_sprite_sheet.png', 193, 71);
        game.load.image('stageStar', 'assets/star.png', 64, 64);
        
        for(var i=1; i<=10; ++i){
            game.load.text('stageInfo-stage1-'+i, 'assets/data/stage1-' + i + '.json');
        }
    },
    flushLocalData: function(){
        this.score = 0;
        this.playing = false;
        this.player_facing = 'down';
    },
    create: function(){
        this.flushLocalData();
        
        console.log('Create Play Game');
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
        this.HUDLayer.fixedToCamera = true;
        
        this.createPopupMenu();
        
        var showPopupButton = game.add.button(game.camera.width - 100, 50, 'button', this.togglePopupMenu, this, 2, 1, 0, 0, this.HUDLayer);
        showPopupButton.anchor.setTo(0.5);
    },
    update: function(){
        if( ! this.player ) return;
        if( ! this.player.body ) return;
        
        //  Reset the players velocity (movement)
        this.player.body.velocity.x = 0;
        this.player.body.velocity.y = 0;
        // this.player.bringToTop();
        
        if(this.playing !== true) return;
        
        //  Collide the player and the stars with the platforms
        game.physics.arcade.collide(this.player, this.wallsLayer);
        game.physics.arcade.overlap(this.player, this.carrots, this.collectCarrots, null, this);
    
        if (this.cursors.left.isDown)
        {
            //  Move to the left
            this.player.body.velocity.x = -200;
            
            this.player.animations.play('left');
            this.player_facing = 'left';
        }
        else if (this.cursors.right.isDown)
        {
            //  Move to the right
            this.player.body.velocity.x = 200;
    
            this.player.animations.play('right');
            this.player_facing = 'right';
        }
        else if (this.cursors.up.isDown)
        {
            //  Move to the up
            this.player.body.velocity.y = -200;
    
            this.player.animations.play('up');
            this.player_facing = 'up';
        }
        else if (this.cursors.down.isDown)
        {
            //  Move to the down
            this.player.body.velocity.y = 200;
    
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
        
        game.world.bringToTop(this.HUDLayer);
        game.world.bringToTop(this.popupMenu);
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
        tile.animations.add('destroy', [25, 50, 75, 100, 125], 15, false);
        tile.animations.add('water', [26, 51], 2, true);
        game.time.events.add(Phaser.Timer.SECOND * 0.2, function(){
            tile.animations.play('destroy');
            tile.animations.currentAnim.onComplete.add(function () {
                tile.animations.play('water');
            }, this);
        }, this);
        
        // 생성된 z-index가 player보다 상위이므로 상태를 swap
        game.world.swap(tile, this.player);
        
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
        this.clear_map();
        
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
        if( game.cache.checkTextKey('stageInfo-' + name) ){
            console.log('Load Map Data (from cache)');
            this.load_map_download();
            return;
        }
        
        game.load.text('stageInfo-' + name, 'assets/data/' + name + '.json');
		game.load.start();
		game.load.onLoadComplete.addOnce(this.load_map_download, this);
    },
    load_map_download: function(){
        game.load.onLoadComplete.remove(this.load_map_download);
        
        var jsonData = game.cache.getText('stageInfo-' + this.stageName);
        this.stageInfo = JSON.parse(jsonData);
        console.log('Downloaded...', this.stageInfo);
        
        if( ! this.stageInfo ){
            alert('게임 불러오기 실패');
            return;
        }
        
        if( game.cache.checkTilemapKey(this.stageInfo.name) ){
            console.log('Downloaded. (from cache)');
            this.load_map_success();
            return;
        }
        
        game.load.tilemap(this.stageInfo.name, 'assets/tilemaps/maps/' + this.stageInfo.tilemap + '.json', null, Phaser.Tilemap.TILED_JSON);
		game.load.start();
		game.load.onLoadComplete.addOnce(this.load_map_success, this);
    },
    load_map_success: function(){
        console.log('Success Load Map Data');
        game.load.onLoadComplete.remove(this.load_map_success);
        this.new_map(this.stageInfo.name);
    },
	clear_map: function(){
	    console.log("Clear Map");
	    
	    if(this.map) this.map.destroy();
	    
		if(this.tilesLayer) this.tilesLayer.destroy();
		if(this.wallsLayer) this.wallsLayer.destroy();

        if(this.carrots) this.carrots.callAll("kill");
	},
    
    set_player: function(){
        // The player and its settings
        var playerTileX = this.stageInfo.starting_point.x, playerTileY = this.stageInfo.starting_point.y;
        this.player = game.add.sprite(32 * playerTileX + 1, 32 * playerTileY - 5, 'rabbit');
    
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
    
    createPopupMenu: function(){
        this.popupMenu = game.add.group();
        this.popupMenu.visible = true;
        this.popupMenu.fixedToCamera = true;
        this.popupMenu.enable = false;
        this.popupMenu.pivot.setTo(- game.camera.width/2, game.camera.height/2);
        
        var restartButton = game.add.button(0, 0, 'button', this.hidePopupMenu, this, 2, 1, 0, 0, this.popupMenu);
        restartButton.anchor.setTo(0.5);
        
        var backToSelectButton = game.add.button(0, 100, 'button', this.backToLevelSelect, this, 2, 1, 0, 0, this.popupMenu);
        backToSelectButton.anchor.setTo(0.5);
        
        this.popupWin = game.add.group();
        
    },
    togglePopupMenu: function(){
        if(this.popupMenu.showing){
            this.hidePopupMenu();
        } else {
            this.showPopupMenu();
        }
        this.popupMenu.showing = !this.popupMenu.showing;
    },
    showPopupMenu: function(){
        this.playing = false;
        if(this.popupMenu.tween) this.popupMenu.tween.stop();
        this.popupMenu.tween = game.add.tween(this.popupMenu.pivot).to({y: - game.camera.height/2}, 1500, Phaser.Easing.Elastic.Out, true);
    },
    hidePopupMenu: function(){
        this.playing = true;
        if(this.popupMenu.tween) this.popupMenu.tween.stop();
        this.popupMenu.tween = game.add.tween(this.popupMenu.pivot).to({y: game.camera.height/2}, 300, Phaser.Easing.Cubic.Out, true);
    },
    showPopupWin: function(){
        
    },
    hidePopupWin: function(){
        
    },
    
    showResult: function(){
        this.backToLevelSelect();
    },
    
    endGame: function(){
        // 게임 실패로 인한 종료
        var style = { font: "bold 72px Baloo Bhaina", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle", stroke: "#000000", strokeThickness: 5 };
    
        //  The Text is positioned at 0, 0
        var text = game.add.text(0, 0, "You Die", style, this.HUDLayer);
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
        this.playing = false;
        
        // game.time.events.add(Phaser.Timer.SECOND * 1, showResult, this);
        
        var style = { font: "bold 72px Baloo Bhaina", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle", stroke: "#000000", strokeThickness: 5 };
    
        var screenCenterX = game.camera.width / 2, screenCenterY = game.camera.height / 2;
        var text = game.add.text(screenCenterX, screenCenterY - 120, "Game Clear!", style, this.HUDLayer);
        text.anchor.setTo(0.5, 0.5);
        var tween = game.add.tween(text.scale).to({x: 1.1, y: 1.1}, 500, Phaser.Easing.Linear.Out, true, 0, -1);
        tween.yoyo(true, 250);
        
        var localScore = this.saveScore(this.score);
        
        // 스코어 보여주고 2초 뒤 레벨 선택창으로 이동
        style.font = '52px Baloo Bhaina';
        style.strokeThickness = 2;
        var scoreText = game.add.text(screenCenterX, screenCenterY + 120, "Score: " + this.score + "\nHighscore: " + localScore.highscore, style, this.HUDLayer);
        scoreText.anchor.setTo(0.5, 0.5);
        game.time.events.add(Phaser.Timer.SECOND * 5, function(){
            game.state.start("LevelSelect");
        });
        
        var curStars = this.getStars(this.score, this.stageInfo);
        var starPos = {
            1: [0],
            2: [-32, +32],
            3: [-64, 0, +64]
        };
        for(var i=0; i < curStars; ++i){
            var star = game.add.sprite(screenCenterX + starPos[curStars][i] + (i == 0 ? 0 : 32 * i), screenCenterY, 'stageStar', 0, this.HUDLayer);
            star.anchor.setTo(0.5, 0.5);
            star.tween = game.add.tween(star.scale).to({x: 0.0}, 500, Phaser.Easing.Circular.InOut, true, 100 * i /* delay */, 1 /*loop*/, true /*yoyo*/);
        }
    },
    
    saveScore: function(score){
        var s = this.loadLocalStageData(), info = this.stageInfo;
        
        // 스테이지 정보가 없으면 초기화
        if( ! s[info.name] ){
            s[info.name] = {
                highscore: 0,
                stars: 1
            };
        }
        
        // 최고 기록보다 높은 경우에만 갱신
        if(s[info.name].highscore < score){
            s[info.name].highscore = score;
            s[info.name].stars = this.getStars(score, info);
        }
        
        this.saveLocalStageData(s);
        
        return s[info.name];
    },
    getStars: function(score, info){
        var stars = 1;
        var star2 = info.star_bound[0], star3 = info.star_bound[1];
        if(star2 <= score) stars = 2;
        if(star3 <= score) stars = 3;
        return stars;
    },
    
    loadLocalStageData: function(){
        var _s = localStorage.getItem('stageScore');
        if( ! _s ) _s = "{}";
        return JSON.parse(_s);
    },
    saveLocalStageData: function(s){
        localStorage.setItem('stageScore', JSON.stringify(s));
    },
    
    backToLevelSelect: function(){
        game.state.start("LevelSelect");
    },
    
    render: function(){
        game.debug.cameraInfo(game.camera, 32, 32);
    }
}