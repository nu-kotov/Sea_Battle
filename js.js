let model = {

    player: 'player',
    boardSize: 10,
    numShips: 10,
    shipLengths: [1, 1, 1, 1, 2, 2, 2, 3, 3, 4],

    shots: [], // выстрелы
    ships: [], // координаты крайних точек кораблей
    damage: [], // попадания

    // смещения вверх, вниз и т.д.
    dx: [0, 0, 1, -1],
    dy: [1, -1, 0, 0],

    // смещения, + смещение по диагонали
    dxQ: [1, 1, 1, 0, -1, -1, -1, 0],
    dyQ: [1, 0, -1, -1, -1, 0, 1, 1],

    // создаём массив выстрелов игрока
    buildPlayerShots: function() {

        for (let i = 0; i < this.boardSize; i++) {
            this.shots[i] = [];
            this.damage[i] = [];
            for (let j = 0; j < this.boardSize; j++) {
                this.shots[i][j] = 0;
                this.damage[i][j] = 0;
            }
        }
    },

    // расставляем корабли
    generateShipLocations: function() {
        let locations;
        for (let i = 0; i < this.numShips; i++) {
            do {
                locations = this.generateShip(this.shipLengths[i]);
            } while (this.freeZones(locations));
            this.ships.push(locations);
        }
    },

    // проверка валидности координаты
    validPosition: function(x, y) {
        if (x < 0 || y < 0 || x >= this.boardSize || y >= this.boardSize) {
            return false;
        }
        return true;
    },

    // можем ли поставить на карту корабль с такой координатой
    freeZones: function(locations) {

        let startX = locations[0][0];
        let startY = locations[0][1];
        let endX = locations[1][0];
        let endY = locations[1][1];

        // выход за пределы поля
        if (!this.validPosition(endX, endY)) {
            return true;
        }

        // переберём все корабли и посмотрим нет ли пересечений
        for (let shp = 0; shp < this.ships.length; shp++) {

            // уже установленный корабль
            for (let shpX = this.ships[shp][0][0]; shpX <= this.ships[shp][1][0]; shpX++) {
                for (let shpY = this.ships[shp][0][1]; shpY <= this.ships[shp][1][1]; shpY++) {

                    // корабль, который хотим установить
                    for (let locX = startX; locX <= endX; locX++) {
                        for (let locY = startY; locY <= endY; locY++) {
                            if (Math.abs(locX - shpX) < 2 && Math.abs(locY - shpY) < 2)
                                return true;
                        }
                    }
                }
            }
        }

        return false;
    },

    // генерация позиции коробля по его длинне
    generateShip: function(shipLength) {

        let direction = Math.floor(Math.random() * 2);
        let row = Math.floor(Math.random() * this.boardSize);
        let col = Math.floor(Math.random() * this.boardSize);

        // для корабля храним самую левую и самую правую его позиции (или самую нижнюю и самую верхнюю)
        let newShipLocations = [];
        newShipLocations.push([row, col]);

        if (direction === 1) { // горизонтально
            newShipLocations.push([row + shipLength - 1, col]);
        } else { // вертикально
            newShipLocations.push([row, col + shipLength - 1]);
        }

        return newShipLocations;
    },

    // покраска расставленных кораблей
    paintingShips: function() {
        for (let i = 0; i < this.numShips; i++) {
            for (let x = this.ships[i][0][0]; x <= this.ships[i][1][0]; x++) {
                for (let y = this.ships[i][0][1]; y <= this.ships[i][1][1]; y++) {
                    view.displayShip(this.getCellElement(x, y));
                }
            }
        }
    },

    // принадлежит ли позиция кораблю
    isShip: function(xPos, yPos) {
        for (let i = 0; i < this.numShips; i++) {
            for (let x = this.ships[i][0][0]; x <= this.ships[i][1][0]; x++) {
                for (let y = this.ships[i][0][1]; y <= this.ships[i][1][1]; y++) {
                    if (xPos == x && yPos == y) {
                        return true;
                    }
                }
            }
        }

        return false;
    },

    // покрасим все убитые корабли в другой цвет и определим, не подбиты ли все
    paintingKillShips: function() {
        let sunkCounter = 0;

        for (let i = 0; i < this.numShips; i++) {

            let arrPoint = [];
            let totalPoint = 0;
            let dmgPoint = 0;

            for (let x = this.ships[i][0][0]; x <= this.ships[i][1][0]; x++) {
                for (let y = this.ships[i][0][1]; y <= this.ships[i][1][1]; y++) {
                    if (this.shots[x][y] == 1) {
                        dmgPoint++;
                    }
                    totalPoint++;
                    arrPoint.push([x, y]);
                }
            }

            if (totalPoint == dmgPoint) {
                for (let j = 0; j < arrPoint.length; j++) {
                    view.displaySunk(this.getCellElement(arrPoint[j][0], arrPoint[j][1]));
                }
                sunkCounter++;
            }
        }
        if (sunkCounter == this.numShips) {
            return true;
        }
        return false;
    },

    // компьютер
    autoMode: function() {

        let row = Math.floor(Math.random() * this.boardSize);
        let col = Math.floor(Math.random() * this.boardSize);

        // поиск случайной точки для выстрела
        while (true) {
            row = Math.floor(Math.random() * this.boardSize);
            col = Math.floor(Math.random() * this.boardSize);

            let goodCell = true;
            for (let k = 0; k < this.dxQ.length; k++) {
                let nx = row + this.dxQ[k];
                let ny = col + this.dyQ[k];

                if (!this.validPosition(nx, ny)) {
                    continue;
                }

                if (this.damage[nx][ny] == 1) {
                    goodCell = false;
                }
            }

            if (goodCell) {
                break;
            }
        }

        // найдём раненный корабль и попытаемся его добить
        for (let i = 0; i < this.numShips; i++) {

            let totalCells = 0;
            let dmgShipCells = [];

            for (let x = this.ships[i][0][0]; x <= this.ships[i][1][0]; x++) {
                for (let y = this.ships[i][0][1]; y <= this.ships[i][1][1]; y++) {
                    if (this.shots[x][y] == 1) {
                        dmgShipCells.push([x, y]);
                    }
                    totalCells++;
                }
            }

            if (dmgShipCells.length > 0 && totalCells > dmgShipCells.length) {

                // сколько ранений у корабля
                if (dmgShipCells.length == 1) {
                    for (let k = 0; k < this.dx.length; k++) {
                        let nx = dmgShipCells[0][0] + this.dx[k];
                        let ny = dmgShipCells[0][1] + this.dy[k];

                        // уже стреляли или выходим за пределы поля
                        if (!this.validPosition(nx, ny)
                            || this.shots[nx][ny] == 1
                            || this.damage[nx][ny] == 1) {
                            continue;
                        }

                        row = nx;
                        col = ny;
                    }
                } else { // 2 и более

                    // смотрим, вдоль какой оси вытянут корабль
                    if (dmgShipCells[0][0] == dmgShipCells[1][0]) {
                        // вдоль OY
                        for (let j = 0; j < dmgShipCells.length; j++) {
                            for (let k = 0; k < this.dx.length / 2; k++) {

                                let nx = dmgShipCells[j][0] + this.dx[k];
                                let ny = dmgShipCells[j][1] + this.dy[k];

                                // уже стреляли или выходим за пределы поля
                                if (!this.validPosition(nx, ny)
                                    || this.shots[nx][ny] == 1
                                    || this.damage[nx][ny] == 1) {
                                    continue;
                                }

                                row = nx;
                                col = ny;
                            }
                        }
                    } else {
                        // вдоль OX
                        for (let j = 0; j < dmgShipCells.length; j++) {
                            for (k = this.dx.length / 2; k < this.dx.length; k++) {

                                let nx = dmgShipCells[j][0] + this.dx[k];
                                let ny = dmgShipCells[j][1] + this.dy[k];

                                // уже стреляли или выходим за пределы поля
                                if (!this.validPosition(nx, ny)
                                    || this.shots[nx][ny] == 1
                                    || this.damage[nx][ny] == 1) {
                                    continue;
                                }

                                row = nx;
                                col = ny;
                            }
                        }
                    }
                }

                break;
            }
        }

        if (this.shots[row][col] == 1) {
            // выход из игры при успешном закрытии всех кораблей
            if (!this.paintingKillShips()) {
                this.autoMode();
            }
        } else {
            this.shots[row][col] = 1;

            if (this.isShip(row, col)) {
                view.displayHit(this.getCellElement(row, col));

                this.damage[row][col] = 1;

                // выход из игры при успешном закрытии всех кораблей
                if (!this.paintingKillShips()) {
                    this.autoMode();
                }
            } else {
                view.displayMiss(this.getCellElement(row, col));
            }
        }

        setLastAction(this.player);
    },

    // отмена стрельбы
    endFire: function() {
        let cells = document.querySelectorAll('#' + this.player + ' td');
        for (let i = 0; i < cells.length; i++) {
            cells[i].onclick = null;
        }
    },

    // клик игрока
    clickFire: function(obj) {

        let cells = document.querySelectorAll('#' + obj.player + ' td');
        for (let i = 0; i < cells.length; i++) {
            cells[i].onclick = getShotCoordinates;
        }

        function getShotCoordinates(event) {

            // ожидание своего хода
            if (obj.player == getLastAction()) {
                return true;
            }

            let cell = event.target;
            let xPos = cell.getAttribute('x');
            let yPos = cell.getAttribute('y');

            // уже стреляли сюда
            if (obj.shots[xPos][yPos] == 1) {
                return true;
            }

            obj.shots[xPos][yPos] = 1;

            if (obj.isShip(xPos, yPos)) {
                view.displayHit(cell);

                // выход из игры при успешном закрытии всех кораблей
                if (obj.paintingKillShips()) {
                    setLastAction(obj.player);
                }
            } else {
                view.displayMiss(cell);
                setLastAction(obj.player);
            }
            return true;
        }
    },

    // получение ячейки по её координате
    getCellElement: function(x, y) {
        return document.querySelectorAll('#' + this.player + ' td')[x * this.boardSize + y];
    }
};

