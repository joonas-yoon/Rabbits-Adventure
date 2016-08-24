/**
 *   Script for Game
 *   with Phaser.io
 * 
 *   File: game.js
 **/

(function() {
    
    /**
     * Setting Up
     */
     
    var game = new Phaser.Game(1170, 600, Phaser.AUTO, 'gameContainer',
        { preload: preload, create: create, update: update }
    );
    
    var player;
    var player_facing = 'left';
    var player_tileX, player_tileY;
    var facingFrame = ['down', 'left', 'right', 'up'];
    var platforms;
    var cursors;
    var map;
    var wallsLayer;
    var tilesLayer;
    
    var marker;
    
    function preload() {
        game.load.tilemap('map', 'assets/tilemaps/maps/test.json', null, Phaser.Tilemap.TILED_JSON);
        game.load.image('ground_1x1', 'assets/tilemaps/tiles/ground_1x1.png');
        game.load.spritesheet('rabbit', 'assets/rabbit.png', 32, 32);
        game.load.spritesheet('ground_sprite', 'assets/tilemaps/tiles/ground_1x1.png', 32, 32);
    }
    
    function create() {
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        map = game.add.tilemap('map');
    
        map.addTilesetImage('ground_1x1');
        // 충돌이 일어나는 타일셋 프레임 범위
        map.setCollisionBetween(1, 13);
        //  ID가 26인 타일과 충돌이 일어나면 spriteDead() 를 호출함
        map.setTileIndexCallback(26, spriteDead, this);
    
        tilesLayer = map.createLayer('Tile Layer');
        tilesLayer.alpha = 0.75;

        wallsLayer = map.createLayer('Wall Layer');
    
        //  Scroll it
        wallsLayer.resizeWorld();
        
        // The player and its settings
        player = game.add.sprite(32 + 1, 10 * 32 + 1, 'rabbit');
    
        //  We need to enable physics on the player
        game.physics.arcade.enable(player);
        player.body.fixedRotation = true;
        player.body.collideWorldBounds = true;
        player.body.setSize(16, 16, 8, 20);
    
        //  Our two animations, walking left and right.
        player.animations.add('down', [1, 0, 1, 2], 10, true);
        player.animations.add('left', [13, 12, 13, 14], 10, true);
        player.animations.add('right', [25, 24, 25, 26], 10, true);
        player.animations.add('up', [37, 36, 37, 38], 10, true);
        
        game.camera.follow(player);
    
        //  Our controls.
        cursors = game.input.keyboard.createCursorKeys();
        
        //  Our painting marker
        marker = game.add.graphics();
        marker.lineStyle(2, 0xffcc00, 1);
        marker.drawRect(0, 0, 32, 32);
    }
    
    function update() {
        //  Collide the player and the stars with the platforms
        game.physics.arcade.collide(player, wallsLayer);
        
        //  Reset the players velocity (movement)
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        player.bringToTop();
    
        if (cursors.left.isDown)
        {
            //  Move to the left
            player.body.velocity.x = -150;
            
            player.animations.play('left');
            player_facing = 'left';
        }
        else if (cursors.right.isDown)
        {
            //  Move to the right
            player.body.velocity.x = 150;
    
            player.animations.play('right');
            player_facing = 'right';
        }
        else if (cursors.up.isDown)
        {
            //  Move to the up
            player.body.velocity.y = -150;
    
            player.animations.play('up');
            player_facing = 'up';
        }
        else if (cursors.down.isDown)
        {
            //  Move to the down
            player.body.velocity.y = 150;
    
            player.animations.play('down');
            player_facing = 'down';
        }
        else {
            //  Stand still
            player.animations.stop();
            
            if( facingFrame.indexOf(player_facing) != -1 ){
                player.frame = facingFrame.indexOf(player_facing) * 12 + 1;
            }
        }
        
        updateMarker();
    }
    
    function updateMarker() {
        
        var curTileX = tilesLayer.getTileX(player.body.center.x);
        var curTileY = tilesLayer.getTileY(player.body.center.y);
        
        // 플레이어가 다른 타일로 이동함
        if( player_tileX !== curTileX || player_tileY !== curTileY )
        {
            // 이전에 있던 타일을 삭제, 닿으면 죽게 바꿈
            changeToDeathZone(player_tileX, player_tileY);
            
            // 플레이어의 위치를 갱신
            player_tileX = curTileX;
            player_tileY = curTileY;
            
            marker.x = player_tileX * 32;
            marker.y = player_tileY * 32;
        }
        
        checkDeathPosition(player_tileX, player_tileY);
    }
    
    function checkDeathPosition(tileX, tileY){
        var currentTile = map.getTile(tileX, tileY, tilesLayer);
        // console.log(currentTile);
        if(currentTile.index == 26){
            spriteDead(player, currentTile);
        }
    }
    
    function changeToDeathZone(tileX, tileY){
        map.putTile(26, tileX, tileY, tilesLayer);
        
        var tile = game.add.sprite(tileX * 32, tileY * 32, 'ground_sprite');
        // player.body.setSize(16, 16, 8, 20);
        tile.animations.add('destory', [22, 23, 24, 25, 26], 7, false);
        setTimeout(function(){
            tile.animations.play('destory');
        }, 200);
    }
    
    function spriteDead(sprite, tile){
        var style = { font: "bold 32px Arial", fill: "#fff", boundsAlignH: "center", boundsAlignV: "middle" };
    
        //  The Text is positioned at 0, 100
        game.add.text(0, 0, "You Die", style);
        
        return false;
    }
    
})();