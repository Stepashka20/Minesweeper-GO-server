const shopController = require('../controllers/shopController');

module.exports = (app,opts,done) => {
    app.get('/shop/items', {onRequest: [app.authenticate]}, shopController.getItems);
    app.get('/shop/buy/*', {onRequest: [app.authenticate]}, shopController.buyItem);
    app.get('/shop/activate/*', {onRequest: [app.authenticate]}, shopController.activateItem);
    app.get('/shop/deactivate/*', {onRequest: [app.authenticate]}, shopController.deactivateItem);
    done()
};
