var Engine = (function(global) {
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        lastTime,
        animate = true,
        game = new Game();


    initializeGame(game);
    
    canvas.width = 505;
    canvas.height = 606;
    doc.getElementById('game-area').appendChild(canvas);

    function main() {
        var now = Date.now(),
            dt = (now - lastTime) / 1000.0;

        update(dt);
        render();

        lastTime = now;

        if (animate) {
            win.requestAnimationFrame(main);
        }
    };

    function init() {

        restart();
        lastTime = Date.now();
        main();
    }

    function update(dt) {
        updateEntities(dt);
        checkCollisions();
    }

    function updateEntities(dt) {
        game.enemies.forEach(function (enemy) {
            enemy.update(dt);
        });

        game.player.update();
    }

    function render() {
        if (game.characterSelector.hasFocus) {
            renderCharacterSelector();
        } else {
            renderGame();
        }
    }

    function renderGame() {
        var Images = { };

        Images[Block.Water] = 'images/water-block.png';
        Images[Block.Stone] = 'images/stone-block.png';
        Images[Block.Grass] = 'images/grass-block.png';

        Images[Item.BlueGem] = 'images/gem-blue.png';
        Images[Item.GreenGem] = 'images/gem-green.png';
        Images[Item.OrangeGem] = 'images/gem-orange.png';
        Images[Item.Heart] = 'images/heart.png';
        Images[Item.Key] = 'images/key.png';
        Images[Item.Star] = 'images/star.png';
        Images[Item.Rock] = 'images/rock.png';

        for (var row = 0; row < game.board.height; ++row) {
            for (var col = 0; col < game.board.width; ++col) {
                var block = game.board.getBlock(row, col);
                var item = game.board.getItem(row, col);

                if (row === 0) { // Clear the top row of the board to remove any previous frame's remaining pixel.
                    ctx.clearRect(col * 101, row * 83, 101, 171);
                }

                ctx.drawImage(Resources.get(Images[block]), col * 101, row * 83);

                if (item != Item.None) {
                    ctx.drawImage(Resources.get(Images[item]), col * 101, row * 83);
                }
            }
        }

        renderEntities();
    }

    function renderEntities() {
        game.enemies.forEach(function (enemy) {
            enemy.render();
        });

        game.player.render();
    }

    function renderCharacterSelector() {
        $('#hub').css('visibility', 'hidden');
        $('#char-selector-header').css('display', 'block');

        var selectorImage = 'images/selector.png';

        var characters = game.characterSelector.characters;

        canvas.width = characters.length * 101;
        canvas.height = 171;

        for (var i = 0; i < characters.length; ++i) {
            var r = Resources.get(characters[i].sprite);
            ctx.drawImage(Resources.get(characters[i].sprite), i * 101, 0);
        }

        ctx.drawImage(Resources.get(selectorImage), game.characterSelector.position * 101, 0);
    }

    function checkCollisions() {
        if (game.wasPlayerHit() || game.isPlayerDrowning()) {
            game.reset();
        }
    }

    function restart() {
        game.restart();
    }

    // Initialize the game and setup
    // callbacks to call when important actions
    // happens in the game (mainly clearing, updating the canvas
    // and updating the screen with useful informations).
    function initializeGame(game) {
        initializeCharacterSelector(game);

        game.onLifeLost(function (lives) {
            $('.lives').text(lives);
        });

        game.onLifeGained(function (lives) { 
            $('.lives').text(lives); 
        });

        game.onLevelCleared(function (nextLevel) { 
            clearCanvas();

            $('.level').text(nextLevel + 1); 
        });

        game.onGameOver(function (game) {
            animate = false;

            $('#game-area').css('display', 'none');
            $('#game-over').css('display', 'block');

            $('#restart').click(function () {
                animate = true;

                init();

                $('#game-over').css('display', 'none');
                $('#game-area').css('display', 'block');
            });
        });

        game.onGameRestart(function (game) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            game.characterSelector.hasFocus = true;
        });

        game.onGameCompleted(function (game) {
            animate = false;

            $('#game-area').css('display', 'none');
            $('#congratulations').css('display', 'block');

            $('#play').click(function () {
                animate = true;

                init();

                $('#congratulations').css('display', 'none');
                $('#game-area').css('display', 'block');
            })
        });

        game.onGamePaused(function (game) {
            animate = false;
        });

        game.onGameResumed(function (game) {
            animate = true;
            
            lastTime = Date.now();
            main();
        });
    }

    function initializeCharacterSelector(game) {
        var characters = [
            {name: 'boy', sprite: 'images/char-boy.png'},
            {name: 'cat-girl', sprite: 'images/char-cat-girl.png'},
            {name: 'horn-girl', sprite: 'images/char-horn-girl.png'},
            {name: 'pink-girl', sprite: 'images/char-pink-girl.png'},
            {name: 'princess-girl', sprite: 'images/char-princess-girl.png'}
        ];

        game.characterSelector.characters = characters;

        game.characterSelector.onCharacterSelected(function (character) {
            clearCanvas();

            game.player.sprite = character.sprite;

            $('#char-selector-header').css('display', 'none');
            $('#hub').css('visibility', 'visible');

            game.characterSelector.hasFocus = false;
        });
    }

    function clearCanvas() {
        canvas.width = game.board.width * 101;
        canvas.height = game.board.height * 101 + 101;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    Resources.load([
        'images/stone-block.png',
        'images/water-block.png',
        'images/grass-block.png',
        'images/enemy-bug.png',
        'images/char-boy.png',
        'images/gem-orange.png',
        'images/gem-blue.png',
        'images/gem-green.png',
        'images/heart.png',
        'images/star.png',
        'images/key.png',
        'images/rock.png',
        'images/char-boy.png',
        'images/char-boy-star.png',
        'images/char-cat-girl.png',
        'images/char-cat-girl-star.png',
        'images/char-horn-girl.png',
        'images/char-horn-girl-star.png',
        'images/char-pink-girl.png',
        'images/char-pink-girl-star.png',
        'images/char-princess-girl.png',
        'images/char-princess-girl-star.png',
        'images/selector.png'
    ]);

    Resources.onReady(init);

    global.ctx = ctx;
})(this);
