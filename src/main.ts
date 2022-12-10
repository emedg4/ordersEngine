import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OrdersEngineService } from './microservices/ordersEngine/ordersEngine.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  const configService = app.get(ConfigService)
  const ordersEngineService = app.get<OrdersEngineService>(OrdersEngineService);

  app.connectMicroservice(ordersEngineService.getOptions(configService.get('rbmq.queue.toOrdersEngine')))

  await app.startAllMicroservices();


  
  await app.listen(3009);
}
bootstrap();
