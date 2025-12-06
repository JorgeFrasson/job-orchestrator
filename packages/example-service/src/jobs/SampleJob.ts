import { injectable } from "inversify";

@injectable()
export class SampleJob {
  private executionCount = 0;

  public async execute(payload?: any): Promise<void> {
    this.executionCount++;
    const timestamp = new Date().toISOString();
    
    console.log('='.repeat(60));
    console.log(`🚀 [${timestamp}] Sample Job Executado!`);
    console.log(`📊 Execução #${this.executionCount}`);
    
    if (payload) {
      console.log('📦 Payload recebido:', JSON.stringify(payload, null, 2));
    }
    
    // Simula processamento
    console.log('⚙️  Processando...');
    await this.simulateWork();
    
    console.log('✅ Job finalizado com sucesso!');
    console.log('='.repeat(60));
  }

  private async simulateWork(): Promise<void> {
    // Simula trabalho assíncrono (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}