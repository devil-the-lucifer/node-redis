const { redisClient } = require("./redisClient")


const init = async() => {
    const result = await redisClient.get('user:1');

    console.log("Result : ",result)
}

init();