const shopModel = require('../models/shopModel');

const getItems = async (req, res) => {
    const items = await shopModel.getItems(req);
    return await res.status(200).send(items);

}


//TODO combine 3 functions to one
//TODO REMOVE AVATAR AND RENAME TO AVATAR BORDER!!!!!!!! 
const buyItem = async (req, res) => {
    const id = +req.params['*']
    const item = await shopModel.getItem(req,id);
    if (!item) {
        return await res.status(404).send({message: 'Товар не найден'});
    }
    const result = await shopModel.buyItem(req,item);
    if (result.status == 200) {
        return await res.status(result.status).send({message: result.message, balance: result.user.balance, items: result.user.items});
    } else {
        return await res.status(result.status).send({message: result.message});
    }

}

const activateItem = async (req, res) => {
    const id = Number(req.params['*'])
    const item = await shopModel.getItem(req,id);
    if (!item) {
        return await res.status(404).send({message: 'Товар не найден'});
    }
    const result = await shopModel.activateItem(req,item);
    if (result.status == 200) {
        return await res.status(result.status).send({message: result.message, activeItems: result.user.activeItems,shop: result.user.shop});
    } else {
        return await res.status(result.status).send({message: result.message});
    }
}

const deactivateItem = async (req, res) => {
    const id = Number(req.params['*'])
    const item = await shopModel.getItem(req,id);
    if (!item) {
        return await res.status(404).send({message: 'Товар не найден'});
    }
    const result = await shopModel.deactivateItem(req,item);
    if (result.status == 200) {
        return await res.status(result.status).send({message: result.message, activeItems: result.user.activeItems,shop: result.user.shop});
    } else {
        return await res.status(result.status).send({message: result.message});
    }
}
module.exports = {
    getItems,
    buyItem,
    activateItem,
    deactivateItem
}