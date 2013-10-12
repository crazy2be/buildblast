define(function (require) {
return function Stack(item, num) {
	this.item = item;
	this.num = num || 1;
	var model = this.item.model();
	this.model = model ? model.clone() : null;
}
});
