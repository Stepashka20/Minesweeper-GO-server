const fs = require('fs');
const path = require('path');

const imageSpaceToFolder = {
    "avatar": "avatars",
    "shop": "shop"
}

const getImage = async (req, imageSpace) => {
    const filename = req.params['*'];
    console.log(filename);
    const imageFolder = imageSpaceToFolder[imageSpace]
    if (!fs.existsSync(path.join(__dirname,`../../images_cdn/${imageFolder}/${filename}`)) || !filename || filename.includes("/") || filename.includes("..") || filename.includes("\\")) {
        return [null,null];
    }
    return [fs.readFileSync(path.join(__dirname,`../../images_cdn/${imageFolder}/${filename}`)),filename.split('.')[1]]
}

module.exports = {
    getImage
}