import {Model, Column, Table, BelongsTo, Default, ForeignKey} from 'sequelize-typescript';
import Podcast from './00-podcast';

@Table({
	timestamps: true,
	paranoid: true
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

	@Default(-1)
	@Column
	runtime: number;

	@Column
	urlTemplateString!: string;

	@Column
	artworkURL: string;

	@Column
	publishedAt: Date;

	@ForeignKey(() => Podcast)
	podcastId: number;
}
export default Episode;
