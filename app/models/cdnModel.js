const fs = require('fs');
const path = require('path');

const imageSpaceToFolder = {
    "avatar": "avatars",
    "shop": "shop"
}

const getImage = async (req, imageType) => {
    const filename = req.params['*'];

    const imageFolder = imageSpaceToFolder[imageType]
    if (!fs.existsSync(path.join(__dirname,`../../images_cdn/${imageFolder}/${filename}`)) || !filename || filename.includes("/") || filename.includes("..") || filename.includes("\\")) {
        return [null,null];
    }
    return [fs.readFileSync(path.join(__dirname,`../../images_cdn/${imageFolder}/${filename}`)),filename.split('.')[1]]
}

module.exports = {
    getImage
}