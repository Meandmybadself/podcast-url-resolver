import {Model, Column, Table, Index, Default, BelongsTo} from 'sequelize-typescript';
import {Platform} from './Platform';
import {Podcast} from './Podcast';

@Table({
	timestamps: true
})
export class PlatformPodcast extends Model<PlatformPodcast> {
	@BelongsTo(() => Platform)
	platform!: Platform;

	@BelongsTo(() => Podcast)
	podcast!: Podcast;

	@Column
	id!: string;

	@Column
	@Index
	@Default(false)
	isDeleted!: boolean;
}
