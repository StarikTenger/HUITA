// Main class that controls everything

function damageAnimation(pos) {
    let image = document.createElement("img");
    image.src = "./explosion.png";
    image.style.opacity = 0;
    image.style.position = "absolute";
    image.style.z_index = -10;
    let size = 60;
    image.style.width = image.style.height = size;
    image.style.left = pos.x - size/2;
    image.style.top = pos.y - size/2;

    image.style["animation"] = "damage";
    image.style["animation-duration"] = "0.2s";
    
    document.getElementById("animations").append(image);
    
    setTimeout(function(){image.remove()}, 300);
}


function textAnimation(pos, text) {
    let image = document.createElement("b");
    image.style.opacity = 0;
    image.innerHTML = text;
    image.style.position = "absolute";
    image.style.z_index = -10;
    image.style["font-size"] = 50;
    let size = 60;
    image.style.width = image.style.height = size;
    image.style.left = pos.x - size/2;
    image.style.top = pos.y - size/2;

    image.style["animation"] = "damage";
    image.style["animation-duration"] = "1s";
    
    document.getElementById("animations").append(image);
    
    setTimeout(function(){image.remove()}, 300);
}

function moneyAnimation(pos, text) {
    let image = document.createElement("b");
    image.style.opacity = 0;
    image.innerHTML = "+" + Math.floor(text);
    image.style.position = "absolute";
    image.style.z_index = -10;
    image.style["font-size"] = 30;
    image.style["color"] = "yellow";
    let size = 10;
    image.style.width = image.style.height = size;
    image.style.left = pos.x - size/2;
    image.style.top = pos.y - size/2;

    image.style["animation"] = "money";
    image.style["animation-duration"] = "1s";
    
    document.getElementById("animations").append(image);

    setTimeout(function(){image.remove()}, 500);
}

function waveAnimation(text) {
    let image = document.createElement("b");
    image.innerHTML = "Wave " + text;
    image.style["z-index"] = 5;
    image.style.position = "absolute";
    image.style.z_index = -10;
    image.style["font-size"] = 60
    image.style["color"] = "red";
    let size = 600;
    image.style.width = image.style.height = 600;
    image.style.left = size/2 - 120;
    image.style.top = size/2 - 30;

    image.style["animation"] = "wave";
    image.style["animation-duration"] = "2s";

    document.getElementById("animations").append(image);

    setTimeout(function(){image.remove()}, 1900);
}

class Cell {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
    }
}

class Projectile {
    constructor(x, y, id, enemy_id) {
        this.pos = new Vec2(x, y)
        this.id = id;
        this.speed = 6;
        this.alive = true;
        this.enemy_id = enemy_id;
    }

    move_to_target(game) {
        if (document.getElementById(this.enemy_id) == null) {
            this.alive = false;
            return;
        }
        var enemy_pos = game.enemies[this.enemy_id].pos;
        this.pos = plus(this.pos, mult(minus(enemy_pos, this.pos).norm(), this.speed));
    }
}

class Enemy {
    constructor(x, y, shift, id, game) {
        this.pos = new Vec2(x, y)
        this.shift = shift
        this.cell = 0
        this.speed = random(7,13) / 10.;
        this.hp = random(1,5);
        this.maxHp = this.hp
        this.update_target(game)
        this.damage_cooldown = DAMAGE_MAX_COOLDOWN;
        this.id = id
        this.size = 6
    }

    update_target(game) {
        let t = plus(game.path[this.cell], new Vec2(0.5, 0.5))
        t = plus(t, mult(game.diags[this.cell], this.shift))
        t = mult(t, game.cell_size)
        this.target = t
    }
    
    tick(game) {
        if (dist(this.pos, this.target) < this.speed) {
            this.cell++;
            this.update_target(game);
        }

        for (let i = 0; i < 50; i++) {
            let dir = minus(this.target, this.pos).norm()
            this.pos = plus(this.pos, mult(dir, this.speed * DT))
        }
        this.damage_cooldown -= DT;
    }

    dealDamage() {
        if (this.damage_cooldown > 0) {
            return;
        }
        play_sound(damage_sound);
        damageAnimation(this.pos);
        this.hp -= 1;
        this.hp = Math.max(0, this.hp);
        this.damage_cooldown = DAMAGE_MAX_COOLDOWN;
    }
}

class Wave {
    constructor() {
        this.enemies = 0;
        this.enemies_limit = 5;
        this.density = 1;
        this.hp = 1;
        this.number = 1;
        this.money = 1;
        document.getElementById("wave").innerHTML = "Wave: " + this.number;
        waveAnimation(this.number);
    }

    next() {
        DT = BASIC_DT;
        
        this.enemies = 0;
        let modifier = 1.2;
        this.enemies_limit *= modifier;
        this.density *= modifier;
        this.hp *= modifier;
        this.money *= Math.pow(modifier, 1.);
        this.number++;
        console.log("next wave");
        waveAnimation(this.number);
        document.getElementById("wave").innerHTML = "Wave: " + this.number;
    }
}

