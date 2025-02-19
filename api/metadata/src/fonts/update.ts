import { getOrUpdateMetadata } from '../fontlist/get';
import { FontMetadata, FontsourceMetadata } from '../types';
import { ArrayMetadata, FontVariants, IDResponse } from './types';

// This updates the main array of fonts dataset
const updateArrayMetadata = async (env: Env) => {
	const data = await getOrUpdateMetadata(env);

	// v1 Response
	const list: ArrayMetadata = [];

	for (const value of Object.values(data)) {
		list.push({
			id: value.id,
			family: value.family,
			subsets: value.subsets,
			weights: value.weights,
			styles: value.styles,
			defSubset: value.defSubset,
			variable: value.variable ? true : false,
			lastModified: value.lastModified,
			category: value.category,
			license: value.license.type,
			type: value.type,
		});
	}

	// Store the list in KV
	await env.FONTLIST.put('metadata_arr', JSON.stringify(list));
	return list;
};

const generateFontVariants = ({
	id,
	subsets,
	weights,
	styles,
}: FontMetadata): FontVariants => {
	const variants: FontVariants = {};

	for (const weight of weights) {
		variants[weight] = variants[weight] || {};

		for (const style of styles) {
			variants[weight][style] = variants[weight][style] || {};

			for (const subset of subsets) {
				variants[weight][style][subset] = {
					url: {
						woff2: `https://api.fontsource.org/v1/fonts/${id}/${subset}-${weight}-${style}.woff2`,
						woff: `https://api.fontsource.org/v1/fonts/${id}/${subset}-${weight}-${style}.woff`,
						ttf: `https://api.fontsource.org/v1/fonts/${id}/${subset}-${weight}-${style}.ttf`,
					},
				};
			}
		}
	}

	return variants;
};

const updateId = async (
	id: string,
	env: Env
): Promise<IDResponse | undefined> => {
	const data = await getOrUpdateMetadata(env);

	if (!data[id]) {
		return;
	}

	const value: IDResponse = {
		id: data[id].id,
		family: data[id].family,
		subsets: data[id].subsets,
		weights: data[id].weights,
		styles: data[id].styles,
		defSubset: data[id].defSubset,
		variable: data[id].variable ? true : false,
		lastModified: data[id].lastModified,
		category: data[id].category,
		license: data[id].license.type,
		type: data[id].type,
		unicodeRange: data[id].unicodeRange,
		variants: generateFontVariants(data[id]),
	};

	// Store the list in KV
	await env.FONTS.put(id, JSON.stringify(value));
	return value;
};

export { updateArrayMetadata, updateId };
