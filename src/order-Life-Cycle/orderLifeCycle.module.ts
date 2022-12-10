import { Module } from "@nestjs/common";
import { CachingModule } from "src/caching/caching.module";
import { ModifyOrderMicroserviceModule } from "src/microservices/modifyOrder/modifyOrderMicroservice.module";
import { OrdersEngineModule } from "src/microservices/ordersEngine/ordersEngine.module";
import { UnpaidOrderMicroserviceModule } from "src/microservices/unpaidOrders/unpaidOrders.module";
import { MODIFY_ORDERS, TO_ORDERS_ENGINE, UNPAID_ORDERS } from "./constant/services";
import { OrderLifeCycleController } from "./orderLifeCycle.controller";
import { OrderLifeCycleService } from "./orderLifeCycle.service";

@Module({
    imports:[
        ModifyOrderMicroserviceModule.register({
            name: MODIFY_ORDERS,
        }),
        OrdersEngineModule.register({
            name: TO_ORDERS_ENGINE
        }),
        UnpaidOrderMicroserviceModule.register({
            name: UNPAID_ORDERS
        }),

        CachingModule],
    controllers:[OrderLifeCycleController],
    providers:[OrderLifeCycleService]
})
export class OrderLifeCycleModule {}