const cdnModel = require('../models/cdnModel');


const getCdnImage = async (req, res, imageType) => {
    const [file,filetype] = await cdnModel.getImage(req, imageType);
    if (!file) {
        return res.status(404).send({message: 'Файл не найден'});
    }

    res.header('Cache-Control', 'public, max-age=3600');
    res.type(filetype)
    res.send(file);
}

const getAvatar = async (req, res) => {
    getCdnImage(req, res, "avatar");
}
const getShopImage = async (req, res) => {
    getCdnImage(req, res, "shop");
}
module.exports = {
    getAvatar,
    getShopImage
}