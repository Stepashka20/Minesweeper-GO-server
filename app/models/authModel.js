const sha256 = require('sha256');
require('dotenv').config();

const getTop = async (req) => {
    const users = req.mongo.collection('users');
    var top = await users.find({},{projection:{username:1,rating:1,avatar:1,shop:1,statistics:1}}).sort({rating:-1}).limit(10).toArray();
    top = top.map((user,index) => {
        return {
            username: user.username,
            rating: user.rating,
            avatar: user.avatar,
            shop: user.shop,
            wins: user.statistics.wins.easy + user.statistics.wins.medium + user.statistics.wins.hard,
            losses: user.statistics.losses.easy + user.statistics.losses.medium + user.statistics.losses.hard
        }
    })
    return top;
}
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

const returnToUser = async (req,user) => {
    const top = await getTop(req);
    return {
        user:{
            username: user.username,
            avatar: user.avatar,
            balance: user.balance,
            rating: user.rating,
            shop: user.shop,
            items: user.items,
            token: user.token,
            statistics: user.statistics,
            activeItems: user.activeItems,
            game: user.game,
            gameHistory: user.gameHistory.slice(user.gameHistory.length-15 < 0 ? 0 : user.gameHistory.length ,user.gameHistory.length)
        },
        top: top
       
    }
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
        activeItems:{
            avatar: 0,
            username: 0,
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
            losses: {
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
    findLoginUser,
    returnToUser
}