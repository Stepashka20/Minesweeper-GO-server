const fs = require('fs');
const path = require('path');
const cdnModel = require('../models/cdnModel');
const getAvatar = async (req, res) => {
    const [file,filetype] = await cdnModel.getAvatarFile(req);
    if (!file) {
        return res.status(404).send({message: 'Файл не найден'});
    }

    res.header('Cache-Control', 'public, max-age=3600');
    res.type(filetype)
    res.send(file);
}

module.exports = {
    getAvatar
}