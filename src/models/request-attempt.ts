import moment from "moment";
import {
  AfterCreate,
  BelongsTo,
  Column,
  Default,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { Optional } from "sequelize/types";
import User from "./user";

interface IRequestAttempt {
  id?: number;
  userId: number;
  day?: string;
  count?: number;
  createdAt?: Date;
  deletedAt?: Date;
}

type RequestCreationAttributes = Optional<IRequestAttempt, "id">;

@Table
class RequestAttempt extends Model<IRequestAttempt, RequestCreationAttributes> {
  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => User)
  @Column
  declare userId: number;

  @Default(() => moment().format("YYYYMMDD"))
  @Column
  declare day: string;

  @Default(1)
  @Column
  declare count: number;

  @AfterCreate
  static async cleanup(): Promise<void> {
    // Nuke any request older than 1 day old.
    await RequestAttempt.destroy({
      where: {
        createdAt: {
          $lte: moment().subtract(1, "days").toDate(),
        },
      },
    });
  }
}

export default RequestAttempt;
