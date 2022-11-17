const UserController = require('../controllers/userController');
const userSchema = require('./schemas/userSchema');
module.exports = (app,opts,done) => {
    app.get('/user', UserController.getUser);
    app.put('/user',{
        schema: userSchema.createUserSchema
    }, UserController.createUser);
    done()
};

