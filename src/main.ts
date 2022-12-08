import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OrderLifeCycleServiceMS } from './microservices/orderLifeCycle/orderLifeCycle.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  const configService = app.get(ConfigService)
  const orderLifeCycleServiceMS = app.get<OrderLifeCycleServiceMS>(OrderLifeCycleServiceMS);

  app.connectMicroservice(orderLifeCycleServiceMS.getOptions(configService.get('rbmq.queue.toOrdersEngine')))

  await app.startAllMicroservices();


  
  await app.listen(3000);
}
bootstrap();
