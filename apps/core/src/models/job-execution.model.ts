import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Job } from './job.model';

export type JobExecutionStatus = 'running' | 'succeeded' | 'failed';

@Table({ tableName: 'job_executions', timestamps: true })
export class JobExecution extends Model<JobExecution> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare executionId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare status: JobExecutionStatus;

  @Column(DataType.JSONB)
  declare triggerPayload: unknown;

  @Column(DataType.JSONB)
  declare lifecyclePayload: unknown;

  @Column(DataType.DATE)
  declare startedAt: Date | null;

  @Column(DataType.DATE)
  declare finishedAt: Date | null;

  @Column(DataType.TEXT)
  declare errorMessage: string | null;

  @ForeignKey(() => Job)
  @Column({
    allowNull: false,
  })
  declare jobId: number;

  @BelongsTo(() => Job)
  declare job: Job;
}
