const authController = require('../controllers/authController');
const authSchema = require('./schemas/authSchema');
module.exports = (app,opts,done) => {
    app.get('/auth', {onRequest: [app.authenticate]},authController.authUser);
    app.post('/login',{schema: authSchema.loginSchema} ,authController.loginUser);
    app.post('/register',{schema: authSchema.registerSchema}, authController.registerUser);
    done()
};
