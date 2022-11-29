const cdnModel = require('../models/cdnModel');


const getCdnImage = async (req, res, imageSpace) => {
    const [file,filetype] = await cdnModel.getImage(req, imageSpace);
    if (!file) {
        return res.status(404).send({message: 'Файл не найден'});
    }

    res.header('Cache-Control', 'public, max-age=3600');
    res.type(filetype)
    res.send(file);
}

//TODO combine getAvatar and getShopImage

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