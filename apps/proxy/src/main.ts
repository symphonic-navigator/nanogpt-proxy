import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { EnvironmentService } from "../../../packages/core/src/environment/environment.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const environmentService = app.get(EnvironmentService);

  await app.listen(environmentService.proxyPort);
}
bootstrap();
