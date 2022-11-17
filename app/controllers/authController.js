const authModel = require('../models/authModel');


const authUser = async (req, res) => {

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