import { injectable } from "inversify";

@injectable()
export class SecondJob {
  private executionCount = 0;

  public async execute(payload?: any): Promise<void> {
    console.log("TESTANTO JOB NOVAMENTE PARA VALIDAR QUE O CORE FUNCINA!!");
    console.log("TESTANTO JOB NOVAMENTE PARA VALIDAR QUE O CORE FUNCINA!!");
    console.log("TESTANTO JOB NOVAMENTE PARA VALIDAR QUE O CORE FUNCINA!!");
  }

  private async simulateWork(): Promise<void> {
    // Simula trabalho assíncrono (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}