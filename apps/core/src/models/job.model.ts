import { Table, Column, Model, DataType, HasOne } from 'sequelize-typescript';
import { JobConfig } from './job-config.model';

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
  topic: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  service: string;

  @HasOne(() => JobConfig)
  config: JobConfig;
}
