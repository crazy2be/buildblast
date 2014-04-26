define(function (require) {
return function Stack(item, num) {
	this.item = item;
	this.num = num || 1;
	this.model = this.item.model();
}
});
