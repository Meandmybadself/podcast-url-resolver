import {Model, Column, Table, Index, Default, BelongsTo, ForeignKey} from 'sequelize-typescript';
import Episode from './00-episode';
import Platform from './00-platform';

@Table({
	timestamps: true
})
class PlatformEpisode extends Model<PlatformEpisode> {
	@BelongsTo(() => Episode)
	episode!: Episode;

	@ForeignKey(() => Episode)
	episodeId: number;

	@BelongsTo(() => Platform)
	platform!: Platform;

	@ForeignKey(() => Platform)
	platformId!: number;

	@Column
	platformEpisodeId!: string;

	@Index
	@Default(false)
	@Column
	isDeleted!: boolean;
}
export default PlatformEpisode;
