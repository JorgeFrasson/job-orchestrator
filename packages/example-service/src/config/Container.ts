import { Container, AsyncContainerModule } from 'inversify';
import TYPES from './Types';
import { SampleJob } from '../jobs/SampleJob';

const container = new Container();

// Função assíncrona para configurar bindings
export const bindings = new AsyncContainerModule(async (bind) => {
  bind(TYPES.SampleJob).to(SampleJob).inSingletonScope();

  // Aqui você pode fazer awaits (ex: conexão com Redis, etc.)
});