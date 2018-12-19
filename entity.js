
//#region Object Entity
Entity = function (param) {
    var self = {
        width: 16 * 2.2,
        height: 37 * 2.2,
        onGround: false,
        x: 2304,
        y: 250,
        x_old: 0,
        y_old: 0,
        spdX: 0,
        spdY: 0,
        id: "",
        map: 'forest'
    };
    if (param) {
        if (param.x)
            self.x = param.x;
        if (param.y)
            self.y = param.y;
        if (param.map)
            self.map = param.map;
        if (param.id)
            self.id = param.id;
    }

    self.update = function () {
        self.updatePosition();
        self.collision();

    };
    self.updatePosition = function () {
        self.x_old = self.x;
        self.y_old = self.y;
        self.x += self.spdX / refreshrate;
        self.y += self.spdY / refreshrate;
    };
    self.getDistance = function (pt) {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    };
    //#region Basic Functions
    self.getBottom = function () { return self.y + self.height; }
    self.getLeft = function () { return self.x; }
    self.getRight = function () { return self.x + self.width; }
    self.getTop = function () { return self.y }
    self.getOldBottom = function () { return self.y_old + self.height; }
    self.getOldLeft = function () { return self.x_old; }
    self.getOldRight = function () { return self.x_old + self.width; }
    self.getOldTop = function () { return self.y_old }
    self.setBottom = function (y) { self.y = y - self.height; }
    self.setLeft = function (x) { self.x = x; }
    self.setRight = function (x) { self.x = x - self.width; }
    self.setTop = function (y) { self.y = y; }
    //#endregion
    //#region Collision
    self.collision = function () {
        var bottom, left, right, top, value;
        //top left
        top = Math.floor(self.getTop() / tilesize);
        left = Math.floor(self.getLeft() / tilesize);
        value = map.layout[self.map][top * map.columns[self.map] + left];
        self.collisionRouter(value, left * tilesize, top * tilesize, tilesize);


        //top right
        top = Math.floor(self.getTop() / tilesize);
        right = Math.floor(self.getRight() / tilesize);
        value = map.layout[self.map][top * map.columns[self.map] + right];
        self.collisionRouter(value, right * tilesize, top * tilesize, tilesize);

        //bottom left
        bottom = Math.floor(self.getBottom() / tilesize);
        left = Math.floor(self.getLeft() / tilesize);
        value = map.layout[self.map][bottom * map.columns[self.map] + left];
        self.collisionRouter(value, left * tilesize, bottom * tilesize, tilesize);
        //bottom right
        bottom = Math.floor(self.getBottom() / tilesize);
        right = Math.floor(self.getRight() / tilesize);
        value = map.layout[self.map][bottom * map.columns[self.map] + right];
        self.collisionRouter(value, right * tilesize, bottom * tilesize, tilesize);


    }

    self.collisionRouter = function (value, tile_x, tile_y, tile_size) {
        switch (value) {
            case 0: break;
            case 1: self.collidePlatformTop(tile_y); break;
            case 2: self.collidePlatformLeft(tile_x); break;
            case 3: self.collidePlatformButtom(tile_y + tile_size); break;
            case 4: self.collidePlatformRight(tile_x + tile_size); break;
            case 5: if (self.collidePlatformTop(tile_y)) return;
                if (self.collidePlatformLeft(tile_x)) return;
                if (self.collidePlatformButtom(tile_y + tile_size)) return;
                else self.collidePlatformRight(tile_x + tile_size); break;
        }
    }

    self.collidePlatformButtom = function (tile_bottom) {

        if (self.getTop() < tile_bottom && self.getOldTop() >= tile_bottom) {
            self.setTop(tile_bottom);
            self.spdY = 0;
            return true;
        }
        else return false;
    }


    self.collidePlatformLeft = function (tile_left) {
        if (self.getRight() > tile_left && self.getOldRight() <= tile_left) {
            self.setRight(tile_left - 0.01);
            self.spdX = 0;
            return true;
        }
        else return false;
    }

    self.collidePlatformRight = function (tile_right) {
        if (self.getLeft() < tile_right && self.getOldLeft() >= tile_right) {
            self.setLeft(tile_right);
            self.spdX = 0;
            return true;
        }
        else return false;
    }

    self.collidePlatformTop = function (tile_top) {
        if (self.getBottom() > tile_top && self.getOldBottom() <= tile_top) {
            self.setBottom(tile_top - 1);
            self.spdY = 0;
            self.onGround = true;
            return true;
        }
        else return false;
    }

    return self;
    //#endregion
};
//#endregion



