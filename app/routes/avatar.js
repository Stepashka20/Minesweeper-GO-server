const avatarController = require("../controllers/avatarController");
module.exports = (app,opts,done) => {
    app.post('/upload', avatarController.uploadAvatar);
    done()
};
