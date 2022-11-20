const avatarModel = require('../models/avatarModel');

const uploadAvatar = async (req, res) => {
    const data = await req.file()
    if (!data || !data?.file || !data?.mimetype?.startsWith('image') || !(["png","jpg","jpeg"].includes(data.mimetype.replace('image/','')))) {
        return res.status(400).send({message: 'Неверный формат файла'});
    } 

    const url = await avatarModel.saveAvatarToDisk(req,data);
    res.send({message: 'Аватар успешно загружен',url});
    
}


module.exports = {
    uploadAvatar
}