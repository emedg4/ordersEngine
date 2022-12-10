import { Controller, Get, Logger, Query } from "@nestjs/common";
import { Ctx, EventPattern, Payload, RmqContext } from "@nestjs/microservices";
import { HandleManualTaskEnum } from "src/httpResponses/enums/handleManualTaskEnums";
import { HANDLEMANUALTASK } from "src/httpResponses/handleManualTask";
import { OrdersEngineService } from "src/microservices/ordersEngine/ordersEngine.service";
import { TO_ORDERS_ENGINE } from "./constant/queues";
import { ModifiedOrder } from "./dto/modifiedOrder";
import { OrderLifeCycleService } from "./orderLifeCycle.service";

@Controller()
export class OrderLifeCycleController {
    private logger: Logger;
    constructor( private orderLifeCycleService: OrderLifeCycleService,
                 private toOrdersEngineClient: OrdersEngineService  ){
        this.logger = new Logger(OrderLifeCycleController.name);
    }
    @EventPattern(TO_ORDERS_ENGINE)
    async newOrderInOrdersEngine(@Payload() payload: ModifiedOrder, @Ctx() context: RmqContext){
        try {
            if(payload.emmiterData.isDone == false){
                this.orderLifeCycleService.failedTask(payload)
                return
            }
            await this.orderLifeCycleService.processOrder(payload);
            this.toOrdersEngineClient.ack(context)
            return;
        } catch (e) {
            this.logger.log(e)
            return;
        }
    }

    @Get(`:pedido`)
    async retryManualTask(@Query("pedido") pedido: string){
        const response = new HANDLEMANUALTASK(pedido);
        try {
            const manualTask = await this.orderLifeCycleService.handleManualTasks(pedido);
            if(manualTask == HandleManualTaskEnum.OK){
                return await response.processInitialized();
            }
            if(manualTask == HandleManualTaskEnum.NOTMANUALTASK){
                return await response.taskNotManual();
            }
            
        } catch (e) {
            console.log(e)
        }
    }
}