const sha256 = require('sha256');
require('dotenv').config();

const findUser = async (req,field, value) => {
    const users = req.mongo.collection('users');
    const user = await users.findOne({[field]:value});
    return user;
}
const findLoginUser = async (req,username, password) => {
    const users = req.mongo.collection('users');
    var user = await users.findOne({username:username,password:sha256(password+process.env.PASSWORD_SALT)})
    if (!user) 
        return null;
    const token = await req.jwt.sign({ username: username }, {expiresIn: "7d"})
    await users.updateOne({username:username},{$set:{token:token}})
    user.token = token;
    return user;
}
const createUser = async (req, username,email,password) => {
    const users = req.mongo.collection('users');
    const token = await req.jwt.sign({ username: username }, {expiresIn: "7d"})
    const user = await users.insertOne({
        username: username,
        email: email,
        password: sha256(password+process.env.PASSWORD_SALT),
        balance: 0,
        rating: 0,
        avatar: "",
        shop: {
            avatarBorder: "",
            usernameColor: "",
        },
        statistics: {
            bestTime: {
                easy: 0,
                medium: 0,
                hard: 0
            },
            games: {
                easy: 0,
                medium: 0,
                hard: 0
            },
            wins: {
                easy: 0,
                medium: 0,
                hard: 0
            },
            loses: {
                easy: 0,
                medium: 0,
                hard: 0
            },
        },
        gameHistory: [],
        items:[],
        token: token
    });

    return await findUser(req,"_id",user.insertedId);
}
module.exports = {
    findUser,
    createUser,
    findLoginUser
}