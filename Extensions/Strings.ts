declare global {
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

		/**
		 * Returns the position of the first occurance of a substring.
		 * @param searchString The substring to search for in the string.
		 * @param start The index at which to begin searching the String object. If omitted, search starts at the beginning of the string.
		 * @param end The index at which to stop searching the String object. If omitted, search happens to the end of the string.
		 */
		lookup(searchString: string, start?: number, end?: number): number;
	}
}

String.prototype.addTo = function (index: number, string: string): string {
	return this.slice(0, index) + string + this.slice(index);
};

String.prototype.remove = function (start: number, end?: number): string {
	if (end != null) return this.slice(0, start) + this.slice(end);
	return this.slice(0, start);
};

String.prototype.lookup = function (searchString: string, start?: number, end?: number) {
	if (start == null && end == null) return this.indexOf(searchString);
	else if (start != null && end == null) return this.indexOf(searchString, start);
	else if (start == null && end != null) return this.substring(0, end).indexOf(searchString);
	else return this.substring(start, end).indexOf(searchString);
};

export { };