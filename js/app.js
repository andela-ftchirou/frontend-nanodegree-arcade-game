// Game.
// The main class.
// Handles all the logic of the game (rules, levels, player, enemies, ...)
var Game = function () {
    this.level = -1;
    this.player = new Player(this, 0, 0);
    this.enemies = [];
    this.maxLives = 3;
    this.lives = this.maxLives;
    this.board = null;
    this.characterSelector = new CharacterSelector();
    this.characterSelector.hasFocus = true;
    this.paused = false;

    this.initializeLevels();

    this.initializePlayer();    

    this.initializeEnemies();

    this.initializeGameCallbacks();

    this.levelUp();

    var that = this;
    document.addEventListener('keyup', function (e) {
        var allowedKeys = {
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            72: 'help',
            13: 'enter',
            80: 'pause',
            81: 'quit'
        };

        if (that.characterSelector.hasFocus) {
            that.characterSelector.handleInput(allowedKeys[e.keyCode]);
        } else {
            that.player.handleInput(allowedKeys[e.keyCode]);
        }
    });
};

Game.prototype.levelUp = function () {
    this.level++;

    if (this.level === this.levels.length) {
        this.gameCompletedCallback(this);

        return;
    }

    if (this.level < this.levels.length) {
        // For each level cleared, improve the chances of the enemies
        // to run faster.
        this.minEnemySpeed += 1;
        this.maxEnemySpeed += 1;

        this.board = null;
        this.board = new Board(this.levels[this.level]);

        this.lives = this.maxLives;
        this.lifeGainedCallback(this.lives);

        this.spawnPlayer();

        this.enemies = [];
        this.numEnemies = this.board.roads.length;
        for (var i = 0; i < this.numEnemies; ++i) {
            var enemy = new Enemy(this, -1, this.board.roads[i]);
            enemy.speed = this.randomInt(this.minEnemySpeed, this.maxEnemySpeed);

            this.enemies.push(enemy);
        }

        this.levelClearedCallback(this.level);
    }
};

Game.prototype.wasPlayerHit = function () {
    if (this.player.indestructible) {
        return false;
    }

    for (var i = 0; i < this.numEnemies; ++i) {
        var enemy = this.enemies[i];

        if (this.closeEnough(this.player.x, enemy.x) && this.player.y === enemy.y) {
            return true;
        }
    }

    return false;
};

Game.prototype.isPlayerDrowning = function () {
    return !this.player.indestructible && this.board.getBlock(this.player.y, this.player.x) === Block.Water;
};

Game.prototype.pause = function () {
    if (!this.paused) {
        this.paused = true;
        this.gamePausedCallback(this);
    }
};

Game.prototype.resume = function () {
    if (this.paused) {
        this.paused = false;
        this.gameResumedCallback(this);
    }
};

// Decrement the number of remaining lives and 
// restart the game at the same level.
Game.prototype.reset = function () {
    this.lives--;

    if (this.lives < 0) {
        this.gameOverCallback(this);
    } else {
        this.lifeLostCallback(this.lives);
        this.board.resetItems();
        this.spawnPlayer();
    }
};

// Completely restart the game at the first level.
Game.prototype.restart = function () {
    this.level = -1;
    this.minEnemySpeed = 1;
    this.maxEnemySpeed = 5;
    this.gameRestartCallback(this);
    this.levelUp();
};

// Put a player on the board.
// The player is spawned at the last row of the board and
// at a randomely chose column.
Game.prototype.spawnPlayer = function () {
    this.player.x = this.randomInt(0, this.board.width - 1);
    this.player.y = this.board.height - 1;
};

// Move the player at the bottom-left of the board and
// put a randomely chose item on the board.
Game.prototype.helpPlayer = function () {
    if (this.lives >= 1) {
        this.player.x = 0;
        this.player.y = this.board.height - 1;

        var items = [Item.Heart, Item.Star, Item.Key, Item.Rock, Item.BlueGem, Item.GreenGem];
        var item = items[this.randomInt(0, items.length - 1)];

        // Put the item in the first free cell of the last row of the board.
        var row = this.board.height - 1;
        for (var col = this.board.width - 1; col > 0; --col) {
            if (this.board.getItem(row, col) === Item.None) {
                this.board.setItem(row, col, item);
                this.lives--;
                this.lifeLostCallback(this.lives);

                break;
            }
        }
    }
};

