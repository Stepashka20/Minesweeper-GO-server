const fs = require('fs');
const path = require('path');

//TODO delete repeated code
const getAvatarFile = async (req) => {
    const filename = req.params['*'];

    if (!fs.existsSync(path.join(__dirname,`../../images_cdn/avatars/${filename}`)) || !filename || filename.includes("/") || filename.includes("..") || filename.includes("\\")) {
        return [null,null];
    }
    return [fs.readFileSync(path.join(__dirname,`../../images_cdn/avatars/${filename}`)),filename.split('.')[1]]
}

const getShopImage = async (req) => {
    const filename = req.params['*'];

    if (!fs.existsSync(path.join(__dirname,`../../images_cdn/shop/${filename}`)) || !filename || filename.includes("/") || filename.includes("..") || filename.includes("\\")) {
        return [null,null];
    }
    return [fs.readFileSync(path.join(__dirname,`../../images_cdn/shop/${filename}`)),filename.split('.')[1]]
}

module.exports = {
    getAvatarFile,
    getShopImage
}