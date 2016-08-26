/**
 *   게임 시작 시 나타나는 처음 화면
 *   with Phaser.io
 * 
 *   File: intro.js
 **/
 
WebFont.load({
    google: {
      families: ['Baloo Bhaina', 'Droid Sans', 'Droid Serif']
    }
});

var gameIntro = function(game){};
gameIntro.prototype = {

    init: function(){
        
    },
    preload: function(){
        game.load.image('background', 'assets/images/introBg.jpg');
        game.load.spritesheet('button', 'assets/buttons/button_sprite_sheet.png', 193, 71);
    },
    create: function(){
        this.background = game.add.tileSprite(0, 0, game.width, game.height, 'background');
        
        var text = game.add.text(game.world.centerX, game.world.centerY / 2, "Rabbit's\nAdventure");
        text.anchor.setTo(0.5);
    
        text.font = 'Baloo Bhaina';
        text.fontSize = 80;
        text.align = 'center';
        text.stroke = '#ffffff';
        text.strokeThickness = 5;
        text.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);
        
        var startButton = game.add.button(game.world.centerX, game.world.centerY / 2 + 200, 'button', this.startGame, this, 2, 1, 0);
        startButton.anchor.setTo(0.5);
        // startButton.onInputOver.add(over, this);
        // startButton.onInputOut.add(out, this);
        // startButton.onInputUp.add(startButtonUp, this);
    },
    update: function(){
        this.background.tilePosition.x += 0.1;
        this.background.tilePosition.y += 0.1;
    },
    
    startGame: function(){
        game.state.start("LevelSelect", false, false);
    }
}