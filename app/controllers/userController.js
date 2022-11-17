const userModel = require('../models/userModel');


const getUser = async (req, res) => {

    
}
const createUser = async (req, res) => {
    const userData = req.body;
    console.log(userData)
    if (await userModel.findUser(req,"username",userData.username) || await userModel.findUser(req,"email",userData.email)) {
        return await res.status(400).send({error: 'Пользователь уже существует'});
    } 
    const userCreated = await userModel.createUser(req,userData.username,userData.email,userData.password);
    const user = await userModel.findUser(req,"_id",userCreated.insertedId);
    return await res.status(200).send({user: user});
}
module.exports = {
    getUser,
    createUser
}