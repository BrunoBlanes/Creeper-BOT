interface Array<T> {
	/**
	 * Appends new item to an array if not a duplicate of an already existing item, and returns the new length of the array.
	 * @param item
	 */
	skipDuplicatePush(item: T): number;
}

Array.prototype.skipDuplicatePush = function (item): number {
	// Add item to array when empty
	if (this.length === 0) {
		return this.push(item);
	} else {
		for (var k = 0; k < this.length; k++) {

			// Don't add if already added before
			if (this[k] === item) {
				return this.length;
			} else if (k === this.length - 1) {
				return this.push(item);
			}
		}
	}
};

interface String {
    /**
	 * The splice() method changes the content of a string by removing a range of
	 * characters and/or adding new characters.
	 *
	 * @this {String}
	 * @param {number} index Index at which to start changing the string.
	 * @param {string} string The String that is spliced in.
	 * @return {string} A new string with the spliced substring.
	 */
	addTo(index: number, string: string): string;
}

String.prototype.addTo = function (index: number, string: string): string {
	return this.slice(0, index) + string + this.slice(index);
}