class Game {
    constructor(ctx) {
        this.timer = 0;
        this.score = 0;

        this.animations = [];

        this.grid = [];
        this.grid_size = new Vec2(10, 10);
        this.cell_size = 60;

        this.enemy_id = 0;
        this.projectile_id = 0;
        this.next_enemy_time = 0;

        this.enemies = {}
        this.projectiles = {}
        this.hp = 10
        this.grave_yard = []

        this.money = 100;

        this.wave = new Wave();

        for (let y = 0; y < this.grid_size.y; ++y) {
            this.grid.push([])
            for (let x = 0; x < this.grid_size.x; ++x) {
                this.grid[y].push(new Cell(x, y, 0))
            }
        }

        this.deltas = [ new Vec2(1, 0) ];
        this.diags = [ new Vec2(0.5, 0.5) ];

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
            new Vec2(9, 9),
        ];

        for (let i = 0; i < this.path.length; ++i) {
            this.grid[this.path[i].y][this.path[i].x].type = 1;
        }

        for (let i = 1; i < this.path.length; ++i) {
            this.deltas.push(minus(this.path[i], this.path[i - 1]))
        }

        for (let i = 1; i < this.path.length; ++i) {
            if (eq(this.deltas[i], this.deltas[i - 1])) {
                this.diags.push(this.diags[i - 1])
            } else {
                this.diags.push(div(plus(this.deltas[i], this.deltas[i - 1]), 2))
            }
        }

