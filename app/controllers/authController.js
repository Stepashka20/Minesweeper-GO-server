const authModel = require('../models/authModel');


const authUser = async (req, res) => {

    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await authModel.findUser(req,"username",decodedToken.username) 
    if (!user)
        return await res.status(400).send({message: 'Пользователь не найден'});
     return await res.status(200).send(await authModel.returnToUser(req,user));
}

const loginUser = async (req, res) => {
    const userData = req.body;
    const user = await authModel.findLoginUser(req,userData.login,userData.password);
    if (!user) 
        return await res.status(400).send({message: 'Неверный логин или пароль'});
    return await res.status(200).send(await authModel.returnToUser(req,user));
}

const registerUser =async (req, res) => {
    const userData = req.body;
    console.log(userData)
    if (await authModel.findUser(req,"username",userData.username) || await authModel.findUser(req,"email",userData.email)) {
        return await res.status(400).send({message: 'Пользователь уже существует'});
    } 
    const user = await authModel.createUser(req,userData.username,userData.email,userData.password);
    return await res.status(200).send(await authModel.returnToUser(req,user));
}


module.exports = {
    authUser,
    loginUser,
    registerUser
}