const fs = require('fs');
const path = require('path');
const saveAvatarToDisk = async (req,data) => {
    const buffer = await data.toBuffer()
    const extension = data.mimetype.split('/')[1];
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const users = req.mongo.collection('users');
    const user = await users.findOne({username:decodedToken.username});
    if (user.avatar)
        fs.unlinkSync(path.join(__dirname,`../../images_cdn/avatars/${user.avatar}`));
    const filename = `${randString(10)}.${extension}`;
    fs.writeFileSync(path.join(__dirname,`../../images_cdn/avatars/${filename}`), buffer);
    await users.updateOne({username:decodedToken.username},{$set:{avatar:`${filename}`}});
    return `${filename}`;
}

const randString = (length) => {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

module.exports = {
    saveAvatarToDisk
}