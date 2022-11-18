const fs = require('fs');
const path = require('path');
const saveAvatarToDisk = async (req,data) => {
    const buffer = await data.toBuffer()
    const extension = data.mimetype.split('/')[1];
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const users = req.mongo.collection('users');
    const user = await users.findOne({username:decodedToken.username});
    if (user.avatar)
        fs.unlinkSync(path.join(__dirname,`../../images_cdn/${user.avatar}`));

    fs.writeFileSync(path.join(__dirname,`../../images_cdn/${user.username}.${extension}`), buffer);
    users.updateOne({username:decodedToken.username},{$set:{avatar:`${user.username}.${extension}`}});

}



module.exports = {
    saveAvatarToDisk
}