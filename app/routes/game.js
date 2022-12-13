const gameController = require('../controllers/gameController');
const gameSchema = require('./schemas/gameSchema');

module.exports = (app,opts,done) => {
    app.get('/game/getLobbies', { onRequest: [app.authenticate]}, gameController.getLobbies);
    app.post('/game/createLobby', { onRequest: [app.authenticate],schema: gameSchema.createLobbySchema}, gameController.createLobby);
    app.get('/game/joinLobby/*', { onRequest: [app.authenticate]}, gameController.joinLobby);
    app.post('/game/start', { onRequest: [app.authenticate],schema: gameSchema.startSchema}, gameController.startGame);
    app.get('/game/deleteLobby', { onRequest: [app.authenticate]}, gameController.deleteLobby);
    app.get('/game/*', { onRequest: [app.authenticate]}, gameController.getGame);

    done()
};
