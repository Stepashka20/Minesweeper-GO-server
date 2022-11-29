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





module.exports = {
    getLobbies,
    startGame
}