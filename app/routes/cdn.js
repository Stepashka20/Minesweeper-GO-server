const cdnController = require('../controllers/cdnController');

module.exports = (app,opts,done) => {
    app.get('/cdn/avatar/*', cdnController.getAvatar);
    app.get('/cdn/shop/*', cdnController.getShopImage);
    done()
};
