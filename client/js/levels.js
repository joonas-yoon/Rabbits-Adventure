/**
 *   스테이지 및 레벨 선택 화면
 *   with Phaser.io
 * 
 *   File: levels.js
 **/
 
WebFont.load({
    google: {
      families: ['Baloo Bhaina', 'Droid Sans', 'Droid Serif']
    }
});

var LabelButton = function(game, x, y, key, label, callback,
        callbackContext, overFrame, outFrame, downFrame, upFrame){
    Phaser.Button.call(this, game, x, y, key, callback,
        callbackContext, overFrame, outFrame, downFrame, upFrame);
    //Style how you wish... 
    this.style = {        
        'font': '20px Baloo Bhaina',
        'fill': 'black'
    };
    this.anchor.setTo( 0.5, 0.5 );
    this.label = new Phaser.Text(game, 0, 0, label, this.style);
    //puts the label in the center of the button
    this.label.anchor.setTo( 0.5, 0.5 );
    this.addChild(this.label);
    this.setLabel( label );
    //adds button to game
    game.add.existing( this );
};
LabelButton.prototype = Object.create(Phaser.Button.prototype);
LabelButton.prototype.constructor = LabelButton;
LabelButton.prototype.setLabel = function( label ) {
    this.label.setText(label);
};

var levelSelect = function(game){};
levelSelect.prototype = {

    init: function(){
        
    },
    preload: function(){
        game.load.image('background', 'assets/images/introBg.jpg');
        game.load.spritesheet('button', 'assets/sprites/level_64x64.png', 64, 64);
    },
    create: function(){
        game.camera.follow(null);
		game.camera.setPosition(0, 0);
		game.world.setBounds(0, 0, game.camera.width, game.camera.height);
		
        this.background = game.add.tileSprite(0, 0, game.width, game.height, 'background');
        
        var titleOffset = 75;
        var title = game.add.text(game.world.centerX, titleOffset, "Level Select");
        title.anchor.setTo(0.5);
    
        title.font = 'Baloo Bhaina';
        title.fontSize = 80;
        title.align = 'center';
        title.stroke = '#ffffff';
        title.strokeThickness = 5;
        title.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);

        this.btnStart = new LabelButton(this.game, 100, 50, "button", "Back to Intro", this.backToIntro, this, 1, 0, 2); // button frames 1=over, 0=off, 2=down

        var titlePaddingBottom = (1.5 * titleOffset + title.height);
        this.stagesButton = game.add.group();
        this.stagesButton.position.setTo(game.world.centerX, (game.world.height - titlePaddingBottom) / 2 + titlePaddingBottom);
        this.stagesButton.inputEnabled = false;
        var buttonSize = 120, buttonScaleSize = buttonSize / 64;
        var buttonMargin = 40;
        for(var i=0; i < 10; ++i){
            var row = i % 5, col = Math.floor(i / 5);
            var x = buttonSize * row + (row > 0 ? buttonMargin * row : 0) - (buttonSize * 2 + buttonMargin * 2);
            var y = buttonSize * col + (col > 0 ? buttonMargin * col : 0) - (buttonSize * 1 + buttonMargin * 0.5);
            var button = game.add.button(x, y, 'button', this.startGame, this, 8, 8, 8);
            button.scale.setTo(buttonScaleSize);
            button.anchor.setTo(0.5);
            button.stageName = 'stage1-' + (i+1);
            button.alpha = 0.75;
            button.onInputOver.add(function(btn){
                btn.alpha = 1.0;
                if(btn.tween) btn.tween.stop();
                btn.tween = game.add.tween(btn.scale).to({x: buttonScaleSize * 1.2, y: buttonScaleSize * 1.2}, 1000, Phaser.Easing.Elastic.Out, true);
            }, this);
            button.onInputOut.add(function(btn){
                btn.alpha = 0.75;
                if(btn.tween) btn.tween.stop();
                btn.tween = game.add.tween(btn.scale).to({x: buttonScaleSize, y: buttonScaleSize}, 600, Phaser.Easing.Bounce.Out, true);
            }, this);
            
            this.stagesButton.add(button);
        }
    },
    update: function(){
        this.background.tilePosition.x += 0.1;
        this.background.tilePosition.y += 0.1;
    },
    
    backToIntro: function(){
        game.state.start("GameIntro", false, false);
    },
    startGame: function(button){
        console.log('play ' + button.stageName);
        game.state.start("PlayGame", true, false, button.stageName);
    }
}