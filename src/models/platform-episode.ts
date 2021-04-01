import {Model, Column, Table, BelongsTo, ForeignKey} from 'sequelize-typescript';
import Episode from './00-episode';
import Platform from './00-platform';

@Table({
	timestamps: true,
	paranoid: true
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
}
export default PlatformEpisode;
