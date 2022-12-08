import { DynamicModule, Module } from '@nestjs/common';
import { UnpaidOrderMicroserviceService } from './unpaidOrders.service';
import { ClientsModule, Transport } from '@nestjs/microservices'
import { ConfigService } from '@nestjs/config'

interface RmqModuleOptions {
  name: string
}

@Module({
  providers: [UnpaidOrderMicroserviceService],
  exports: [UnpaidOrderMicroserviceService]
})
export class UnpaidOrderMicroserviceModule {
  static register({ name }: RmqModuleOptions ): DynamicModule {
    return {
      module: UnpaidOrderMicroserviceModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            useFactory: (configService: ConfigService) => ({
              transport: Transport.RMQ,
              options: {
                urls: [configService.get<string>('rbmq.url')],
                queue: configService.get<string>('rbmq.queue.unpaidOrders')
              },
            }),
            inject: [ConfigService]
          }
        ])
      ],
      exports: [ClientsModule]
    }
  }
}