//#region Player:Entity
Player = function (param) {
    //#region Player:Initialization
    var self = Entity(param);
    self.username = param.username;
    self.number = "" + Math.floor(10 * Math.random());
    self.onGround = false;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.hpRegen = 2;
    self.mpRegen = 2;
    self.ad = 10;
    self.maxSpd = 300;
    self.jumpSpd = 1000;
    self.direction = 1;
    self.RegenCD = 0;
    self.animation = "";
    self.hp = 100;
    self.hpMax = 100;
    self.xp = 10;
    self.xpMax = 20;
    self.mp = 100;
    self.mpMax= 100;
    self.level = 1;
    self.score = 0;
    self.cooldown = 0;
    self.gravity = 2000;
    self.combo = 0;
    self.queueAttack = false;
    self.isWalking = false;
    self.isAttacking = false;
 //   self.inventory = new Inventory(param.socket);
    self.slam = false;
    self.stunDuration = 0;
    self.x = map.spawn_x[self.map];
    self.y = map.spawn_y[self.map];
    var super_update = self.update;
    //#endregion
    //#region Player:Attack
    self.basicattack = function () {
        if (self.cooldown === 0) {
            self.cooldown = 0.1 * refreshrate;
            self.combo = (self.combo + 1) % 12;
            self.animation = "attack";
            self.queueAttack = false;
            if (self.combo == 6 && self.onGround == false) {
                self.spdY = 1300;
                self.slam = true;
            }
            if (self.combo % 3 == 2)
                self.damage();
                self.mp--;
        }
        else
            self.queueAttack = true;

    }

    self.changeMap = function(mapid){
        var socket = SOCKET_LIST[self.id];
        for (var i in LocalPlayer[self.map]) {
            var socket2 = SOCKET_LIST[i];
            socket2.emit('removeone', self.id);
        }
        delete LocalPlayer[self.map][self.id];
        self.map = mapid;
        if (LocalPlayer[self.map] === undefined)
        {
        LocalPlayer[self.map] = [];
        }
        LocalPlayer[self.map][self.id] = self;
        socket.emit('changeMapSelf', {
            selfmap: mapid,
            player: Player.getAllInitPack(mapid),
        });
        for (var i in LocalPlayer[mapid]) {
            var socket2 = SOCKET_LIST[i];
            socket2.emit('changeMapOthers', {
                player: self
            });
        }
        
        
        
        self.x = map.spawn_x[mapid];
        self.y = map.spawn_y[mapid];

    }

    self.death = function () {
        self.hp = self.hpMax;
        self.x = map.spawn_x[self.map];
        self.y = map.spawn_y[self.map];
        self.spdX = 0;
        self.spdY = 0;
        self.onGround = false;
        if(self.map == "forest1")
        self.changeMap("forest2");
        else if(self.map == "forest2")
        self.changeMap("forest3");
        else if(self.map == "forest3")
        self.changeMap("forest1");
        
    }

    self.damage = function () {
        for (var i in Player.list) {
            var p = Player.list[i];
            if (self.map === p.map && self.getCollision(p) === true && self.id !== p.id) {
                p.hp -= self.ad;
                var temp = false;
                if (self.combo == 8 && self.slam == false)
                    temp = true
                if (self.slam == true || temp == true) {
                    p.onGround = false;
                    p.spdX = 500 * self.direction
                    p.spdY = -1200
                    p.stunDuration = 0.5 * refreshrate;
                    self.slam = false;
                }
                if (p.hp <= 0) {
                    p.death();
                }
            }
        }
    }


    self.getCollision = function (pt) {
        if ((pt.y + pt.height / 2) > self.y && (pt.y - pt.height) < self.y && (pt.x - self.x) * self.direction < 70 && (pt.x - self.x) * self.direction > -20)
            return true;
        else
            return false;
    }
    //#endregion
    //#region Player:Bullet
    self.shootBullet = function (angle) {
        if (self.cooldown === 0) {
            self.cooldown = 0.2 * refreshrate;
            Bullet({
                velocity: 1000,
                parent: self.id,
                angle: angle,
                x: self.x,
                y: self.y,
                map: self.map
            });
        }
    };
    //#endregion
    //#region Animation 

    self.updateAnim = function () {
        if (self.spdX > 0 && self.stunDuration == 0) {
            self.direction = 1;
        }
        else if (self.spdX < 0 && self.stunDuration == 0) {
            self.direction = -1;
        }
        if (self.isAttacking == false) {
            if (self.spdX > 0) {
                self.isWalking = true;
            }
            else if (self.spdX < 0) {
                self.isWalking = true;
            }
            else {
                self.isWalking = false;
                self.animation = "idle";
            }
            if (self.spdY < 0 && self.onGround == false) {
                self.animation = "jumping"
            }
            if (self.spdY > 0 && self.onGround == false) {
                self.animation = "falling"
            }
            if (self.isWalking == true && self.onGround == true) {
                self.animation = "walking";
            }
            if (self.stunDuration > 0) {
                self.animation = "idle";
            }
        }
    }
    //#endregion
    //#region Update
    self.update = function () {
        self.updateSpd();
        self.updateCd();
        self.updateAnim();
        self.updateRegen();
        super_update();

        if (self.pressingAttack || self.queueAttack) {
            self.basicattack();
            self.isAttacking = true;
        }
        else if (self.cooldown == 0) {
            self.combo = 0;
            self.isAttacking = false;
        }
    };

    self.updateCd = function () {
        if (self.cooldown > 0)
            self.cooldown--;
        if (self.stunDuration > 0)
            self.stunDuration--;
    };
    self.updateRegen = function() {
        if(self.RegenCD<=0)
        {
            self.RegenCD = refreshrate;
            self.hp += self.hpRegen;
            self.mp += self.mpRegen;
            if(self.hp>self.hpMax)
            self.hp=self.hpMax
            if(self.mp>self.mpMax)
            self.mp=self.mpMax
        }
        else
        self.RegenCD--;
    }

    self.updateSpd = function () {
        self.x_old = self.x;
        self.y_old = self.y;
        if (self.slam == true && self.onGround == true) {
            self.damage();
        }
        if (self.y > 2000) self.death();
        //gravity//
        self.spdY += self.gravity / refreshrate;
        if (self.pressingRight && self.stunDuration == 0)
            self.spdX = self.maxSpd;
        else if (self.pressingLeft && self.stunDuration == 0)
            self.spdX = -self.maxSpd;
        else if (self.stunDuration == 0 && self.onGround == true)
            self.spdX = 0;
        if (self.pressingUp && self.onGround && self.stunDuration == 0) {
            self.spdY = -self.jumpSpd;
            self.onGround = false;
        }
    };

    self.getInitPack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            number: self.number,
            hp: self.hp,
            hpMax: self.hpMax,
            mpMax: self.mpMax,
            xpMax: self.xpMax,
            score: self.score,
            animation: self.animation,
            direction: self.direction,
            map: self.map,
            username: self.username,
            combo: self.combo,
            xp:self.xp,
            mp:self.mp,
            level:self.level
        };
    };
    self.getUpdatePack = function () {
        return {
            id: self.id,
            animation: self.animation,
            direction: self.direction,
            x: self.x,
            y: self.y,
            hp: self.hp,
            score: self.score,
            combo: self.combo,
            xp:self.xp,
            mp:self.mp

        };

    };

    Player.list[self.id] = self;
    if (LocalPlayer[self.map] === undefined)
    {
    LocalPlayer[self.map] = [];
    }
    LocalPlayer[self.map][self.id] = self;
    initPack.player.push(self.getInitPack());
    return self;
    //#endregion
};
//#endregion


