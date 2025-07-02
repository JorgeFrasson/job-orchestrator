import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Job } from './job.model';

@Table({ tableName: 'job_configs', timestamps: false })
export class JobConfig extends Model<JobConfig> {
  @Column(DataType.STRING)
  cron: string;

  @Column(DataType.JSONB)
  dependsOn: string[];

  @Column(DataType.INTEGER)
  retries: number;

  @ForeignKey(() => Job)
  @Column
  jobId: number;
}
