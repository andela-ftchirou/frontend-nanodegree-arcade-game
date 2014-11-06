var Engine = (function(global) {
    var doc = global.document,
        win = global.window,
        canvas = doc.createElement('canvas'),
        ctx = canvas.getContext('2d'),
        patterns = {},
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

        reset();
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

    function checkCollisions() {
        if (game.wasPlayerHit() || game.isPlayerDrowning()) {
            game.reset();
        }
    }

    function reset() {
        game.restart();
    }

    function initializeGame(game) {
        game.onLifeLost(function (lives) { 
            $('.lives').text(lives); 
        });

        game.onLifeGained(function (lives) { 
            $('.lives').text(lives); 
        });

        game.onLevelCleared(function (nextLevel) { 
            canvas.width = game.board.width * 101;
            canvas.height = game.board.height * 101 + 101;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

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
        'images/rock.png'
    ]);
    Resources.onReady(init);

    global.ctx = ctx;
})(this);