//#region Player Data Input
LocalPlayer = {};
Player.list = {};
Player.onConnect = function (socket, username) {
    var listCount = 0;
    for (var i in SOCKET_LIST)
        listCount++;
    console.log(listCount + " people currently in server");
    //checking
    var map = 'forest1';
    var player = Player({
        id: socket.id,
        map: map,
        username: username,
        socket:socket

    });
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left')
            player.pressingLeft = data.state;
        else if (data.inputId === 'right')
            player.pressingRight = data.state;
        else if (data.inputId === 'up')
            player.pressingUp = data.state;
        else if (data.inputId === 'down')
            player.pressingDown = data.state;
        else if (data.inputId === 'attack')
            player.pressingAttack = data.state;
        else if (data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });

    socket.on('sendMsgToServer', function (data) {
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addToChat', player.username + ': ' + data);
        }
    });

    socket.emit('init', {
        selfId: socket.id,
        player: Player.getAllInitPack('forest1'),
        bullet: Bullet.getAllInitPack()
    });
};
Player.getAllInitPack = function (maps) {
    var players = [];
    for (var i in LocalPlayer[maps])
        players.push(Player.list[i].getInitPack());
    return players;
};

Player.onDisconnect = function (socket) {
    try{
        var temp = Player.list[socket.id].map;
        delete LocalPlayer[temp][socket.id];
     }catch(e){
        console.log("YO",e)
     }
    
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
};
Player.update = function () {
    for (var i in Player.list) {
        var player = Player.list[i];
        player.update();
    }
};

