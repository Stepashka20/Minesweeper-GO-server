const fs = require('fs');
const path = require('path');


const createGame = async (req,gameParams,field) => {
    const users = req.mongo.collection('users');
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await users.findOne({username:decodedToken.username});

    const games = req.mongo.collection('games');
    const reward = calcRewardTime(gameParams.difficulty,gameParams.size,+(gameParams.timeBet.replace('time_','')))
    const game = {
        mode: gameParams.mode,
        field: field,
        userField: [...Array(field.length).keys()].map(i => -2),
        size: gameParams.size,
        difficulty: gameParams.difficulty,
        reward: {
            bombs: reward.bombs,
            stars: 0
        },
        players: [{
            username: user.username,
            avatar: user.avatar,
            rating: user.rating,
            points: 0,
        }],
        timeBet: reward.time, 
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
        const [x,y] = [i % size,Math.floor(i / size)];
        if (field[i] == 0) {
            if (x > 0 && field[i-1] == -1) {
                minesAround++;
            }
            if (x < size - 1 && field[i+1] == -1) {
                minesAround++;
            }
            if (y > 0 && field[i-size] == -1) {
                minesAround++;
            }
            if (y < size - 1 && field[i+size] == -1) {
                minesAround++;
            }
            if (x > 0 && y > 0 && field[i-size-1] == -1) {
                minesAround++;
            }
            if (x > 0 && y < size - 1 && field[i+size-1] == -1) {
                minesAround++;
            }
            if (x < size - 1 && y > 0 && field[i-size+1] == -1) {
                minesAround++;
            }
            if (x < size - 1 && y < size - 1 && field[i+size+1] == -1) {
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


const calcRewardTime = (difficulty,size,timeBet) => {
    const p = {"easy": 1,"medium": 2,"hard": 3}
    const max_b = 450
    const max_t = {"easy": 100,"medium": 150,"hard": 200}[difficulty]
    const b = max_b / 9
    const t = max_t / 5
    const pointsMin = b*(3*(size/5-2)+p[difficulty]);
    const timeMin = t*(size/5-2+4-p[difficulty]);

    return {
        bombs: [Math.floor(pointsMin*1.9*1.9),Math.floor(pointsMin*1.8),pointsMin][timeBet],
        time: [timeMin,timeMin*2,timeMin*3][timeBet]
    }
    
}

module.exports = {
    generateField,
    createGame,
    getGame
}