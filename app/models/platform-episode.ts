import {Model, Column, Table, Index, Default, BelongsTo} from 'sequelize-typescript';
import {Episode} from './Episode';
import {Platform} from './Platform';

@Table({
	timestamps: true
})
export class PlatformEpisode extends Model<PlatformEpisode> {
	@BelongsTo(() => Episode)
	episode!: Episode;

	@BelongsTo(() => Platform)
	platform!: Platform;

	@Column
	id!: string;

	@Column
	@Index
	@Default(false)
	isDeleted!: boolean;
}
