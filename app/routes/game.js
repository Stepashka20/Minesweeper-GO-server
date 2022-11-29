const gameController = require('../controllers/gameController');

module.exports = (app,opts,done) => {
    app.get('/game/getLobbies', { onRequest: [app.authenticate]}, gameController.getLobbies);
    app.post('/game/start', { onRequest: [app.authenticate]}, gameController.startGame);
    // app.post('/game/leave', { onRequest: [app.authenticate]}, gameController.leaveGame); //ws function

    

    done()
};
