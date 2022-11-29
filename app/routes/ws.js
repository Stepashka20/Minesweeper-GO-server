const websocketController = require('../controllers/websocketController');

module.exports = (app,opts,done) => {
    app.get('/ws/', { websocket: true,onRequest: [app.authenticate]}, websocketController.init);
    done()
};
