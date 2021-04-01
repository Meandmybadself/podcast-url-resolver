/* eslint-disable @typescript-eslint/no-extraneous-class */

import {find, keyBy} from 'lodash';
import {IPlatform} from '../interfaces';
import Platform from '../models/00-platform';

class PlatformData {
	static _platforms: Record<string, IPlatform>;

	static async getPlatformById(id: string): Promise<IPlatform | null> {
		return (await PlatformData.getPlatforms())[id];
	}

	static async getPlatformByDBId(id: number): Promise<IPlatform | null> {
		return find((await PlatformData.getPlatforms()), {id});
	}

	// Should only hit DB once.
	static async getPlatforms(): Promise<Record<string, IPlatform>> {
		if (!PlatformData._platforms) {
			PlatformData._platforms = keyBy((await Platform.findAll({
				attributes: ['id', 'name', 'platformId']
			})).map(element => element.get({plain: true})), 'platformId');
		}

		return PlatformData._platforms;
	}
}

export default PlatformData;