// The levels of the game are contained in this.levels, an array of string.
// The format of a level is pretty simple:
//                           cols:rows:roads:blocks:items
// where
//   cols   = an integer, the number of columns of the board.
//   rows   = an integer, the number of rows of the board.
//   roads  = a list of comma-separated integers, each integer is a 0-based row index on which enemies should be spawned.
//   blocks = a string of length cols x rows of characters G (for grass), W (for water) and S (for stone), the map of the board.
//   items  = a string of length cols x rows of characters n (for none), r (for rock), b (for blue gem), g (for green gem), ...
//            the map of the initial items to be placed on the board. If initially, there are no items
//            on the board, this part can be omitted.
Game.prototype.initializeLevels = function () {
    this.levels = [
        '5:3:1:GGGGGSSSSSGGGGG:nnnnnnnnnnnnnnn',
        '5:5:2,3:GGGGGWSWSWSSSSSSSSSSGGGGG:nnnnnnnnnnnnnnnngnnnnnnnn',
        '6:6:1,4:GGGGGGSSSSSSWWWWWWWWWWWWSSSSSSGGGGGG:nnnnnnnnnnnnnnnnnnnnnnnnnnnnrnnnnnnn',
        '5:6:2,3,4:GGGGGWWSWWSSSSSSSSSSSSSSSGGGGG:nnnnnnnnnnnnnnnnbnnnnnnnnnnnnn',
        '5:6:1,3,4:GGGGGSSSSSSSWSSSSSSSSSSSSGGGGG:nnnnnnnnnnngnbnnnnnnnnnnnnnnnn',
        '7:7:1,2,3,5:GGGGGGGSSSSSSSSSSSSSSSSSSSSSWWWSWWWSSSSSSSGGGGGGG:nnnnnnnnnnnnnnnnnnnnnnnnnnnnsnnnnnnnnrnnnnnnnnnnn',
        '5:5:1,3:GGGGGSSSSSSWSWSSSSSSGGGGG:nnnnnnnnnnnnnnnnnnnnnnnnn',
        '6:7:1,5:GGGGGGSSSSSSWSWSWSSWSWSWWSWSWSSSSSSSGGGGGG:nnnnnnnnnnnnnnnnnnnnnnnnnrnnnnnnnnnnnnnnnn',
        '5:5:1,2,3:WGWGWSSSSSSSSSSSSSSSGGGGG:nnnnnnnnnnnnnnnnnnnnnnnnn',
        '8:7:1,3,5:GGWWWWGGSSSSSSSSWWSSWWSSSSSSSSSSSSWWSSWWSSSSSSSSGGGGGGGG:nnnnnnnnnnnnnnnnnnnnnnngnnnnsnnnbnnnnnnnnnnnnnnnnnnnnnnn'
    ];
};

// Initialize the player. Mainly, defines what happens to
// the game when the player gains a specific item.
Game.prototype.initializePlayer = function () {
    this.player.onGain(Item.Heart, function (game) {
        game.lives++;
        game.lifeGainedCallback(game.lives);
    });

    this.player.onGain(Item.Star, function (game) {
        if (game.player.indestructible) {
            return;
        }
        
        game.player.indestructible = true;

        var sprite = game.player.sprite;

        // Let the player look different now that he is indestructible.
        // This suppose that for a sprite name 'player.png', there is an
        // associated sprite name 'player-star.png'.
        game.player.sprite = sprite.substring(0, sprite.length - 4) + '-star.png';

        // The player will return to normal (sadly) after 1 second.
        setTimeout(function () {
            game.player.indestructible = false;
            game.player.sprite = sprite;
        }, 1000);
    });

    this.player.onGain(Item.Key, function (game) {
        game.levelUp();
    });

    // All the water blocks on the board are turned into stone blocks
    // when the player gains a 'rock' item.
    this.player.onGain(Item.Rock, function (game) {
        var pos = []; // To keep track of the positions of the water blocks.
        var level = game.level;

        for (var row = 0; row < game.board.height; ++row) {
            for (var col = 0; col < game.board.width; ++col) {
                var block = game.board.getBlock(row, col);

                if (block === Block.Water) {
                    pos.push({row: row, col: col});
                    game.board.setBlock(row, col, Block.Stone);
                }
            }
        }

        setTimeout(function () {
            if (level === game.level) { // No need to undo the effects of this item if the player has already cleared the level.
                for (var i = 0; i < pos.length; ++i) {
                    game.board.setBlock(pos[i].row, pos[i].col, Block.Water);
                }
            }
        }, 1000);
    });

    // Each enemy speed will be divided by 3 if the
    // player gains a blue gem ...
    this.player.onGain(Item.BlueGem, function (game) {
        for (var i = 0; i < game.enemies.length; ++i) {
            game.enemies[i].speed /= 3;
        }

        // ... for 1 second.
        setTimeout(function () {
            for (var i = 0; i < game.enemies.length; ++i) {
                game.enemies[i].speed *= 3;
            }
        }, 1000);
    });

    // The enemies will be freezed for 1 second if the
    // player is in possession of a green gem.
    this.player.onGain(Item.GreenGem, function (game) {
        var speeds = []; // To keep track of the enemies previous speed.
        var level = game.level;

        for (var i = 0; i < game.numEnemies; ++i) {
            speeds.push(game.enemies[i].speed);
            game.enemies[i].speed = 0;
        }

        setTimeout(function () {
            if (game.level === level) {
                for (var i = 0; i < game.enemies.length; ++i) {
                    game.enemies[i].speed = speeds[i];
                }
            }
        }, 1000);
    });

    this.player.onGain(Item.OrangeGem, function (game) {
        // Nothing for now.
    });
};

