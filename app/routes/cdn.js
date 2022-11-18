const cdnController = require('../controllers/cdnController');

module.exports = (app,opts,done) => {
    app.get('/cdn/*', cdnController.getAvatar);
    done()
};
