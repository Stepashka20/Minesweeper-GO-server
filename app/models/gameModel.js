const fs = require('fs');
const path = require('path');
const {multiplayerSocketService} = require('../services/multiplayerSocketService');

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
            customisation: {
                usernameColor: user.shop.usernameColor,
                avatarBorder: user.shop.avatarBorder,
            },
            rating: user.rating,
            points: 0,
        }],
        timeBet: reward.time, 
        timeStart: Date.now(),
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

    const username = req.jwt.decode(req.headers.authorization.split(' ')[1]).username;
    if (!game) return null
    if (!game.players.map(p => p.username).includes(username) && game.mode != "multiplayer") {
        return null
    }
    var userResp = game
    if (userResp.mode == "multiplayer") {
        userResp.userFields = userResp.userFields.filter(f => f.username == username)
    }
    delete userResp.field;
   
    // console.log(userResp)
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


const createGameAndLobby = async (req,gameParams,field) => {
    const users = req.mongo.collection('users');
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await users.findOne({username:decodedToken.username});

    const games = req.mongo.collection('games');

    const game = {
        mode: "multiplayer",
        status: "waiting",
        field: field,
        creator: user.username,
        userFields: [
            {
                username: user.username,
                field:[...Array(field.length).keys()].map(i => -2)
            },
            {
                username: "",
                field:[...Array(field.length).keys()].map(i => -2)
            }
        ],
        size: gameParams.size,
        difficulty: gameParams.difficulty,
        reward: {
            bombs: gameParams.betType == "balance" ? gameParams.bet : 0,
            stars: gameParams.betType == "rating" ? gameParams.bet : 0
        },
        players: [{
            username: user.username,
            avatar: user.avatar,
            customisation: {
                usernameColor: user.shop.usernameColor,
                avatarBorder: user.shop.avatarBorder,
            },
            rating: user.rating,
            points: 0,
            status: "playing"
        }],
        timeStart: 0,
        uid: randString(10)
    }
    await games.insertOne(game);
    await users.updateOne({username:user.username},{$set:{game:game.uid},$inc:{balance:-game.reward.bombs,rating:-game.reward.stars}});
    return {uid:game.uid,balance:user.balance-game.reward.bombs,rating:user.rating-game.reward.stars};
}

const check = async (req, type, value) =>{
    const users = req.mongo.collection('users');
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await users.findOne({username:decodedToken.username});

    if (user[type] < value) {
        return `У вас недостаточно ${type == "balance" ? "денег": "рейтинга"}!`
    }
    return null

}

const getLobbies = async (req) => {
    const games = req.mongo.collection('games');
    const lobbies = await games.find({mode:"multiplayer",status:"waiting"}).toArray();
    const username = req.jwt.decode(req.headers.authorization.split(' ')[1]).username;
   
    return lobbies.filter(x=>x.players[0].username != username).map(lobby => {
        return {
            username: lobby.players[0].username,
            avatar: lobby.players[0].avatar,
            customisation: lobby.players[0].customisation,  //TODO get current user customisation using aggregate
            betType: lobby.reward.bombs > 0 ? "money" : "rating",
            bet: lobby.reward.bombs > 0 ? lobby.reward.bombs : lobby.reward.stars,
            size: lobby.size,
            difficulty: lobby.difficulty,
            uid: lobby.uid
        }
    })
}

const joinGame = async (req,uid) => {
    const users = req.mongo.collection('users');
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await users.findOne({username:decodedToken.username});

    const games = req.mongo.collection('games');
    const game = await games.findOne({uid:uid});

    //set game playing, set start time, add user to players, set usernmae to userFields[1].username
    await games.updateOne({uid:uid},
        {$set:{
            status: "playing",
            timeStart: Date.now(),
            players: [...game.players,{
                username: user.username,
                avatar: user.avatar,
                customisation: {
                    usernameColor: user.shop.usernameColor,
                    avatarBorder: user.shop.avatarBorder,
                },
                rating: user.rating,
                points: 0,
                status: "playing"
            }],
            userFields: [
                game.userFields[0],
                {
                    username: user.username,
                    field:[...Array(game.field.length).keys()].map(i => -2)
                }
            ]
        }}
    );
    await users.updateOne({username:user.username},{$set:{game:uid},$inc:{balance:-game.reward.bombs,stars:-game.reward.stars}});
    let updatedGame = await games.findOne({uid:uid});
    
    delete updatedGame._id;
    delete updatedGame.field;
    return {
        gameInfo: updatedGame,
        balance: user.balance-game.reward.bombs,
        rating: user.rating-game.reward.stars
    }

}
const checkCreator = async (req,username) => {
    const users = req.mongo.collection('users');
    const user = await users.findOne({username});
    
    const games = req.mongo.collection('games');
    const game = await games.findOne({uid:user.game});
    if (!game) return false;
    return game.creator == username && game.status == "waiting";
}

const deleteGame = async (req,username) => {
    const users = req.mongo.collection('users');
    const games = req.mongo.collection('games');

    const user = await users.findOne({username});
    const game = await games.findOne({uid:user.game});

    await games.deleteOne({uid:user.game});
    
    await users.updateOne({username},{$set:{game:null},$inc:{balance: game.reward.bombs, rating: game.reward.stars}});
    await multiplayerSocketService().deleteGame(user.game);
    return {balance: user.balance+game.reward.bombs, rating: user.rating+game.reward.stars}
}
module.exports = {
    generateField,
    createGame,
    getGame,
    createGameAndLobby,
    check,
    getLobbies,
    joinGame,
    checkCreator,
    deleteGame
}