Game.prototype.initializeEnemies = function () {
    this.minEnemySpeed = 1;
    this.maxEnemySpeed = 4;
};

// The game exposes hooks to allow external
// entities (in particular the game engine) to do something 
// when important actions happens.
Game.prototype.initializeGameCallbacks = function () {
    this.lifeLostCallback = function (lives) { }; // The number of remaining lives is passed in parameter.
    this.lifeGainedCallback = function (lives) { }; // The number of remaining lives added to the number of gained lives is passed in parameter.
    this.levelClearedCallback = function (level) { }; // The new level (integer) is passed in parameter.
    this.gameOverCallback = function (game) { };
    this.gameRestartCallback = function (game) { };
    this.gameCompletedCallback = function (game) { };
    this.gamePausedCallback = function (game) { };
    this.gameResumedCallback = function (game) { };
};

Game.prototype.onLifeLost = function (callback) {
    this.lifeLostCallback = callback;
};

Game.prototype.onLifeGained = function (callback) {
    this.lifeGainedCallback = callback;
};

Game.prototype.onLevelCleared = function (callback) {
    this.levelClearedCallback = callback;
};

Game.prototype.onGameOver = function (callback) {
    this.gameOverCallback = callback;
};

Game.prototype.onGameRestart = function (callback) {
    this.gameRestartCallback = callback;
};

Game.prototype.onGameCompleted = function (callback) {
    this.gameCompletedCallback = callback;
};

Game.prototype.onGamePaused = function (callback) {
    this.gamePausedCallback = callback;
};

Game.prototype.onGameResumed = function (callback) {
    this.gameResumedCallback = callback;
};

// A level is cleared if the player reachs a grass block at the top row of the board.
Game.prototype.isLevelCleared = function () {
    return (this.player.y === 0) && (this.board.getBlock(this.player.y, this.player.x) === Block.Grass);
};

// Used to test if an enemy is sufficiently close
// to the player to hit him.
Game.prototype.closeEnough = function (a, b) {
    return Math.abs(a - b) < 0.1;
};

Game.prototype.randomInt = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};


// Block types which compose a board.
var Block = {
    Water: 'W',
    Grass: 'G',
    Stone: 'S'
};

// Items which can be available on the board.
var Item = {
    BlueGem: 'b',
    GreenGem: 'g',
    OrangeGem: 'o',
    Heart: 'h',
    Key: 'k',
    Rock: 'r',
    Star: 's',
    None: 'n'
};

// Board class represents the board on which the game is played.
// Its constructor takes in parameter a string formatted as:
//   cols:rows:roads:blocks:items (see comments at line 171)
// representing a level. The string is parsed
// and used to initialize the properties of the board:
//    width: the width of the board.
//    height: the height of the board.
//    roads: free roads on which the enemies can run.
//    blocks: the map or configuration of the board.
//    items: initial items present on the board.
var Board = function (level) {
    var data = level.split(':');

    this.width = parseInt(data[0]);
    this.height = parseInt(data[1]);
    this.roads = [];

    var roadsData = data[2].split(',');
    for (var i = 0; i < roadsData.length; ++i) {
        this.roads.push(parseInt(roadsData[i]));
    }

    this.blocks = data[3];

    if (data.length > 4) {
        this.items = data[4];
        this.initialItems = this.items;
    }
};

Board.prototype.getBlock = function (row, col) {
    return this.blocks.charAt(row * this.width + col);
};

Board.prototype.setBlock = function (row, col, newBlock) {
    var index = row * this.width + col;

    this.blocks = this.blocks.substring(0, index) + newBlock + this.blocks.substring(index + 1);
};

Board.prototype.getItem = function (row, col) {
    return this.items === undefined ? Item.None : this.items.charAt(row * this.width + col);
};

Board.prototype.setItem = function (row, col, newItem) {
    if (this.items === undefined) {
        this.items = '';
        for (var i = 0; i < this.blocks.length; ++i) {
            this.items += 'n';
        }
    }

    var index = row * this.width + col;

    this.items = this.items.substring(0, index) + newItem + this.items.substring(index + 1);
};

