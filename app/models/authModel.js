const sha256 = require('sha256');
require('dotenv').config();

const findUser = async (req,field, value) => {
    const users = req.mongo.collection('users');
    const user = await users.findOne({[field]:value});
    return user;
}
const findLoginUser = async (req,email, password) => {
    const users = req.mongo.collection('users');
    const user = await users.findOne({email:email,password:sha256(password+process.env.PASSWORD_SALT)})
    if (!user) 
        return null;
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
            avatarBorder: 0,
            avatarColor: 0,
        },
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