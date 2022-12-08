import { Injectable } from '@nestjs/common';
import { RmqOptions, Transport, RmqContext } from "@nestjs/microservices"
import { ConfigService } from '@nestjs/config';


@Injectable()
export class ModifyOrderMicroserviceService {
    constructor(private readonly configService: ConfigService){}
    getOptions(queue: string, noAck = false): RmqOptions {
        return {
            transport: Transport.RMQ,
            options: {
                urls: [this.configService.get<string>('rbmq.url')],
                queue: queue,
                noAck,
                persistent: true

            }

        }
    }

    ack(context: RmqContext){
        const channel = context.getChannelRef();
        const originalMessage = context.getMessage();
        channel.ack(originalMessage)

    }
}