Board.prototype.removeItem = function (row, col) {
    this.setItem(row, col, Item.None);
};

Board.prototype.resetItems = function () {
    this.items = this.initialItems;
};

// Any character in the game. 
// It is positioned at col y and row x on the board.
var Character = function (game, x, y) {
    this.game = game;
    this.x = x;
    this.y = y;

    this.sprite = null;
};

Character.prototype.render = function () {
    ctx.drawImage(Resources.get(this.sprite), this.x * 101, this.y * 83 - 20); // -20 to "center" the character on a block.
};


// Enemy. Extends Character.
// An enemy has a speed at which he runs on the roads.
var Enemy = function(game, x, y, speed) {
    Character.call(this, game, x, y);

    this.sprite = 'images/enemy-bug.png';
    this.speed = speed;
}

Enemy.prototype = Object.create(Character.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.prototype.update = function (dt) {
    this.x += this.speed * dt; // this.x = this.x + ds where ds (distance travelled during dt) = speed * dt.

    if (this.x >= this.game.board.width) {
        // Spawn an enemy at the left, off the board to have the impression that
        // the roads are not limited by the dimensions of the board.
        this.x = -1;

        // Randomely choose a road on which spawn the enemy.
        this.y = this.game.board.roads[this.game.randomInt(0, this.game.board.roads.length - 1)];

        // Randomely choose a speed at which the enemy will run between enemies minimal and maximal speeds.
        this.speed = this.game.randomInt(this.game.minEnemySpeed, this.game.maxEnemySpeed);
    }
};


// Player class. Extends Character.
var Player = function (game, x, y) {
    Character.call(this, game, x, y);
    this.sprite = 'images/char-boy.png';

    // Hooks to define what happens when the player gains a specific item.
    this.gainCallbacks = { };

    this.indestructible = false;
};

Player.prototype = Object.create(Character.prototype);
Player.prototype.constructor = Player;

// At each frame, check if the player has cleared the level.
// If yes, go to next level.
Player.prototype.update = function () {
    if (this.game.isLevelCleared()) {
        this.game.levelUp();
    }
};

// Defines a callback function to be called when the
// player gains an item.
Player.prototype.onGain = function (item, callback) {
    this.gainCallbacks[item] = callback;
};

Player.prototype.handleInput = function (key) {
    switch (key) {
        case 'left':
            if (this.x > 0) {
                this.moveTo(this.x - 1, this.y);
            }
            break;
        case 'up':
            if (this.y > 0) {
                this.moveTo(this.x, this.y - 1);
            }
            break;
        case 'right':
            if (this.x < this.game.board.width - 1) {
                this.moveTo(this.x + 1, this.y);
            }
            break;
        case 'down':
            if (this.y < this.game.board.height - 1) {
                this.moveTo(this.x, this.y + 1);
            }
            break;
        case 'help':
            this.game.helpPlayer();
            break;
        case 'pause':
            if (!this.game.paused) {
                this.game.pause();
            } else {
                this.game.resume();
            }
            break;
        case 'quit':
            this.game.resume(); // Just in case the game was paused before quitting.
            this.game.characterSelector.hasFocus = true;
            this.game.restart();
        default:
            break;
    }

};

Player.prototype.moveTo = function (x, y) {
    if (this.game.paused) {
        return;
    }

    this.x = x;
    this.y = y;

    var item = this.game.board.getItem(this.y, this.x);
    if (item != Item.None) {
        if (this.gainCallbacks.hasOwnProperty(item)) {
            this.gainCallbacks[item](this.game);
        }

        this.game.board.removeItem(y, x);
    }
};


// CharacterSelector class.
// As its name implies, its purpose is to
// select a character in an array of characters.
// It is used to select a player at the beginning 
// of the game.
CharacterSelector = function () {
    this.characters = null; // The characters between which one should be selected.
    this.position = 0; // The current position of the selector.
    this.hasFocus = false;

    // A callback to call when a character has been selected.
    // It gets passed the selected character as parameter.
    this.characterSelectedCallback = function (character) { };
};

CharacterSelector.prototype.onCharacterSelected = function (callback) {
    this.characterSelectedCallback = callback;
};

CharacterSelector.prototype.handleInput = function (key) {
    switch (key) {
        case 'left':
            if (this.position > 0) {
                this.position--;
            }
            break;
        case 'right':
            if (this.position < this.characters.length - 1) {
                this.position++;
            }
            break;
        case 'enter':
            if (this.position >= 0 && this.position <= this.characters.length - 1) {
                this.characterSelectedCallback(this.characters[this.position]);
            }
            break;
        default:
            break;
    }
}
