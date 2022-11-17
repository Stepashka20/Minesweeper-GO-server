const sha256 = require('sha256');

const findUser = async (req,field, value) => {
    const users = req.mongo.collection('users');
    const user = await users.findOne({[field]:value});
    return user;
}
const createUser = async (req, username,email,password) => {
    const users = req.mongo.collection('users');

    const user = await users.insertOne({
        username: username,
        email: email,
        password: sha256(password+"kKLefiJFIDL#fT|x"),
        balance: 0,
        raiting: 0,
        avatar: ""
    });

    return user;
}
module.exports = {
    findUser,
    createUser
}