Player.getPack = function(maps){
    var pack = [];
    for (var i in LocalPlayer[maps]) {
        var player = LocalPlayer[maps][i];
        pack.push(player.getUpdatePack());
    }
    return pack;
}
//#endregion


//#region Object Bullet
Bullet = function (param) {
    var self = Entity(param);
    self.id = Math.random();
    self.velocity = param.velocity;
    self.angle = param.angle;
    self.spdX = Math.cos(param.angle / 180 * Math.PI) * self.velocity;
    self.spdY = Math.sin(param.angle / 180 * Math.PI) * self.velocity;
    self.parent = param.parent;

    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function () {
        if (self.timer++ > 0.5 * refreshrate)
            self.toRemove = true;
        super_update();

        for (var i in Player.list) {
            var p = Player.list[i];
            if (self.map === p.map && self.getDistance(p) < 32 && self.parent !== p.id) {
                p.hp -= 1;

                if (p.hp <= 0) {
                    var shooter = Player.list[self.parent];
                    if (shooter)
                        shooter.score += 1;
                    p.hp = p.hpMax;
                    p.x = Math.random() * 500;
                    p.y = Math.random() * 500;
                }
                self.toRemove = true;
            }
        }
    };
    self.getInitPack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            map: self.map,
            username: self.username
        };
    };
    self.getUpdatePack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y
        };
    };

    Bullet.list[self.id] = self;
    initPack.bullet.push(self.getInitPack());
    return self;
};
//#endregion


//#region Bullet Packet
Bullet.list = {};

Bullet.update = function () {
    var pack = [];
    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.update();
        if (bullet.toRemove) {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        } else
            pack.push(bullet.getUpdatePack());
    }
    return pack;
};

Bullet.getAllInitPack = function () {
    var bullets = [];
    for (var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;
};
//#endregion