// отображение информации на полях игроков
let view = {

    // попадание
    displayHit: function(e) {
        e.setAttribute("class", "hit");
    },

    // корабль игрока
    displayShip: function(e) {
        e.setAttribute("class", "ship");
    },

    // убит
    displaySunk: function(e) {
        e.setAttribute("class", "sunk");
    },

    // промах
    displayMiss: function(e) {
        e.setAttribute("class", "miss");
    }
};

// создаем объект игрока и компьютера
let player = $.extend(true, {}, model);
let computer = $.extend(true, {}, model);

window.onload = init;

// по загрузке страницы начинается игра
function init() {

    player.player = 'player';
    player.buildPlayerShots();
    player.generateShipLocations();
    player.paintingShips();

    computer.player = 'computer';
    computer.buildPlayerShots();
    computer.generateShipLocations();
    computer.clickFire(computer);

    newGame();

    // определяем, кто первым ходит
    if (Math.floor(Math.random() * 2) == 1) {
        setLastAction('player');
    } else {
        setLastAction('computer');
    }
}

let lastAction;

// заканчивает игру
function setLastAction(nameAction) {
    let turnMessage = document.getElementById('gameOver');

    lastAction = nameAction;

    if (player.paintingKillShips()) {
        turnMessage.innerText = 'Победил компьютер!';
        computer.endFire();
        return true;
    } else if (computer.paintingKillShips()) {
        turnMessage.innerText = 'Вы победили!';
        return true;
    } else if (lastAction == 'player') {
        //turnMessage.innerText = 'Ваш ход';
    } else if (lastAction == 'computer') {
        //turnMessage.innerText = 'Компьютер ходит';
        player.autoMode();
    }
}

function getLastAction() {
    return lastAction;
}

// перезагружает страницу для начала новой игры
function newGame() {
    let newGameBtn = document.getElementById('reload');
    newGameBtn.onclick = function() {
        window.location.reload();
    }
}