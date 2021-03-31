import {Model, Column, Table, Index, Default, BelongsTo, ForeignKey} from 'sequelize-typescript';
import Platform from './00-platform';
import Podcast from './00-podcast';

@Table({
	timestamps: true
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

	@Index
	@Default(false)
	@Column
	isDeleted!: boolean;
}

export default PlatformPodcast;
