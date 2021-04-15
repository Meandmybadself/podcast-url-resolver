import {Model, Column, Table, BelongsTo, ForeignKey, Unique} from 'sequelize-typescript';
import {Optional} from 'sequelize/types';
import CanonicalEpisode from './00-canonical-episode';
import Platform from './00-platform';

interface PlatformEpisodeURLAttributes {
	id: number;
	episodeId: number;
	platformId: number;
	platformEpisodeURL: string;
}

interface PlatformEpisodeURLCreationAttributes extends Optional<PlatformEpisodeURLAttributes, 'id'> { }

@Table({
	timestamps: true,
	paranoid: true
})
class PlatformEpisodeURL extends Model<PlatformEpisodeURLAttributes, PlatformEpisodeURLCreationAttributes> {
	@Unique
	@Column
	platformEpisodeURL!: string;

	@BelongsTo(() => CanonicalEpisode)
	episode!: CanonicalEpisode;

	@ForeignKey(() => CanonicalEpisode)
	episodeId: number;

	@BelongsTo(() => Platform)
	platform!: Platform;

	@ForeignKey(() => Platform)
	platformId!: number;
}
export default PlatformEpisodeURL;
