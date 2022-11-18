const authModel = require('../models/authModel');


const authUser = async (req, res) => {

    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await authModel.findUser(req,"username",decodedToken.username) 
    if (!user)
        return await res.status(400).send({message: 'Пользователь не найден'});
    return await res.status(200).send({
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        balance: user.balance,
        rating: user.rating,
        shop: user.shop,
        items: user.items
    });
}

const loginUser = async (req, res) => {
    const userData = req.body;
    const user = await authModel.findLoginUser(req,userData.email,userData.password);
    if (!user) 
        return await res.status(400).send({message: 'Неверный логин или пароль'});
    return await res.status(200).send({
        username: user.username,
        avatar: user.avatar,
        balance: user.balance,
        rating: user.rating,
        token: user.token,
        shop: user.shop,
        items: user.items
    });
}

const registerUser =async (req, res) => {
    const userData = req.body;
    console.log(userData)
    if (await authModel.findUser(req,"username",userData.username) || await authModel.findUser(req,"email",userData.email)) {
        return await res.status(400).send({message: 'Пользователь уже существует'});
    } 
    const user = await authModel.createUser(req,userData.username,userData.email,userData.password);
    return await res.status(200).send({
        username: user.username,
        avatar: user.avatar,
        balance: user.balance,
        rating: user.rating,
        token: user.token,
        shop: user.shop,
        items: user.items
    });
}


module.exports = {
    authUser,
    loginUser,
    registerUser
}