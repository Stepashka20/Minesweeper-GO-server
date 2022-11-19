const cdnModel = require('../models/cdnModel');


//TODO combine getAvatar and getShopImage

const getAvatar = async (req, res) => {
    const [file,filetype] = await cdnModel.getAvatarFile(req);
    if (!file) {
        return res.status(404).send({message: 'Файл не найден'});
    }

    res.header('Cache-Control', 'public, max-age=3600');
    res.type(filetype)
    res.send(file);
}
const getShopImage = async (req, res) => {
    const [file,filetype] = await cdnModel.getShopImage(req);
    if (!file) {
        return res.status(404).send({message: 'Файл не найден'});
    }

    res.header('Cache-Control', 'public, max-age=3600');
    res.type(filetype)
    res.send(file);

}
module.exports = {
    getAvatar,
    getShopImage
}