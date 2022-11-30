const gameModel = require('../models/gameModel');

const getLobbies = async (req, res) => {


}

//TODO schema validation
const startGame = async (req, res) => {
    const gameParams = req.body;
    console.log(gameParams)
    //{ size: '20', difficulty: 'easy', timeBet: 'time_0' }
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



module.exports = {
    getLobbies,
    startGame,
    getGame
}