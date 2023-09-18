/**
 *  Some useful functions
 */
export class Tools {
	/**
	 * this function gets a HTML Dom and change its specific property
	 * @param elementRef
	 * @param property
	 * @param value
	 */
	public static changeViewChildStyle(
		elementRef: HTMLElement,
		property: string,
		value: string
	) {
		// @ts-ignore
		elementRef['style'][property] = value;
	}

// Methods
	public static capitalizeFirstWord(term: string): string {
		return term.charAt(0).toUpperCase() + term.slice(1);
	}

	public static snakeCaseToCapitalize(term: string): string {
		let words = term.split('_');
		// check for special case of Excel export schema generator
		words[0] = words[0] === 'qp' ?
				'qp' :
				(words[0].charAt(0).toUpperCase() + words[0].slice(1));
		return words.reduce((res, cur) => {
			return res + ' ' + cur.charAt(0).toUpperCase() + cur.slice(1);
		});
	}
	
}
