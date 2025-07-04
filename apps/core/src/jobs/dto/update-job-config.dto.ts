export class UpdateJobConfigDto {
  cron?: string;
  dependsOn?: string[];
  retries?: number;
}
