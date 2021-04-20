import {Model, Column, Table, BelongsTo, Default, ForeignKey, AllowNull} from 'sequelize-typescript';
import {DataTypes, Optional} from 'sequelize';
import CanonicalPodcast from './00-canonical-podcast';
import {ICanonicalEpisode} from '../interfaces';

interface EpisodeCreationAttributes extends Optional<ICanonicalEpisode, 'id'> { }

@Table({
	paranoid: true
})
class CanonicalEpisode extends Model<ICanonicalEpisode, EpisodeCreationAttributes> {
	@Column
	title!: string;

	@Column
	searchTitle!: string;

	@BelongsTo(() => CanonicalPodcast)
	canonicalPodcast: CanonicalPodcast;

	@ForeignKey(() => CanonicalPodcast)
	canonicalPodcastId: number;

	@Column({
		type: DataTypes.TEXT
	})
	description!: string;

	@Column
	guid: string;

	@Default(-1)
	@Column
	duration: number;

	@AllowNull
	@Column({
		type: DataTypes.TEXT
	})
	artworkURL?: string;

	@Column
	publishDate: Date;

	@Column
	episodeType?: string;

	@Column({
		type: DataTypes.TEXT
	})
	enclosureURL?: string;
}
export default CanonicalEpisode;
