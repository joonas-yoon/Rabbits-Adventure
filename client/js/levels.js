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
    
    totalPage: 2,
    
    init: function(){
        if( ! localStorage.getItem('stageScore') ){
            var initialStage = {
                "stage1-1": {
                    highscore: 0,
                    stars: 0,
                    unlocked: true
                }
            };
            localStorage.setItem('stageScore', JSON.stringify(initialStage));
        }
    },
    preload: function(){
        game.load.image('background', 'assets/images/introBg.jpg');
        game.load.image('arrow', 'assets/arrow.png');
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
        
        var stageScoreData = {};
        var _stageScoreData = localStorage.getItem('stageScore');
        if(_stageScoreData) stageScoreData = JSON.parse(_stageScoreData);

        this.currentPage = 0;

        var titlePaddingBottom = (1.5 * titleOffset + title.height);
        this.stagesButton = game.add.group();
        this.stagesButton.position.setTo(game.world.centerX, (game.world.height - titlePaddingBottom) / 2 + titlePaddingBottom);
        this.stagesButton.inputEnabled = false;
        var buttonSize = 120, buttonScaleSize = buttonSize / 64;
        var buttonMargin = 40;
        for(var stagePage = 1; stagePage <= this.totalPage; ++stagePage){
            for(var i=0; i < 10; ++i){
                var curStage = 'stage' + stagePage +'-' + (i+1);
                var row = i % 5, col = Math.floor(i / 5);
                var x = buttonSize * row + (row > 0 ? buttonMargin * row : 0) - (buttonSize * 2 + buttonMargin * 2);
                var y = buttonSize * col + (col > 0 ? buttonMargin * col : 0) - (buttonSize * 1 + buttonMargin * 0.5);
                
                x += game.camera.width * (stagePage - 1);
                
                var buttonImageIdle = 8 * stagePage;
                var buttonImage = buttonImageIdle, buttonOnEvent = null;
                if(stageScoreData){
                    var stageData = stageScoreData[curStage];
                    if(stageData && stageData.unlocked === true){
                        var stars = stageData.stars;
                        if(stars > 0) buttonImage = buttonImageIdle + 1 + stars;
                        else buttonImage = buttonImageIdle + 1;
                        buttonOnEvent = this.startGame;
                    }
                }
                var button = game.add.button(x, y, 'button',  buttonOnEvent, this, buttonImage, buttonImage, buttonImage);
                button.scale.setTo(buttonScaleSize);
                button.anchor.setTo(0.5);
                button.stageName = curStage;
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
        }
        
        var prevBtn = game.add.button(0, game.camera.height / 2, 'arrow',  this.swipePrevPage, this, 17, 18, 19);
        prevBtn.anchor.setTo(0.0, 0.5);
        prevBtn.scale.setTo(0.4, 0.5);
        var nextBtn = game.add.button(game.camera.width, game.camera.height / 2, 'arrow',  this.swipeNextPage, this, 17, 18, 19);
        nextBtn.anchor.setTo(0.0, 0.5);
        nextBtn.scale.setTo(-0.4, 0.5);
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
    },
    
    swipeNextPage: function(){
        if(this.currentPage+1 < this.totalPage) this.changePage(+1);
    },
    swipePrevPage: function(){
        if(this.currentPage-1 >= 0) this.changePage(-1);
    },
    changePage: function(page){
        this.currentPage += page;
        var nextX = this.currentPage * - game.camera.width + (game.camera.width / 2);
        var tween = game.add.tween(this.stagesButton).to({
            x: nextX
        }, 300, Phaser.Easing.Cubic.Out, true);
     }
}