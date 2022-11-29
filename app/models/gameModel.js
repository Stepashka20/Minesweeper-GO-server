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
        }],
        points: {
            [user.username]: 0,
        },
        timeBet: 120, //TODO calculate timeBet
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

const generateField = (size,difficulty) => {
    let field = [];
    let mines = 0;
    let minesCount = 0;
    let cellsCount = 0;
    switch (difficulty) {
        case "easy":
            mines = Math.floor(size * size * 0.1);
            break;
        case "medium":
            mines = Math.floor(size * size * 0.15);
            break;
        case "hard":
            mines = Math.floor(size * size * 0.2);
            break;
    }
    cellsCount = size * size;
    minesCount = mines;
    for (let i = 0; i < cellsCount; i++) {
        field.push(0);
    }
    for (let i = 0; i < mines; i++) {
        let rnd = Math.floor(Math.random() * cellsCount);
        if (field[rnd] == 0) {
            field[rnd] = -1;
        } else {
            i--;
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
    createGame
}