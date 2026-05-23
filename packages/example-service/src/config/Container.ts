import { Container, AsyncContainerModule } from 'inversify';
import TYPES from './Types';
import { SampleJob } from '../jobs/SampleJob';
import { SecondJob } from '../jobs/SecondJob';

const container = new Container();

// Função assíncrona para configurar bindings
export const bindings = new AsyncContainerModule(async (bind) => {
  bind(TYPES.SampleJob).to(SampleJob).inSingletonScope();
  bind(TYPES.SecondJob).to(SecondJob).inSingletonScope();

  // Aqui você pode fazer awaits (ex: conexão com Redis, etc.)
});
