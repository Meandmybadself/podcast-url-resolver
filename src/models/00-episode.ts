import {Model, Column, Table, BelongsTo, Index, Default, ForeignKey} from 'sequelize-typescript';
import Podcast from './00-podcast';

@Table({
	timestamps: true
})
class Episode extends Model<Episode> {
	@Column
	title!: string;

	@BelongsTo(() => Podcast)
	podcast!: Podcast;

	@Column
	description: string;

	@Column
	guid: string;

	@Column
	runtime: number;

	@Column
	urlTemplateString!: string;

	@Column
	artworkURL: string;

	@Column
	publishedAt: Date;

	@Index
	@Default(false)
	@Column
	isDeleted!: boolean;

	@ForeignKey(() => Podcast)
	podcastId: number;
}
export default Episode;
