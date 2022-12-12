const gameModel = require('../models/gameModel');

const getLobbies = async (req, res) => {
    const lobbies = await gameModel.getLobbies(req);
    res.send(lobbies);

}
   
//TODO schema validation
const startGame = async (req, res) => {
    const gameParams = req.body;

    if (gameParams.mode === 'single') {
        const field = gameModel.generateField(gameParams.size, gameParams.difficulty);
        const game = await gameModel.createGame(req,gameParams,field);
        res.send(game);
    }
}

const getGame = async (req, res) => {
    const uid = req.params['*']
    const game = await gameModel.getGame(req,uid);
    if (!game) {
        return res.status(404).send({message: "Игра не найдена"}); 
    }
    res.send(game);
}
//TODO schema validation
const createLobby = async (req, res) => {
    const gameParams = req.body;

    //TODO check if user is in game or lobby

    const check = await gameModel.check(req,gameParams.betType,gameParams.bet)

    if (check) {
        return res.status(400).send({message: check});
    }
    const field = gameModel.generateField(gameParams.size, gameParams.difficulty);
    const gameUID = await gameModel.createGameAndLobby(req,gameParams,field);
    res.send(gameUID);

}
const joinLobby = async (req, res) => {
    const uid = req.params['*']
    const game = await gameModel.getGame(req,uid);
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const username = decodedToken.username;
    if (!game) {
        return res.status(404).send({message: "Игра не найдена"}); 
    }
    if (game.players.length >= 2) {
        return res.status(400).send({message: "Лобби заполнено"}); 
    }
    if (game.players[0].username == username) {
        return res.status(400).send({message: "Вы не можете присоединиться к своей игре"});
    }
    const check = await gameModel.check(req,game.reward.bombs > 0 ? "balance" : "rating",game.reward.bombs > 0 ? game.reward.bombs : game.reward.stars)

    if (check) {
        return res.status(400).send({message: check});
    }
    const newGame = await gameModel.joinGame(req,uid);
    res.send({newGame:newGame.gameInfo.uid,balance: newGame.balance, rating: newGame.rating});

}
const deleteLobby = async (req, res) => {
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const username = decodedToken.username;
    
    if (!gameModel.checkCreator(req,username)) {
        return res.status(403).send({message: "Вы не можете удалить эту игру"});
    }
    const refundBet = await gameModel.deleteGame(req,username);
    res.send({message: "Вы вышли из лобби", refundBet});
}
module.exports = {
    getLobbies,
    startGame,
    getGame,
    createLobby,
    joinLobby,
    deleteLobby
}