import {Model, Column, Table, HasMany, Default, Index, AllowNull} from 'sequelize-typescript';
import {Optional, DataTypes} from 'sequelize';

import CanonicalEpisode from './00-canonical-episode';
import {ICanonicalPodcast} from '../interfaces';

interface PodcastCreationAttributes extends Optional<ICanonicalPodcast, 'id'> { }

@Table({
	paranoid: true
})
class CanonicalPodcast extends Model<ICanonicalPodcast, PodcastCreationAttributes> {
	@Column
	title!: string;

	@Column
	searchTitle!: string;

	@Column({
		type: DataTypes.TEXT
	})
	description: string;

	@Column
	language: string;

	@Index
	@Column({
		type: DataTypes.TEXT
	})
	feedURL: string;

	@Column
	explicit: boolean;

	@AllowNull
	@Column
	copyright?: string;

	@Column({
		type: DataTypes.TEXT
	})
	artworkURL: string;

	@Column
	author: string;

	@Column
	ownerName: string;

	@Column
	ownerEmail: string;

	@Column
	link: string;

	@Column
	updated: Date;

	@AllowNull
	@Column
	type: string;

	@HasMany(() => CanonicalEpisode)
	episodes: CanonicalEpisode[];

	@Default(Date.now())
	@Column
	lastChecked: Date;
}

export default CanonicalPodcast;
