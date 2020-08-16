interface Array<T> {
	/**
	 * Appends new item to an array if not a duplicate of an already existing item, and returns the new length of the array.
	 * @param {T} item
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
	 * Changes the content of a string by adding new characters.
	 * @this {String}
	 * @param {number} index Index at which to add the substring.
	 * @param {string} string The String that is spliced in.
	 * @return {string} A new string with the substring added in.
	 */
	addTo(index: number, string: string): string;

	/**
	 * Changes the content of a string by removing characters.
	 * @param {number} start Index at which to start removing characters.
	 * @param {number} end Index at which to stop removing characters.
	 * Note: If ommited, will delete all characters until the end of the string.
	 */
	remove(start: number, end?: number): string;
}

String.prototype.addTo = function (index: number, string: string): string {
	return this.slice(0, index) + string + this.slice(index);
};

String.prototype.remove = function (start: number, end?: number): string {
	if (end) return this.slice(0, start) + this.slice(end);
	return this.slice(0, start);
};