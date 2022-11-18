const fs = require('fs');
const path = require('path');

const getAvatarFile = async (req) => {
    const filename = req.params['*'];

    if (!fs.existsSync(path.join(__dirname,`../../images_cdn/${filename}`)) || !filename || filename.includes("/") || filename.includes("..") || filename.includes("\\")) {
        return [null,null];
    }
    return [fs.readFileSync(path.join(__dirname,`../../images_cdn/${filename}`)),filename.split('.')[1]]
}


module.exports = {
    getAvatarFile
}