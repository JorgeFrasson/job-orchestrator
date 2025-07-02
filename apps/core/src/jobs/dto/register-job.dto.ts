export class RegisterJobDto {
  service: string;
  topic: string;
  config: {
    cron?: string;
    dependsOn?: string[];
    manual?: boolean;
  };
}