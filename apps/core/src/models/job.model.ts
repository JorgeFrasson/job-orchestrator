import { Table, Column, Model, DataType, HasMany, HasOne } from 'sequelize-typescript';
import { JobConfig } from './job-config.model';
import { JobExecution } from './job-execution.model';

@Table({ tableName: 'jobs', timestamps: true })
export class Job extends Model<Job> {
  /**
   * The unique topic name for this job.
   * This is what other services will use to identify and call this job.
   */
  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  declare topic: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare service: string;

  @HasOne(() => JobConfig)
  declare config: JobConfig;

  @HasMany(() => JobExecution)
  declare executions: JobExecution[];
}
