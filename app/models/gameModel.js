const fs = require('fs');
const path = require('path');


const createGame = async (req,gameParams,field) => {
    const users = req.mongo.collection('users');
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await users.findOne({username:decodedToken.username});

    const games = req.mongo.collection('games');
    const game = {
        mode: gameParams.mode,
        field: field,
        userField: [...Array(field.length).keys()].map(i => -2),
        size: gameParams.size,
        difficulty: gameParams.difficulty,
        reward: 100, //TODO calculate reward
        players: [{
            username: user.username,
            avatar: user.avatar,
            rating: user.rating,
            points: 0,
        }],
        timeBet: 600, //TODO calculate timeBet
        timeStart: Date.now(),
        status: 'waiting',
        uid: randString(10)
    }
    await games.insertOne(game);
    await users.updateOne({username:user.username},{$set:{game:game.uid}});
    var userResp = game
    delete userResp.field;
    return userResp;
        

}

const getGame = async (req,uid) => {
    const games = req.mongo.collection('games');
    const game = await games.findOne({uid:uid});
    // console.log(game)
    // return null
    const username = req.jwt.decode(req.headers.authorization.split(' ')[1]).username;
    if (!game.players.map(p => p.username).includes(username)) {
        return null
    }
    var userResp = game
    delete userResp.field;
    return userResp;
}

const generateField = (size,difficulty) => {
    let field = [];
    let minesCount = 0;
    let cellsCount = 0;
    switch (difficulty) {
        case "easy":
            minesCount = Math.floor(size * size * 0.1);
            break;
        case "medium":
            minesCount = Math.floor(size * size * 0.15);
            break;
        case "hard":
            minesCount = Math.floor(size * size * 0.2);
            break;
    }
    cellsCount = size * size;
    minesCount = minesCount;
    for (let i = 0; i < cellsCount; i++) {
        field.push(0);
    }
    let placedMinesCount = 0;
    while (placedMinesCount != minesCount) {
        let rnd = Math.floor(Math.random() * cellsCount);
        if (field[rnd] == 0) {
            field[rnd] = -1;
            placedMinesCount++;
        }
    }
    for (let i = 0; i < cellsCount; i++) {
        let minesAround = 0;
        if (field[i] == 0) {
            if (i + 1 < cellsCount && field[i + 1] == -1) {
                minesAround++;
            }
            if (i - 1 >= 0 && field[i - 1] == -1) {
                minesAround++;
            }
            if (i + size < cellsCount && field[i + size] == -1) {
                minesAround++;
            }
            if (i - size >= 0 && field[i - size] == -1) {
                minesAround++;
            }
            if (i + size + 1 < cellsCount && field[i + size + 1] == -1) {
                minesAround++;
            }
            if (i + size - 1 < cellsCount && field[i + size - 1] == -1) {
                minesAround++;
            }
            if (i - size + 1 >= 0 && field[i - size + 1] == -1) {
                minesAround++;
            }
            if (i - size - 1 >= 0 && field[i - size - 1] == -1) {
                minesAround++;
            }
            field[i] = minesAround;
        }
    }
    if (field[0] > 0) {
        let count = 0;
        if (field[1] == -1) count++;
        if (field[size] == -1) count++;
        if (field[size+1] == -1) count++;
        if (count != field[0]) {
            console.log("Error: fantom bomb at top left");
            console.log(field);
            field[0] = count;
        }
    }
    if (field[size-1] > 0) {
        let count = 0;
        if (field[size-2] == -1) count++;
        if (field[2*size-1] == -1) count++;
        if (field[2*size-2] == -1) count++;
        if (count != field[size-1]) {
            console.log("Error: fantom bomb top right");
            console.log(field);
            field[size-1] = count;
        }
    }
    if (field[cellsCount-size] > 0) {
        let count = 0;
        if (field[cellsCount-size+1] == -1) count++;
        if (field[cellsCount-2*size] == -1) count++;
        if (field[cellsCount-2*size+1] == -1) count++;
        if (count != field[cellsCount-size]) {
            console.log("Error: fantom bomb bottom left");
            console.log(field);
            field[cellsCount-size] = count;
        }
    }
    if (field[cellsCount-1] > 0) {
        let count = 0;
        if (field[cellsCount-2] == -1) count++;
        if (field[cellsCount-1-size] == -1) count++;
        if (field[cellsCount-1-size-1] == -1) count++;
        if (count != field[cellsCount-1]) {
            console.log("Error: fantom bomb bottom right");
            console.log(field);
            field[cellsCount-1] = count;
        }
    }
    return field;
}

const randString = (length) => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

module.exports = {
    generateField,
    createGame,
    getGame
}