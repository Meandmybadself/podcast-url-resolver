import {Model, Column, Table, BelongsTo, Index, Default} from 'sequelize-typescript';
import {Podcast} from './podcast';

@Table({
	timestamps: true
})
export class Episode extends Model<Episode> {
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

	@Column
	@Index
	@Default(false)
	isDeleted!: boolean;
}
