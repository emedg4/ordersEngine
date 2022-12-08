export default () => ({
    app: {
        port: process.env.APP_PORT
    },
    rbmq:{
        user: process.env.RABBITMQ_USER,
        pass: process.env.RABBITMQ_PASSWORD,
        host: process.env.RABBITMQ_HOST,
        url: process.env.RABBITMQ_URL,
        queue: {
            toOrdersEngine: process.env.TO_ORDERS_ENGINE,
            modifyOrders: process.env.MODIFY_ORDER_QUEUE,
            unpaidOrders: process.env.UNPAID_ORDERS_QUEUE,
        },
    }
})