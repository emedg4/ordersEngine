import { QueueSteps } from "./queueSteps.dto";

export class Order {
    
    pedido: string;

    fecha_creacion: string;

    metodo_pago: string;

    tienda: string;

    metodo_envio: string;

    cliente: string;

    vitrina: string;

    status_principal: string;

    status_pago: string;

    tenant: String;

    steps: QueueSteps[]


}