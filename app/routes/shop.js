const shopController = require('../controllers/shopController');

module.exports = (app,opts,done) => {
    app.get('/shop/items', shopController.getItems);
    app.get('/shop/buy/*', shopController.buyItem);
    app.get('/shop/activate/*', shopController.activateItem);
    app.get('/shop/deactivate/*', shopController.deactivateItem);
    done()
};
