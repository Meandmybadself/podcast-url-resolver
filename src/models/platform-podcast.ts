import {Model, Column, Table, BelongsTo, ForeignKey} from 'sequelize-typescript';
import Platform from './00-platform';
import Podcast from './00-podcast';

@Table({
	timestamps: true,
	paranoid: true
})
class PlatformPodcast extends Model<PlatformPodcast> {
	@BelongsTo(() => Platform)
	platform!: Platform;

	@ForeignKey(() => Platform)
	platformId!: number;

	@BelongsTo(() => Podcast)
	podcast!: Podcast;

	@ForeignKey(() => Podcast)
	podcastId!: number;

	@Column
	platformPodcastId!: string;
}

export default PlatformPodcast;
