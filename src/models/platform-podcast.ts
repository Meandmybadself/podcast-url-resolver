import {Model, Column, Table, BelongsTo, ForeignKey, Unique} from 'sequelize-typescript';
import {Optional} from 'sequelize/types';
import Platform from './00-platform';
import CanonicalPodcast from './00-canonical-podcast';

interface IPlatformPodcast {
	id: number;
	platformId: number;
	canonicalPodcastId: number;
	platformPodcastId: string;
}

interface PlatformPodcastCreationAttributes extends Optional<IPlatformPodcast, 'id'> { }

@Table({
	paranoid: true
})
class PlatformPodcast extends Model<IPlatformPodcast, PlatformPodcastCreationAttributes> {
	@BelongsTo(() => Platform)
	platform!: Platform;

	@ForeignKey(() => Platform)
	platformId!: number;

	@BelongsTo(() => CanonicalPodcast)
	canonicalPodcast!: CanonicalPodcast;

	@ForeignKey(() => CanonicalPodcast)
	canonicalPodcastId!: number;

	@Unique
	@Column
	platformPodcastId!: string;
}

export default PlatformPodcast;