        console.log(this.deltas)
        console.log(this.diags)
    }

    create_enemy(x, y, hp) {
        let id = "enemy" + String(this.enemy_id++);
        this.enemies[id] = new Enemy(x, y, random_float(-0.95, 0.95), id, this);
        let enemy = this.enemies[id]
        enemy.hp *= hp;
        let e = document.createElement('div');
        e.id = id;
        e.style.position = "absolute";
        e.style.width = String(enemy.size) + "px";
        e.style.height = String(enemy.size) + "px";
        e.style.border = "2px solid black";
        e.style.margin = "0px";
        e.style.padding = "0px";
        e.style.width = String(enemy.size) + "px";
        e.style.backgroundColor = "hsl(" + enemy.hp * 100/enemy.maxHp + ", 100%, 50%)";
        document.getElementById('towers').appendChild(e);

        this.next_enemy_time = 0
    }

    create_projectile(x, y, enemy_id) {
        let id = "projectile" + String(this.projectile_id++);
        this.projectiles[id] = new Projectile(x, y, id, enemy_id)
        let projectile = this.projectiles[id];
        let e = document.createElement('div');
        e.id = id;
        e.style.position = "absolute"
        e.style.height = "5px";
        e.style.width = "5px";
        e.style.backgroundColor = "hsl(0, 0%, 50%)";
        e.style.borderRadius = "50%";
        document.getElementById('towers').appendChild(e);
      
    }

    kill_enemy(id, moneyMod) {
        let delta  = this.enemies[id].maxHp * MONSTER_COST_MODIFIER * moneyMod * this.wave.money;

        if (moneyMod) {
            moneyAnimation(this.enemies[id].pos, delta)
        }

        this.grave_yard.push(id)
        let e = document.getElementById(id);
        if (e != null) {
            e.parentNode.removeChild(e);
            this.money += delta;
        }
        
    }
    
    increase_score(delta) {
        this.score += delta;
        document.getElementById('score').innerHTML = "Score: " + this.score;
    }

    intersected(coords1, coords2, rad1, rad2) {
        return dist(coords1, coords2) < rad1 + rad2;
    }

    step() {
        if (Object.keys(this.enemies).length == 0 && this.wave.enemies >= Math.floor(this.wave.enemies_limit)) {
            this.wave.next();
        }

        TEXTBOX_COOLDOWN -= DT;
        // Money management
        document.getElementById("money").innerHTML = "Balance: " + Math.floor(this.money) + "$";
        if (game.money >= RANGE_COST) {
            document.getElementById("add_range").style.color = "green";
        } else {
            document.getElementById("add_range").style.color = "red";
        }
        if (game.money >= TEXT_COST) {
            document.getElementById("add_textfield").style.color = "green";
        } else {
            document.getElementById("add_textfield").style.color = "red";
        }
        if (game.money >= RADIO_COST) {
            document.getElementById("add_radiobuttons").style.color = "green";
        } else {
            document.getElementById("add_radiobuttons").style.color = "red";
        }

        // HP ыыыыыыы
        document.getElementById("hp").innerHTML = "HP: " + this.hp;
        

        this.timer++;
        var inputs = document.getElementsByTagName('input');
        var sliders = [];
        var radio = [];
        var texts = [];

        for(var i = 0; i < inputs.length; i++) {
            if(inputs[i].type.toLowerCase() == 'range') {
                sliders.push(inputs[i]);
            }
            if(inputs[i].type.toLowerCase() == 'radio') {
                radio.push(inputs[i]);
            }
            if(inputs[i].type.toLocaleLowerCase() == 'text') {
                texts.push(inputs[i]);
            }
        }

        for (var i = 0; i < sliders.length; i++) {
            var rect = sliders[i].getBoundingClientRect();
            var coords = plus(new Vec2(rect.x, rect.y), 
                new Vec2(rect.width * sliders[i].value / sliders[i].max, rect.height / 2));

            var size = rect.height;

            for (let [id, enemy] of Object.entries(this.enemies)) {
                if (this.intersected(coords, enemy.pos, size, enemy.size) && sliders[i].id != "preview") {
                    enemy.dealDamage();
                }
            }
        }

        for (var i = 0; i < radio.length; i++) {
            var rect = radio[i].getBoundingClientRect();
            var coords = plus(new Vec2(rect.x, rect.y), 
                new Vec2(rect.width / 2, rect.height / 2));
            var size = 100;

            if (radio[i].id != "preview") {
                
                radio[i].time_to_cooldown -= DT;
                radio[i].style.opacity = 1 - radio[i].time_to_cooldown / radio[i].cooldown;
                if (radio[i].time_to_cooldown > 0) {
                    continue;
                }
                if (radio[i].time_to_cooldown < -radio[i].cooldown*2) {
                    radio[i].checked = true;
                }

                if (radio[i].checked == true) {
                    for (let [id, enemy] of Object.entries(this.enemies)) {
                        if (this.intersected(coords, enemy.pos, size, enemy.size)) {
                            radio[i].time_to_cooldown = radio[i].cooldown;
                            console.log(radio[i].checked);
                            this.create_projectile(coords.x, coords.y, id);
                            radio[i].checked = false;
                            enemy.dealDamage();
                        }
                    }
                }
            }
        }

        for (let i = 0; i < texts.length; i++) {
            var rect = texts[i].getBoundingClientRect();
            var coords = plus(new Vec2(rect.x, rect.y), 
                new Vec2(rect.width, rect.height));

            if (texts[i].id != "preview") {
                if (TEXTBOX_COOLDOWN <= 0) {
                    texts[i].value = texts[i].value + LOREM[TEXTBOX_SYMBOL_ID];
                }
                if (texts[i].value.length > 0) {                  
                    for (let [id, enemy] of Object.entries(this.enemies)) {
                        if (rect.x < enemy.pos.x && rect.y < enemy.pos.y &&
                             coords.x > enemy.pos.x && coords.y > enemy.pos.y && enemy.damage_cooldown <= 0) {
                            textAnimation(enemy.pos, texts[i].value[0])
                            texts[i].value = texts[i].value.substring(1);
                            //console.log(rect.x, rect.y, enemy.pos.x, enemy.pos.y, coords.x, coords.y);                            
                            enemy.dealDamage();
                        }
                    }
                }
            }
        }
        if (TEXTBOX_COOLDOWN <= 0) {
            TEXTBOX_SYMBOL_ID = (TEXTBOX_SYMBOL_ID + 1) % LOREM.length;
            TEXTBOX_COOLDOWN =  TEXTBOX_MAX_COOLDOWN;

        }

        for (let [id, projectile] of Object.entries(this.projectiles)) {
            if (projectile.alive == false || this.enemies[projectile.enemy_id] == undefined) {
                let p = document.getElementById(id);
                p.parentNode.removeChild(p);
                delete this.projectiles[id];
            }
            projectile.move_to_target(this);
            var enemy_pos = this.enemies[projectile.enemy_id].pos;
            var p_pos = projectile.pos;
            if (minus(enemy_pos, p_pos).abs() < projectile.speed) {
                this.enemies[projectile.enemy_id].dealDamage();
                projectile.alive = false;
            } else {
                let e = document.getElementById(id);
                e.style.left = String(projectile.pos.x) + "px";
                e.style.top = String(projectile.pos.y) + "px";
            }
        }

        for (let [id, enemy] of Object.entries(this.enemies)) {
            enemy.tick(this)
            let e = document.getElementById(id);
            if (e != null) {
                var newColor = "hsl(" + enemy.hp * 100/enemy.maxHp + ", 100%, 50%)"
                e.style.backgroundColor = newColor;
                e.style.left = String(enemy.pos.x - enemy.size / 2) + "px";
                e.style.top = String(enemy.pos.y - enemy.size / 2) + "px";
                if (enemy.cell >= this.path.length - 1) {
                    this.enemy_passed(enemy.id);
                }
                if (enemy.hp == 0) {
                    this.kill_enemy(id, 1);
                }
            }
        }

        this.next_enemy_time -= DT;
        if (this.next_enemy_time <= 0 && this.wave.enemies < this.wave.enemies_limit) {
            this.create_enemy(0, 0, this.wave.hp)
            this.wave.enemies++;
            this.next_enemy_time = random_float(1., 2.0) / this.wave.density;
        }

        for (let id of this.grave_yard) {
            delete this.enemies[id];
        }
        this.grave_yard = []
    }

    enemy_passed(id) {
        this.hp -= 1;
        this.kill_enemy(id, 0);
        if (this.hp <= 0) {
            
        }
    }
}