const avatarModel = require('../models/avatarModel');

const uploadAvatar = async (req, res) => {
    // const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const data = await req.file()
    console.log(data.mimetype)
    if (!data || !data?.file || !data?.mimetype?.startsWith('image') || !(["png","jpg","jpeg"].includes(data.mimetype.replace('image/','')))) {
        return res.status(400).send({message: 'Неверный формат файла'});
    } 
    console.log(data)
    await avatarModel.saveAvatarToDisk(req,data);
    res.send({message: 'Аватар успешно загружен'});
    
}


module.exports = {
    uploadAvatar
}