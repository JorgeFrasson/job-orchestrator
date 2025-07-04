import { Table, Column, Model, DataType, ForeignKey } from 'sequelize-typescript';
import { Job } from './job.model';

@Table({ tableName: 'job_configs', timestamps: false })
export class JobConfig extends Model<JobConfig> {
  @Column({ type: DataType.STRING, allowNull: true })
  cron?: string | null;

  @Column({ type: DataType.JSONB, allowNull: true })
  dependsOn?: string[] | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  retries?: number | null;

  @ForeignKey(() => Job)
  @Column
  jobId: number;
}
