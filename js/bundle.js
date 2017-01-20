(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
var Direction = {'LEFT':-1, 'RIGHT':1, 'NONE':0};

//DEFINICION DE OBJETOS DE LA ESCENA
//Bandos del juego. Enemigos, heroe e indefinido para errores.
var party = {enemy : 0, hero : 1, undefined: -1};


////////////////////////////////////////////////////////////////////////////
//Character, clase base para desarrollar el resto de personajes
function Character(x, y, party, name, spritename, escene){
  Phaser.Sprite.call(this, escene.game, x, y,spritename);
  escene.game.add.existing(this);
  this.scale.setTo(3, 3);
  escene.game.physics.arcade.enable(this);
  //Cambiamos el ancla del sprite al centro.
  this.anchor.setTo(0.5,0.5);
  this.startposition = {x:x, y:y} || {x:0, y:0};
  this.name = name || 'name not defined';
  this.party = party || party.undefined;
  this.playerSpeed = 400;


  Character.prototype.moveX =  function (dir) {
    switch (dir) {
      case Direction.RIGHT:
        this.body.velocity.x = this.playerSpeed;
        break;
      case Direction.LEFT:
        this.body.velocity.x = -this.playerSpeed;
        break;
      case Direction.NONE:
        this.body.velocity.x = 0;
        break;
      default:
    }
  };
Character.prototype.isStanding = function(){
     return this.body.blocked.down || this.body.touching.down;
};
}
Character.prototype = Object.create(Phaser.Sprite.prototype);
Character.prototype.constructor = Character;

////////////////////////////////////////////////////////////////////////////
//Rey, que hereda de Character y se mueve y salta conforme al input del usuario
function King (x, y, escene){
  //TODO CAMBIAR EL SPRITE AÑADIDO.
Character.apply(this, [x, y, party.hero, 'King', 'personaje', escene]);
//ANIMACIONES
this.animations.add('run',Phaser.Animation.generateFrameNames('R',0,3),15,true);
this.animations.add('jump', Phaser.Animation.generateFrameNames('J',0,4),10, false);
this.animations.add('idle', Phaser.Animation.generateFrameNames('R',0,0),1,true);

//SONIDO DEL SALTO
this.jumpsound = this.game.add.audio('jumpsound');

//FUNCIONES DEL REY
  King.prototype.update = function () {

    this.animasion = '';
    if(escene.collisionDeath || this.lifes <= 0){
      escene.gameOver = true;
    }
    var dir = this.getInput();
    if(dir!== 0)
    {
      this.scale.x = 3*dir;
      if(this.isStanding())this.animasion = 'run';
    }
    else this.animasion = 'idle';
    if(this.isJumping()) this.animasion = 'jump';
    this.animations.play(this.animasion);
    Character.prototype.moveX.call(this, dir);

  };

  King.prototype.getInput = function () {
    var movement = Direction.NONE;
    //Move Right
    if(escene.game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) movement = Direction.RIGHT;
    else if(escene.game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) movement = Direction.LEFT;
    if(this.canJump() && escene.game.input.keyboard.isDown(Phaser.Keyboard.UP)){
      this.jump();
  }
    return movement;
  };

King.prototype.isJumping = function(){
  if(!this.isStanding() && this.body.velocity.y < 0) return true;
  else return false;
};
  King.prototype.jump = function (){
      this.jumpsound.play(false);
      this.body.velocity.y = -700;

  };

    King.prototype.canJump = function(){
      return this.isStanding() && escene.collisionWithTilemap || escene.collisionWithEnnemies;
  };

}
King.prototype = Object.create(Character.prototype);
King.prototype.constructor = King;


////////////////////////////////////////////////////////////////////////////
//Enemigos
//Enemy, clase base para enemigos. Si tocan al rey le hacen daño.
function Enemy (name, x, y, spriteName, escene) {
    Character.apply(this, [x, y,party.enemy,name , spriteName, escene]);
    this.enemyhit = this.game.add.audio('enemyHit');

    Enemy.prototype.SideCollision = function (){
      return escene.collisionWithEnnemies && ((this.body.blocked.left || this.body.blocked.right)||(this.body.touching.left || this.body.touching.right));
    };
    Enemy.prototype.KillPlayer = function(){
        return !this.Stepped() && this.SideCollision();
      };
    Enemy.prototype.Stepped = function(){
        return escene.collisionWithEnnemies && this.touchedUp();
      };
    Enemy.prototype.touchedUp = function(){
        return this.body.blocked.up || this.body.touching.up;
      };
}

Enemy.prototype = Object.create(Character.prototype);
Enemy.prototype.constructor = Enemy;

////////////////////////////////////////////////////////////////////////////
//Serpiente, hereda de enemy y se mueve a izquierda y derecha
function Serpiente(x, y, escene){
  Enemy.apply(this, ['Serpiente', x, y, 'serpiente'/*Nombre de sprite*/, escene]);
//Animaciones de la serpiente
  this.runanim = this.animations.add('run',Phaser.Animation.generateFrameNames('S',0,3),3,true);
  this.animations.add('idle', Phaser.Animation.generateFrameNames('S',0,0),1,true);
  this.deathanim = this.animations.add('death', Phaser.Animation.generateFrameNames('D',0,3),50,false);
  this.runanim.speed = 10;
  this.playerSpeed = 450;

  this.reach = 250;
  this.primera = false;
  Serpiente.prototype.update = function (){
    if(!this.primera)
    this.moveX(this.playerNear());
    if(this.KillPlayer())  escene.gameOver = true;
    if(this.Stepped() && !this.primera){
      escene.sceneScore += 10;
      this.enemyhit.play(false);
      this.animations.play('death');
      this.primera = true;
    }
    this.deathanim.killOnComplete = true;

  };
  Serpiente.prototype.playerNear = function () {
    if((escene._player.y <= this.y && escene._player.y >= this.y - 150)||(escene._player.y >=this.y && escene._player.y <= this.y + 150)){
      if(escene._player.x <= this.x  && escene._player.x >= this.x - this.reach)
      {
        this.animations.play('run');
        this.scale.x = Direction.LEFT * 3;
        return Direction.LEFT;
      }
      else if (escene._player.x >= this.x && escene._player.x <= this.x + this.reach)
       {
         this.animations.play('run');
         this.scale.x = Direction.RIGHT * 3;
          return Direction.RIGHT;
        }
    }
    else {
      this.animations.play('idle');
      return 0;
    }
  };
}
Serpiente.prototype = Object.create(Enemy.prototype);
Serpiente.prototype.constructor = Serpiente;

////////////////////////////////////////////////////////////////////////////
//Golem, enemigo final del juego.
function Golem(x, y, escene){
  Enemy.apply(this, ['Golem', x, y, 'Golem', escene]);
  this.animations.add('run', Phaser.Animation.generateFrameNames('R',0,3),10,true);
  this.summonanim = this.animations.add('summon', Phaser.Animation.generateFrameNames('Summon',0,1),2,false);
  this.animations.add('idle', Phaser.Animation.generateFrameNames('R',0,0),1,true);
  this.playerSpeed = 450;
  this.state = 0;
  this.lifes = 2;
  this.direccion = Direction.LEFT;
  var self = this;
  this.tocado = false;
  this.maxSerpientes = 5;
  this.Serpientes = 0;
Golem.prototype.update = function (){

  if (this.lifes === 0)this.game.state.start('levelSucceed');
  if(this.KillPlayer())  escene.gameOver = true;
  if(this.Stepped() && !this.tocado){
    this.lifes--;
    this.tocado = true;
  }
this.scale.x = this.direccion * 3;
  switch(this.lifes){
    case 2:
      this.checkSides();
      this.moveX(this.direccion);
      this.animations.play('run');
      break;
    case 1:
    this.option = Math.floor((Math.random() * 100000) + 1);
    if(this.option > 0 && this.option < 90000){
      this.animations.play('run');
      this.checkSides();
    }
    else if (this.option > 90000 && this.Serpientes <= this.maxSerpientes){
        this.spawnSnake();
        this.Serpientes++;

    }
    break;

  }
  if(this.direccion === 0)this.animations.play('idle');
  this.moveX(this.direccion);
  if(Phaser.Math.distance(this.x, this.y, escene._player.x, escene._player.y) > 100)this.tocado = false ;
};
Golem.prototype.spawnSnake = function (){
    var serp = new Serpiente((Math.random() * 1390)+970, this.y, escene);
    escene.enemies.add(serp);
    escene.objectArray.push(serp);
};
Golem.prototype.checkSides = function(){
    if(this.body.blocked.right || this.body.touching.right){
    this.direccion = Direction.LEFT;
    this.playerSpeed = 450 * Math.floor((Math.random() * 2) + 1);
    }
    else if(this.body.blocked.left || this.body.touching.left){
    this.direccion = Direction.RIGHT;
    this.playerSpeed = 450 * Math.floor((Math.random() * 2) + 1);
    }

  };
}
Golem.prototype = Object.create(Enemy.prototype);
Golem.prototype.constructor = Golem;

module.exports = {
  King: King,
  Serpiente: Serpiente,
  Golem: Golem
};

},{}],2:[function(require,module,exports){
'use strict';
var characters = require('./Characters.js');

function CreateMap (Jsonfile, escene){
      escene.map = escene.game.add.tilemap(Jsonfile);
        //Utilizaremos siempre la misma hoja de patrones, por tanto, no necesitamos pasarla por
        //variable.

      escene.map.addTilesetImage('sheet', 'tiles');
      escene.game.physics.arcade.TILE_BIAS = 40;

        //Creamos las capas de nuestro tilemap
      escene.back = escene.map.createLayer('Back');
      escene.death = escene.map.createLayer('Death');
      escene.ground = escene.map.createLayer('Ground');
      //escene.back.alpha = 100;
      //escene.spawn = escene.map.createLayer('spawn');

        //Declaramos las colisiones con la muerte y el Suelo
      escene.map.setCollisionBetween(1, 5000, true, 'Death');
      escene.map.setCollisionBetween(1, 5000, true, 'Ground');

      escene.ground.setScale(3,3);
      escene.back.setScale(3,3);
      escene.death.setScale(3,3);
      //this.spawn.setScale(3,3);

      //escene.spawn.visible = false;
      escene.game.stage.backgroundColor = '#a9f0ff';
    }

module.exports = {
CreateMap: CreateMap
};

},{"./Characters.js":1}],3:[function(require,module,exports){
var Credits = {

  preload: function () {
    this.optionCount = 1;
    this.creditCount = 0;

  },

  addCredit: function(task, author) {
    var authorStyle = { font: '40pt TheMinion', fill: 'white', align: 'center', stroke: 'rgba(0,0,0,0)', strokeThickness: 4};
    var taskStyle = { font: '30pt TheMinion', fill: 'white', align: 'center', stroke: 'rgba(0,0,0,0)', strokeThickness: 4};
    var authorText = this.game.add.text(this.game.world.centerX, 900, author, authorStyle);
    var taskText = this.game.add.text(this.game.world.centerX, 950, task, taskStyle);
    authorText.anchor.setTo(0.5);
    authorText.stroke = "rgba(0,0,0,0)";
    authorText.strokeThickness = 4;
    taskText.anchor.setTo(0.5);
    taskText.stroke = "rgba(0,0,0,0)";
    taskText.strokeThickness = 4;
    this.game.add.tween(authorText).to( { y: -300 }, 20000, Phaser.Easing.Cubic.Out, true, this.creditCount * 4000);
    this.game.add.tween(taskText).to( { y: -200 }, 20000, Phaser.Easing.Cubic.Out, true, this.creditCount * 4000);
    this.creditCount ++;
  },


  addMenuOption: function(text, callback) {
    var optionStyle = { font: '30pt calibri', fill: 'white', align: 'left', stroke: 'rgba(0,0,0,0)', srokeThickness: 4};
    var button =  this.game.add.button(100, (this.optionCount * 80) + 400, 'button', callback, this, 2, 1, 0);
    var txt = this.game.add.text(0,0, text, optionStyle);
    txt.anchor.set(0.5);
    button.anchor.set(0.5);
    button.addChild(txt);

    txt.stroke = "rgba(0,0,0,0";
    txt.strokeThickness = 4;
    var onOver = function (target) {
      target.fill = "#FEFFD5";
      target.stroke = "rgba(200,200,200,0.5)";
      txt.useHandCursor = true;
    };
    var onOut = function (target) {
      target.fill = "white";
      target.stroke = "rgba(0,0,0,0)";
      txt.useHandCursor = false;
    };
    txt.useHandCursor = true;
    txt.inputEnabled = true;
    txt.events.onInputUp.add(callback, this);
    txt.events.onInputOver.add(onOver, this);
    txt.events.onInputOut.add(onOut, this);

    this.optionCount ++;
  },

  create: function () {
    
    this.kekstar = this.game.add.sprite(30,320,'kekstar');
    this.kekstar.scale.setTo(0.05, 0.05);
    this.music = this.game.add.audio('creditMusic');
    this.music.loop = true;
    this.music.play();
    this.stage.disableVisibilityChange = true;
    this.addCredit('for playing', 'Thank you');
    this.addCredit('Kekstar Studio', 'Brought to you by');
    this.addCredit('Lead One-Hand Programmer', 'Francisco Solano López');
    this.addCredit('Lead Programmer/ Level Designer', 'Manuel Hernández');
    this.addCredit('Hideo Kojima', 'Hideo Kojima');
    this.addCredit('Phaser.io', 'Powered By');
    this.addMenuOption('Menu', function (e) {
      this.music.destroy();
      this.game.click.play(false);
      this.game.state.start("menu");
    });
    this.addMenuOption('GitHub', function (e) {
      this.music.destroy();
      this.game.click.play(false);
      window.open("https://github.com/Kekstar");
    });



  }

};
module.exports = Credits;

},{}],4:[function(require,module,exports){
var GameOver = {
    create: function () {
      this.game.stage.backgroundColor = '#ffffff';
        console.log("Game Over");
        var button = this.game.add.button(400, 300,
                                          'button',
                                          this.restart,
                                          this, 2, 1, 0);
        button.anchor.set(0.5);
        var goText = this.game.add.text(400, 100, "¡Has muerto!");
        goText.font = 'Astloch';
        goText.fontSize = 70;
        var text = this.game.add.text(0, 0, "Reintentar");
        text.font = 'Astloch';
        text.fill = 'white';
        text.fontSize = 40;
        //text.fontVariant = 'Bold';
        text.anchor.set(0.5);
        goText.anchor.set(0.5);
        button.addChild(text);


        var button2 = this.game.add.button(400, 200,
                                          'button',
                                          this.goMenu,
                                          this, 2, 1, 0);
        button2.anchor.set(0.5);
        var text2 = this.game.add.text(0, 0, "Menu");
        text2.font = 'Astloch';
        text2.fontSize = 40;
        text2.fill = 'white';
        text2.anchor.set(0.5);
        button2.addChild(text2);


        button.anchor.set(0.5);


    },
    restart: function(){
      this.game.click.play(false);
      this.game.state.start('play');
    },

    goMenu: function(){
      this.game.click.play(false);
      this.game.state.start('menu');
    }
};

module.exports = GameOver;

},{}],5:[function(require,module,exports){
var GameOver = {
    create: function () {
      this.music = this.game.add.audio('levelSuccess');
      this.music.volume = 0.5;
      this.music.play();
      this.game.stage.backgroundColor = '#ffffff';
        if(this.game.niveles[this.game.nivelActual+1] !== undefined){
          this.game.nivelActual++;
          var button = this.game.add.button(400, 300,
                                            'button',
                                            this.continue,
                                            this, 2, 1, 0);
          button.anchor.set(0.5);

          var text = this.game.add.text(0, 0, "Sig. Nivel");
          text.font = 'Astloch';
          text.fill = 'white';

          text.fontSize = 40;
          text.anchor.set(0.5);
          button.addChild(text);
          button.anchor.set(0.5);
        }
        else {
          var endGameText = this.game.add.text(400, 300, "¡Acabaste el Juego!");
          endGameText.font = 'Astloch';
          endGameText.fontSize = 70;
          endGameText.anchor.set(0.5);
          this.game.nivelActual = 1;

        }
        var scoreText = this.game.add.text(400, 200, "Puntuación global:"+this.game.overallScore);
        scoreText.font = 'Astloch';
        scoreText.fontSize = 70;
        scoreText.anchor.set(0.5);
        var goText = this.game.add.text(400, 100, "¡Nivel Completado!");
        goText.font = 'Astloch';
        goText.fontSize = 70;
        var button2 = this.game.add.button(400, 400,
                                          'button',
                                          this.goMenu,
                                          this, 2, 1, 0);
        button2.anchor.set(0.5);
        goText.anchor.set(0.5);
        var text2 = this.game.add.text(0, 0, "Menu");
        text2.font = 'Astloch';
        text2.fontSize = 40;
        text2.fill = 'white';
        text2.anchor.set(0.5);
        button2.addChild(text2);





    },
    //DONE 7 declarar el callback del boton.
    continue: function(){
      this.music.destroy();
      this.game.click.play(false);
      this.game.state.start('play');
    },

    goMenu: function(){
      this.music.destroy();
      this.game.click.play(false);
      this.game.state.start('menu');
    }
};

module.exports = GameOver;

},{}],6:[function(require,module,exports){
'use strict';

var playScene = require('./play_scene');
var gameOver = require('./gameover_scene');
var menuScene = require('./menu_scene');
var credits = require('./credits');
var levelSucceed = require('./levelSucceed_scene');

//  The Google WebFont Loader will look for this object, so
// it before loading the script.


var BootScene = {
  preload: function () {
    // load here assets required for the loading screen
    this.game.load.image('preloader_bar', 'images/preloader_bar.png');
    this.game.load.spritesheet('button', 'images/buttons.png', 168, 70);
    this.game.load.image('logo', 'images/castle.png');
    this.game.load.image('kekstar','images/kekstar.png');
    //http://freesound.org/people/NenadSimic/sounds/171697/
    this.game.load.audio('click', 'Sounds/Effects/click.wav');

    //http://opengameart.org/content/generic-8-bit-jrpg-soundtrack
    this.game.load.audio('intromusic', 'Sounds/Music/intro.ogg');
    this.game.load.audio('creditMusic', 'Sounds/Music/credits.ogg');

  },

  create: function () {
      this.game.click = this.game.add.audio('click');
      this.game.state.start('preloader');
      this.game.state.start('menu');
  }
};


var PreloaderScene = {
  preload: function () {
    this.loadingBar = this.game.add.sprite(100,300, 'preloader_bar');
    this.loadingBar.anchor.setTo(0, 0.5);
    this.game.load.setPreloadSprite(this.loadingBar);
    this.game.stage.backgroundColor = "#000000";
    this.load.onLoadStart.add(this.loadStart, this);
    //DONE 2.1 Cargar el tilemap images/map.json con el nombre de la cache 'tilemap'.
      //la imagen 'images/simples_pimples.png' con el nombre de la cache 'tiles' y
      // el atlasJSONHash con 'images/rush_spritesheet.png' como imagen y 'images/rush_spritesheet.json'
      //como descriptor de la animación.

    this.game.load.tilemap('Nivel1', 'mapas/Nivel1.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.tilemap('Nivel2', 'mapas/Nivel2.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.tilemap('Nivel3', 'mapas/Nivel3.json', null, Phaser.Tilemap.TILED_JSON);

    this.game.load.image('tiles', 'images/sheet.png');
    //http://freesound.org/people/Questiion/sounds/166392/
    this.game.load.audio('music1','Sounds/Music/Level1.wav');
    this.game.load.audio('music2','Sounds/Music/Level2.ogg');

    //http://freesound.org/people/primordiality/sounds/78824/
    this.game.load.audio('levelSuccess', 'Sounds/Effects/LevelSuccess.wav');



    this.game.load.audio('jumpsound','Sounds/Effects/Jump.wav');

    this.game.load.audio('enemyHit', "Sounds/Effects/EnemyHit.wav");
    //http://freesound.org/people/josepharaoh99/sounds/361636/
    this.game.load.audio('playerDeath', "Sounds/Effects/PlayerDeath.mp3");

    //http://freesound.org/people/cabled_mess/sounds/350986/
    this.game.load.audio('lost', 'Sounds/Effects/lost.wav');

    this.game.load.atlas('personaje', 'images/Character Sprites/King/King.png', 'atlas/King.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);

    this.game.load.atlas('serpiente', 'images/Character Sprites/Snake/Snake.png', 'atlas/Snake.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);

      this.game.load.atlas('Golem', 'images/Character Sprites/Golem/Golem.png', 'atlas/Golem.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);

    this.game.load.image('stairs','images/stairs.png');
    this.load.onLoadComplete.add(this.loadComplete,this);
      //DONE 2.2a Escuchar el evento onLoadComplete con el método loadComplete que el state 'play'

  },
  loadStart: function () {
    console.log("Game Assets Loading ...");
  },
  loadComplete: function() {
    this.ready = true;
    this.game.state.start('play');
    console.log("Game Assets Loaded!");
  },
     //DONE 2.2b function loadComplete()
    update: function(){
    },

};
var wfconfig = {
  active: function() {
      init();
  },
  google: {
      families: ['Sniglet', 'MedievalSharp', 'Astloch']
  }

};


window.init = function(){
  //Metodo init, que será llamado una vez la fuente se haya cargado.
  var game = new Phaser.Game(800, 600, Phaser.AUTO, 'game');
  game.state.add('boot', BootScene);
  game.state.add('menu', menuScene);
  game.state.add('preloader', PreloaderScene);
  game.state.add('play', playScene);
  game.state.add('creditos', credits);
  game.state.add('gameOver', gameOver);
  game.state.add('levelSucceed',levelSucceed);
  //Comenzamos con el estado boot
  game.state.start('boot');
  game.niveles = { 1: 'Nivel1', 2: 'Nivel2', 3: 'Nivel3'};
  game.musics = { 1: 'music1', 2:'music2', 3: 'music1'};
  game.nivelActual = 1;
  game.overallScore = 0;

}
window.onload = function () {
  WebFont.load(wfconfig);
};

},{"./credits":3,"./gameover_scene":4,"./levelSucceed_scene":5,"./menu_scene":7,"./play_scene":8}],7:[function(require,module,exports){
var MenuScene = {
  preload: function () {
    this.optionCount = 1;
  },
  create: function () {
      this.intromusic = this.game.add.audio('intromusic');
      this.intromusic.loop = true;
      this.intromusic.play();
      this.game.world.setBounds(0,0,800,600);
      this.game.stage.backgroundColor = "#000000";
      var logo = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY/2, 'logo');
      logo.anchor.setTo(0.5, 0.5);
      logo.scale.setTo(0.75, 0.75);
      this.addMenuOption('Jugar', function (e) {
          this.intromusic.destroy();
          this.game.click.play(false);
          this.game.state.start('preloader');
      });
      this.addMenuOption('Creditos', function (e) {
          this.intromusic.destroy();
          this.game.click.play(false);
          this.game.state.start("creditos");
      });
      this.addMenuOption('GitHub', function (e) {
        this.intromusic.destroy();
        this.game.click.play(false);
        window.open("https://github.com/Kekstar");
      });
  },
  addMenuOption: function(text, callback) {
    var optionStyle = { font: '40pt Astloch', fontVariant: 'Bold', fill: 'yellow', align: 'left', stroke: 'rgba(0,0,0,0)', srokeThickness: 4};
    var button =  this.game.add.button(this.game.world.centerX, (this.optionCount * 80)+300, 'button', callback, this, 2, 1, 0);
    var txt = this.game.add.text(0,0, text, optionStyle);
    txt.anchor.set(0.5);
    button.anchor.set(0.5);
    button.addChild(txt);
    txt.stroke = "rgba(0,0,0,0";
    txt.strokeThickness = 4;
    var onOver = function (target) {
      target.fill = "#FEFFD5";
      target.stroke = "rgba(200,200,200,0.5)";
      txt.useHandCursor = true;
    };
    var onOut = function (target) {
      target.fill = "yellow";
      target.stroke = "rgba(0,0,0,0)";
      txt.useHandCursor = false;
      };
      txt.useHandCursor = true;
      txt.inputEnabled = true;
      txt.events.onInputUp.add(callback, this);
      txt.events.onInputOver.add(onOver, this);
      txt.events.onInputOut.add(onOut, this);

      this.optionCount ++;
    }
};

module.exports = MenuScene;

},{}],8:[function(require,module,exports){
'use strict';

//Enumerados: PlayerState son los estado por los que pasa el player. Directions son las direcciones a las que se puede
//mover el player.
var characters = require('./Characters.js');
var mapCreator = require('./MapCreator');
//EScena de juego.
var PlayScene = {
    _player: {},

  create: function () {
    this.gameOver = false;
    this.sceneScore = 0;
    this.game.physics.startSystem(Phaser.Physics.ARCADE);

    //Inicializacion de audios.
    this.music = this.game.add.audio(this.game.musics[this.game.nivelActual]);
    this.lostSound = this.game.add.audio('lost');
    this.playerDeath = this.game.add.audio('playerDeath');
    this.music.volume = 0.3;
    this.music.play();
    this.music.loop = true;
    //Inicializacion de Hud
    this.hudScore = this.game.add.text(10, 0, 'Score: 0');
    this.hudScore.font = 'Astloch';
    this.hudScore.fontSize = 50;
    this.hudScore.fixedToCamera = true;

    //Generamos el mapa.
    new mapCreator.CreateMap(this.game.niveles[this.game.nivelActual], this);
    //Introducimos los objetos de juego
    //Array de enemigos
    this.objectArray = [];
    //grupo para los sprites de los enemigos.
    this.enemies = this.game.add.group();
    this.spawnObjects('Spawn');

    this.pauseButton = this.game.input.keyboard.addKey(Phaser.Keyboard.P);
    this.configure();

  },

  spawnObjects: function(layer){
    var self = this;
    var results = this.findObjectsInLayer(this.map, layer);
    for(var i = 0; i < results.length; i++){
      self.spawnFromObject(results[i]);
    }
  },
  //Codigo inspirado por este tutorial:
  // https://gamedevacademy.org/html5-phaser-tutorial-top-down-games-with-tiled/
  //find objects in a Tiled layer that containt a property called "type" equal to a certain value
  findObjectsInLayer: function(map, layer) {
     var result = [];

    map.objects[layer].forEach(function(element){
         //Phaser uses top left, Tiled bottom left so we have to adjust
         //also keep in mind that the cup images are a bit smaller than the tile which is 16x16
         //so they might not be placed in the exact position as in Tiled
         element.y -= map.tileHeight;
         result.push(element);
     });
     return result;
   },


 //create a sprite from an object
 spawnFromObject: function(element/*, group*/) {
     if(element.type === 'enemy'){
       var enemy = new characters.Serpiente(element.x*3, element.y*3, this); // Snake Spawn on tile's x,y
       this.objectArray.push(enemy);
       this.enemies.add(enemy);
   }
   else if(element.type === 'King'){
     this._player = new characters.King(element.x*3, element.y*3, this);
   }
   else if(element.type === 'Golem'){
    this._boss = new characters.Golem(element.x*3, element.y*3, this);
     this.objectArray.push(this._boss);
     this.enemies.add(this._boss);
   }
    else if(element.type === 'endlevel'){
      this.endlevel = this.game.add.sprite(element.x*3, element.y*3,'stairs');
      this.endlevel.scale.setTo(3,3);
      this.game.physics.arcade.enable(this.endlevel);
      this.endlevel.body.allowGravity = false;
      this.endlevel.body.immovable = true;

    }
},
checkColisions: function(){
  this.collisionWithTilemap = this.game.physics.arcade.collide(this._player, this.ground);
  this.collisionDeath = this.game.physics.arcade.collide(this._player, this.death);
  this.collisionWithFloor = this.game.physics.arcade.collide(this.enemies, this.ground);
  this.collisionWithEnnemies = this.game.physics.arcade.collide(this._player, this.enemies);
  this.levelComplete = this.game.physics.arcade.collide(this._player, this.endlevel);
  this.bossCollider = this.game.physics.arcade.collide(this._boss, this.ground);
  this.bossPlayerColl = this.game.physics.arcade.collide(this._boss, this._player);

},
  //IS called one per frame.
    update: function () {
      if(!this.levelComplete && !this.gameOver){
      this.checkColisions();
      this.objectArray.forEach(function(elem){
        if(elem!== null)elem.update();
      });
      this._player.update();
      if(this.pauseButton.isDown){
        this.game.paused = true;
        this.pauseMenu();
      }

     this.pauseButton.onDown.add(this.unpause, this);
      this.input.onDown.add(this.unpause, this);
    }
    else {
      if(this.gameOver){
        this.lostSound.play(false);
        this.closeLevel();
        this.game.state.start('gameOver');
      }
      else
      {
        this.closeLevel();
        this.game.overallScore+= this.sceneScore;
        this.game.state.start('levelSucceed');
      }
    }


  },
  hud: function(){
    this.hudScore.text = 'Score: '+this.sceneScore;
  },
  closeLevel: function(){
    this.destroy();
  },
  unpause:function(event){
  if (this.game.paused) {
      if (this.b_menu.getBounds().contains(event.x, event.y)){
             this.closeLevel();
             this.game.state.start('menu');
             this.game.paused = false;
           }
    else {
      this.game.paused = false;
    }
    this.salir();
 }
},

salir:function(){
  this.b_menu.destroy();
  this.b_continue.destroy();
  this.pausetext.destroy();
  this.music.resume();

},
pauseMenu:function(){
  this.music.pause();
  this.b_menu= this.addMenuOption("Menu",function () {
    this.salir();
    this.destroy();
    this.game.state.start('menu');}
    ,0);
    this.b_menu.font = 'Astloch';
  this.b_continue = this.addMenuOption("Continue",function () {
    this.salir();
    this.game.paused = false;}
    ,1);
  this.b_continue.font = 'Astloch';
  this.pausetext = this.game.add.text(this.game.camera.x+400,this.game.camera.y+ 175, 'Press P or click anywhere to continue', { font: '50px Astloch',fontVariant :'Bold', fill: '#000',boundsAlignH: "center", boundsAlignV: "middle"  });

  this.pausetext.anchor.setTo(0.5,0.5);
    },

  render:function(){
    this.hud();
  },
    configure: function(){
      this.levelComplete = false;

        this.game.world.setBounds(0, 0, 2400, 500);
        this.game.physics.arcade.gravity.y = 2000;
        this._player.body.gravity.x = 0;
        this._player.body.velocity.x = 0;
        this.game.camera.follow(this._player);
        this.ground.resizeWorld();
    },

    objectDestroy: function (character){
      var found = false;
      var i = 0;
      while(!found){
        if (this.objectArray[i].name === character.name && this.objectArray[i].x === character.x && this.objectArray[i].y === character.y)found = true;
        else i++;
      }
      character.destroy();
      if (character.name != this._player.name)this.objectArray.splice(i,1);
    },


    destroy: function(){
      this.music.destroy();
      this.playerDeath.destroy();
      this.objectArray.forEach(function(elem){
      elem.destroy();});
      this.map.destroy();
      this._player.destroy();

      console.log("Game assets deleted!");
  },
  addMenuOption: function(text, callback,n) {
    var optionStyle = { font: '30pt Astloch',fontVariant:'Bold', fill: 'white', align: 'left', stroke: 'rgba(0,0,0,0)', srokeThickness: 4};
    var button =  this.game.add.button(this.game.camera.x+400, (n * 80)+this.game.camera.y+ 250, 'button', callback, this, 2, 1, 0);
    var txt = this.game.add.text(0,0, text, optionStyle);
    txt.anchor.set(0.5);
    button.anchor.set(0.5);
    button.addChild(txt);
    txt.stroke = "rgba(0,0,0,0";
    txt.strokeThickness = 4;
    var onOver = function (target) {
      target.fill = "#FEFFD5";
      target.stroke = "rgba(200,200,200,0.5)";
      txt.useHandCursor = true;
    };
    var onOut = function (target) {
      target.fill = "black";
      target.stroke = "rgba(0,0,0,0)";
      txt.useHandCursor = false;
      };
      txt.useHandCursor = true;
      txt.inputEnabled = true;
      txt.events.onInputUp.add(callback, this);
      txt.events.onInputOver.add(onOver, this);
      txt.events.onInputOut.add(onOut, this);
    return button;
    }

};



module.exports = PlayScene;

},{"./Characters.js":1,"./MapCreator":2}]},{},[6]);
