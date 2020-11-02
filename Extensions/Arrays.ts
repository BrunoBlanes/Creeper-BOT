declare global {
	interface Array<T> {
		/**
		 * Appends new item to an array if not a duplicate of an already existing item, and returns the new length of the array.
		 * @param {T} item
		 */
		skipDuplicatePush(item: T): number;

		/** Returns the last item of the array. */
		last(): T;

		/** Returns the first item of the array. */
		first(): T;
	}
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

Array.prototype.last = function (): any {
	return this[this.length - 1];
};

Array.prototype.first = function (): any {
	return this[0];
};

export { };