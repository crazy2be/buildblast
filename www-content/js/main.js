$(document).foundation({
	abide: {
		patterns: {
			anything: /^.*$/,
			username: /^[a-zA-Z0-9]{3,}$/,
			password: /^(.){6,}$/,
			email: /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
		}
	}
});
$(document).ready(function() {
	$("#signUpButton").click(function() {
		$("#signUpForm").submit();
	});

	$("#loginButton").click(function() {
		$("#loginForm").submit();
	});
});