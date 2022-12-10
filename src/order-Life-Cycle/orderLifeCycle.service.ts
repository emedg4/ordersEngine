import { Inject, Injectable, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { Interval } from "@nestjs/schedule";
import { CachingService } from "src/caching/caching.service";
import { HandleManualTaskEnum } from "src/httpResponses/enums/handleManualTaskEnums";
import { FINALIZADOS } from "./constant/Estatus";
import { MODIFY_ORDERS_QUEUE } from "./constant/queues";
import { MODIFY_ORDERS, UNPAID_ORDERS } from "./constant/services";
import { EmmiterData } from "./dto/emitterData";
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

        if(order.emmiterData.isNew == true){
            await this.cachingService.setData(order.order.pedido, order);
            await this.ordersProcessor(order);
            return;
        }

        if(order.emmiterData.isNew == false){
            if(order.emmiterData.retry == true) {
                //order failed case
                await this.cachingService.setData(order.order.pedido, order);
                this.modifyOrdersClient.emit(MODIFY_ORDERS_QUEUE, order)
                return;
            }
            else{
                const bigStep = order.order.steps[order.emmiterData.perStatusStep].steps;
                let isBigStepFinish = false;
                let numberOfSteps = bigStep.length
                let stepsToAcomplish = 0;
                for (let fQueueStepsIndex = 0; fQueueStepsIndex < numberOfSteps; fQueueStepsIndex++) {
                    const element = bigStep[fQueueStepsIndex];
                    if(element.done == true){
                        stepsToAcomplish++
                    }
                }
                if(stepsToAcomplish == numberOfSteps){
                    const actualBigStep = order.emmiterData.perStatusStep + 1;
                    const totalNumberOfBigSteps = order.order.steps.length;
                    if(actualBigStep == totalNumberOfBigSteps){
                        manualStepOrder.order.status_principal = FINALIZADOS;
                        this.modifyOrdersClient.emit(MODIFY_ORDERS_QUEUE, order)
                        return;
                    }
                    else{
                        manualStepOrder.order.status_principal = order.order.steps[order.emmiterData.perStatusStep+1].statusPedido

                    }
                }
                this.modifyOrdersClient.emit(MODIFY_ORDERS_QUEUE, order)

            }
        }
    }

    private async ordersProcessor(order: ModifiedOrder){
        let manualStepOrder:ModifiedOrder = order

        const orderSteps: QueueSteps[] = order.order.steps

        for (let fQueueStepsIndex = 0; fQueueStepsIndex < orderSteps.length; fQueueStepsIndex++) {
            const queueStepsElement = orderSteps[fQueueStepsIndex];
            const queueStepsIndex: number = fQueueStepsIndex;
            const statusPedido: string = queueStepsElement.statusPedido;
            
            for (let fStepsIndex = 0; fStepsIndex < queueStepsElement.steps.length; fStepsIndex++) {
                const element = queueStepsElement.steps[fStepsIndex];
                const stepsIndex = fStepsIndex;
                if(element.done == false){
                    if(element.isManual == true){
                        manualStepOrder.emmiterData.stepNumber = stepsIndex;
                        manualStepOrder.emmiterData.perStatusStep = queueStepsIndex;
                        manualStepOrder.emmiterData.isDone = false;
                        manualStepOrder.emmiterData.queue = manualStepOrder.order.steps[queueStepsIndex].steps[stepsIndex].queue;
                        manualStepOrder.emmiterData.isNew = false;
                        this.cachingService.setData(manualStepOrder.order.pedido, manualStepOrder);
                        break;  
                    }
                    this.handleAutomaticTasks(order.order, queueStepsIndex, stepsIndex);
                    break;

                }
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
        if(orderToRetry.order.steps[orderToRetry.emmiterData.perStatusStep].steps[orderToRetry.emmiterData.stepNumber].isManual == true){
            this.sendToQueue(orderToRetry);
            return HandleManualTaskEnum.OK;
        }
        return HandleManualTaskEnum.NOTMANUALTASK;
    }

    private async handleAutomaticTasks(order:Order, perStatusStep: number, stepNumber: number){
        const emiterData: EmmiterData = new EmmiterData();
        emiterData.queue = order.steps[perStatusStep].steps[stepNumber].queue;
        emiterData.isNew = false;
        emiterData.isDone = false;
        emiterData.stepNumber = stepNumber;
        emiterData.perStatusStep = perStatusStep;
        
        const orderToSend: ModifiedOrder = new ModifiedOrder();
        orderToSend.order = order;
        orderToSend.emmiterData = emiterData;

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
            if(order.order.steps[order.emmiterData.perStatusStep].steps[order.emmiterData.stepNumber].isManual == false){
                this.sendToQueue(order)
            }
        })
    }
}