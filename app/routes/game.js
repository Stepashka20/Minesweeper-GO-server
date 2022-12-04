const gameController = require('../controllers/gameController');

module.exports = (app,opts,done) => {
    app.get('/game/getLobbies', { onRequest: [app.authenticate]}, gameController.getLobbies);
    app.post('/game/createLobby', { onRequest: [app.authenticate]}, gameController.createLobby);
    app.get('/game/joinLobby/*', { onRequest: [app.authenticate]}, gameController.joinLobby);
    app.post('/game/start', { onRequest: [app.authenticate]}, gameController.startGame);
    app.get('/game/*', { onRequest: [app.authenticate]}, gameController.getGame);

    done()
};
