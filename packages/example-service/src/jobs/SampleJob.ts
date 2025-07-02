import { injectable } from "inversify";
import { JobOrchestrer } from "@job-orchestration/sdk";

@injectable()
export class SampleJob {
  public async execute(): Promise<void> {
    console.log("Primeiro log do Hello World!");

    return;
  }
}