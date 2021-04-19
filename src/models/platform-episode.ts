import {Model, Column, Table, BelongsTo, ForeignKey, Index, NotNull} from 'sequelize-typescript';
import {Optional} from 'sequelize';
import CanonicalEpisode from './00-canonical-episode';
import Platform from './00-platform';
import CanonicalPodcast from './00-canonical-podcast';

interface PlatformEpisodeAttributes {
	id: number;
	episodeId: number;
	podcastId: number;
	platformId: number;
	platformEpisodeId: string;
}

interface PlatformEpisodeCreationAttributes extends Optional<PlatformEpisodeAttributes, 'id'> { }

@Table({
	paranoid: true
})
class PlatformEpisode extends Model<PlatformEpisodeAttributes, PlatformEpisodeCreationAttributes> {
	@BelongsTo(() => CanonicalEpisode)
	episode!: CanonicalEpisode;

	@ForeignKey(() => CanonicalEpisode)
	episodeId: number;

	// This is necessary for the platforms that don't have notions of podcasts (overcast)
	@BelongsTo(() => CanonicalPodcast)
	podcast!: CanonicalPodcast;

	@ForeignKey(() => CanonicalPodcast)
	podcastId!: number;

	@BelongsTo(() => Platform)
	platform!: Platform;

	@ForeignKey(() => Platform)
	platformId!: number;

	@Column
	@Index
	platformEpisodeId!: string;
}
export default PlatformEpisode;
