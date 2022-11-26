 
// Main class that controls everything

class Cell {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}

class Enemy {
    constructor(x, y, shift, id, game) {
        this.pos = new Vec2(x, y)
        this.shift = shift
        this.cell = 0
        this.speed = 3
        this.hp = 10
        this.update_target(game)
        this.id = id
    }

    update_target(game) {
        let cell_x = game.path[this.cell].x * game.cell_size
        let cell_y = game.path[this.cell].y * game.cell_size
        this.target = new Vec2(cell_x * this.shift + (cell_x + game.cell_size) * (1 - this.shift),
                              (cell_y + game.cell_size) * this.shift + cell_x * (1 - this.shift))
        console.log(this.target)
    }
    
    tick(game) {
        if (dist(this.pos, this.target) < this.speed) {
            if (this.cell == game.path.size - 1) {
                game.enemy_passed()
                return
            } else {
                this.cell++;
                this.update_target(game);
            }
        }

        let dir = minus(this.target, this.pos).norm()
        this.pos = plus(this.pos, mult(dir, this.speed))
    }

    dealDamage() {
        this.hp -= 1;
    }
}

class Game {
    constructor() {
        this.timer = 0;
        this.score = 0;

        this.animations = [];

        this.grid = [];
        this.grid_size = new Vec2(10, 10);
        this.cell_size = 50;

        this.enemy_id = 0;

        this.enemies = {}
        this.hp = 10

        for (let y = 0; y < this.grid_size.y; ++y) {
            this.grid.push([])
            for (let x = 0; x < this.grid_size.x; ++x) {
                this.grid[y].push(new Cell(x, y, 0))
            }
        }

        this.path = [
            new Vec2(0, 0),
            new Vec2(0, 1),
            new Vec2(1, 1),
            new Vec2(1, 2),
            new Vec2(1, 3),
            new Vec2(1, 4),
            new Vec2(1, 5),
            new Vec2(1, 6),
            new Vec2(2, 6),
            new Vec2(3, 6),
            new Vec2(3, 6),
            new Vec2(3, 5),
            new Vec2(3, 4),
            new Vec2(3, 3),
            new Vec2(3, 2),
            new Vec2(4, 2),
            new Vec2(5, 2),
            new Vec2(6, 2),
            new Vec2(7, 2),
            new Vec2(8, 2),
            new Vec2(8, 3),
            new Vec2(8, 4),
            new Vec2(8, 5),
            new Vec2(7, 5),
            new Vec2(6, 5),
            new Vec2(5, 5),
            new Vec2(5, 6),
            new Vec2(5, 7),
            new Vec2(5, 8),
            new Vec2(6, 8),
            new Vec2(7, 8),
            new Vec2(7, 9),
            new Vec2(8, 9),
            new Vec2(9, 9),
        ];

        for (let i = 0; i < this.path.length; ++i) {
            this.grid[this.path[i].y][this.path[i].x].type = 1;
        }

        for (let i = 0; i < 1; ++i) {
            this.create_enemy(0, 0)
        }
    }

    create_enemy(x, y) {
        let id = "enemy" + String(this.enemy_id++);
        this.enemies[id] = new Enemy(x, y, random_float(0, 1), id, this);
        let e = document.createElement('div');
        e.id = id;
        e.style.position = "absolute"
        e.style.height = "10px";
        e.style.width = "10px";
        e.style.backgroundColor = "black";
        document.getElementById('towers').appendChild(e);
    }

    kill_enemy(id) {
        let e = document.getElementById(id);
        e.parentNode.removeChild(e);
        delete this.enemies[id]
    }
    
    increase_score(delta) {
        this.score += delta;
        document.getElementById('score').innerHTML = "Score: " + this.score;
    }

    intesected(coords1, coords2, rad1, rad2) {
        return dist(coords1, coords2) < rad1 + rad2;
    }

    step() {
        this.timer++;
        var inputs = document.getElementsByTagName('input');
        var sliders = [];

        for(var i = 0; i < inputs.length; i++) {
            if(inputs[i].type.toLowerCase() == 'range') {
                sliders.push(inputs[i]);
            }
        }

        for (var i = 0; i < sliders.length; i++) {
            var rect = sliders[i].getBoundingClientRect();
            var coords = plus(new Vec2(rect.x, rect.y), 
                new Vec2(rect.width * sliders[i].value / sliders[i].max, rect.height / 2));

            var size = rect.height;

            for (let [id, enemy] of Object.entries(this.enemies)) {
                if (intersected(coord, enemy.pos, size, enemy.size)) {
                    enemy.dealDamage();
                }
            }
        }

        for (let [id, enemy] of Object.entries(this.enemies)) {
            enemy.tick(this)
            let e = document.getElementById(id);
            e.style.left = String(enemy.pos.x) + "px";
            e.style.top = String(enemy.pos.y) + "px";
        }
    }

    enemy_passed(id) {
        this.kill_enemy(id)
        this.hp -= 1
    }
}