define(function () {
	//Basically just ripping off functions in from C#. Every function should be
	//named the same and have the same behaviour (except for undefined/null checking).
	//http://msdn.microsoft.com/en-us/library/system.string.aspx

	//self in all cases should be a string,
	//or null/undefined in some cases where that makes sense.

	function startsWith(self, value) {
		if (!self) return false;
		if (self.length < value.length) return false;
		return self.substring(0, value.length) === value;
	}

	//Takes a string as an argument instead of char[]
	function trimStart(self, value) {
		if (!self) return;
		if (self.length < value.length) return;
		if (!startsWith(self, value)) return;

		return self.substring(0, value.length);
	}

	return {
		trimStart: trimStart,
		startsWith: startsWith
	};
});