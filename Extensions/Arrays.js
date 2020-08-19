Array.prototype.skipDuplicatePush = function (item) {
    // Add item to array when empty
    if (this.length === 0) {
        return this.push(item);
    }
    else {
        for (var k = 0; k < this.length; k++) {
            // Don't add if already added before
            if (this[k] === item) {
                return this.length;
            }
            else if (k === this.length - 1) {
                return this.push(item);
            }
        }
    }
};
Array.prototype.last = function () {
    return this[this.length - 1];
};
//# sourceMappingURL=Arrays.js.map