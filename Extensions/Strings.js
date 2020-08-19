String.prototype.addTo = function (index, string) {
    return this.slice(0, index) + string + this.slice(index);
};
String.prototype.remove = function (start, end) {
    if (end)
        return this.slice(0, start) + this.slice(end);
    return this.slice(0, start);
};
String.prototype.indexOf = function (searchString, start, end) {
    if (!start && !end)
        return this.indexOf(searchString);
    else if (start && !end)
        return this.indexOf(searchString, start);
    else if (!start && end)
        return this.substring(0, end).indexOf(searchString);
    else
        return this.substring(start, end).indexOf(searchString);
};
//# sourceMappingURL=Strings.js.map