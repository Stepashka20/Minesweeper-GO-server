

const getItems = async (req) => {
    const shop = req.mongo.collection('shop');
    const items = await shop.find({}).toArray();
    //combine items to object with arrays where key is type
    var itemsObj = {};
    items.forEach(item => {
        if (!itemsObj[item.type]) {
            itemsObj[item.type] = [];
        }
        const type = item.type;
        delete item._id;
        delete item.type;
        itemsObj[type].push(item);
    })
    return itemsObj;
}

const getItem = async (req,id) => {
    const shop = req.mongo.collection('shop');
    const item = await shop.findOne({id:+id});
    return item
}

const buyItem = async (req,item) => {
    const users = req.mongo.collection('users');
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await users.findOne({username:decodedToken.username});
    if (user.balance < item.item.price) {
        return {status: 400, message: 'Недостаточно средств'};
    }

    if (user.items.includes(item.id)) {
        return {status: 400, message: 'У вас уже есть этот предмет'};
    }
    await users.updateOne({username:decodedToken.username},{$inc:{balance:-item.item.price},$push:{items:item.id}});
    const newUser = await users.findOne({username:decodedToken.username});
    return {status: 200, message: 'Предмет успешно куплен',user:{
        balance:newUser.balance,
        items:newUser.items
    }}
};

const activateItem = async (req,item) => {
    const users = req.mongo.collection('users');
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await users.findOne({username:decodedToken.username});
    if (!user.items.includes(item.id)) {
        return {status: 400, message: 'У вас нет этого предмета'};
    }
    if (user.activeItems[item.type] == item.id) {
        return {status: 400, message: 'Этот предмет уже активирован'};
    }
    const itemMap = {
        "username": "usernameColor",
        "avatar": "avatarBorder",
    }
    
    await users.updateOne({username:decodedToken.username},{$set:{[`activeItems.${item.type}`]:item.id, [`shop.${itemMap[item.type]}`]:item.item.param}});
    const newUser = await users.findOne({username:decodedToken.username});
    return {status: 200, message: 'Предмет успешно активирован',user:{
        activeItems:newUser.activeItems,
        shop:newUser.shop
    }}
}

const deactivateItem = async (req,item) => {
    const users = req.mongo.collection('users');
    const decodedToken = req.jwt.decode(req.headers.authorization.split(' ')[1]);
    const user = await users.findOne({username:decodedToken.username});
    if (!user.items.includes(item.id)) {
        return {status: 400, message: 'У вас нет этого предмета'};
    }
    if (user.activeItems[item.type] != item.id) {
        return {status: 400, message: 'Этот предмет не активирован'};
    }
    const itemMap = {
        "username": "usernameColor",
        "avatar": "avatarBorder",
    }
    await users.updateOne({username:decodedToken.username},{$set:{[`activeItems.${item.type}`]:0, [`shop.${itemMap[item.type]}`]:""}});
    const newUser = await users.findOne({username:decodedToken.username});
    return {status: 200, message: 'Предмет успешно деактивирован',user:{
        activeItems:newUser.activeItems,
        shop:newUser.shop
    }}
}

module.exports = {
    getItems,
    getItem,
    buyItem,
    activateItem,
    deactivateItem
}