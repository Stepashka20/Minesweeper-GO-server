const avatarController = require("../controllers/avatarController");
module.exports = (app,opts,done) => {
    app.post('/upload',{onRequest: [app.authenticate]}, avatarController.uploadAvatar);
    done()
};
