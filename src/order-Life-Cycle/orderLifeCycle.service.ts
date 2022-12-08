import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Interval } from "@nestjs/schedule";
import { CachingService } from "src/caching/caching.service";
import { HandleManualTaskEnum } from "src/httpResponses/enums/handleManualTaskEnums";
import { MODIFY_ORDERS_QUEUE } from "./constant/queues";
import { MODIFY_ORDERS, UNPAID_ORDERS } from "./constant/services";
import { ModifiedOrder } from "./dto/modifiedOrder";
import { Order } from "./dto/Order";
import { QueueSteps } from "./dto/queueSteps.dto";

@Injectable()
export class OrderLifeCycleService {
    private logger: Logger;
    constructor(
        @Inject( UNPAID_ORDERS ) private unpaidOrdersClient: ClientProxy,
        @Inject(MODIFY_ORDERS) private modifyOrdersClient: ClientProxy,
        private cachingService: CachingService

    ) {}

    public async processOrder(order: ModifiedOrder) {
        let manualStepOrder:ModifiedOrder = order
        this.cachingService.setData(order.order.pedido, order)
        if(order.emmiterData.isNew == false){
            this.modifyOrdersClient.emit(MODIFY_ORDERS_QUEUE, order)
        }

        if(order.emmiterData.retry == true) {
            return
        }
        
        const orderSteps: QueueSteps[] = order.order.steps
        for (let index = 0; index < orderSteps.length; index++) {
            const element = orderSteps[index];
            const taskId: string = element.id;
            const stepNumber: number = index;

            if(element.done == false){
                if( element.isManual ==  true ){
                    manualStepOrder.emmiterData.stepNumber = stepNumber;
                    manualStepOrder.emmiterData.isDone = false;
                    manualStepOrder.emmiterData.queue = manualStepOrder.order.steps[stepNumber].queue;
                    manualStepOrder.emmiterData.isNew = false;
                    this.cachingService.setData(manualStepOrder.order.pedido, manualStepOrder);

                    break;
                }
                this.handleAutomaticTasks(order.order, taskId, stepNumber);
                break;
            }
        }
        return;
    }

    private async sendToQueue(order: ModifiedOrder) {
        switch (order.emmiterData.queue) {
            case UNPAID_ORDERS:
                this.unpaidOrdersClient.emit(UNPAID_ORDERS, order)
                break;
            case undefined:
                this.logger.log(`Queue undefined`)
                break;                                   
            default:
                break;
        }
        this.logger.log(`Enviando pedido a la cola de: RMQ-Queue: --${order.emmiterData.queue}--.`)
        return

    }
    
    public async handleManualTasks(order: string){
        const orderToRetry: ModifiedOrder = await this.cachingService.getData(order);
        if(orderToRetry.order.steps[orderToRetry.emmiterData.stepNumber].isManual == true){
            this.sendToQueue(orderToRetry);
            return HandleManualTaskEnum.OK;
        }
        return HandleManualTaskEnum.NOTMANUALTASK;
    }

    private async handleAutomaticTasks(order:Order, stepId: string, stepNumber: number){
        const orderToSend: ModifiedOrder = new ModifiedOrder();
        orderToSend.order = order;
        orderToSend.emmiterData.queue = order.steps[stepNumber].queue;
        orderToSend.emmiterData.stepId = stepId;
        orderToSend.emmiterData.isNew = false;
        orderToSend.emmiterData.isDone = false;
        orderToSend.emmiterData.stepNumber = stepNumber;

        await this.sendToQueue(orderToSend)
        return;
    }

    public async failedTask(order:ModifiedOrder){
        const failedOrder: ModifiedOrder = order;
        this.cachingService.setData(order.order.pedido, order)
        return
    }

    @Interval(10000)
    async retryNotManualTasks(){
        const ordersToWorkWith: ModifiedOrder[] = await this.cachingService.getAllData();
        ordersToWorkWith.forEach((order, index, array) => {
            if(order.order.steps[order.emmiterData.stepNumber].isManual == false){
                this.sendToQueue(order)
            }
        })
    }
}