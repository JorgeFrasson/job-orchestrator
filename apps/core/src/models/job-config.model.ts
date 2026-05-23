import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Job } from './job.model';

@Table({ tableName: 'job_configs', timestamps: false })
export class JobConfig extends Model<JobConfig> {
  @Column(DataType.STRING)
  declare cron: string;

  @Column(DataType.JSONB)
  declare dependsOn: string[];

  @Column(DataType.INTEGER)
  declare retries: number;

  @Column(DataType.INTEGER)
  declare timeout: number;

  @Column(DataType.JSONB)
  declare integrations: unknown[];

  @ForeignKey(() => Job)
  @Column({
    unique: true,
  })
  declare jobId: number;
}
