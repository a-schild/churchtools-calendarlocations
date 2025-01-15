const originalWarn = console.warn;

console.warn = function(...args) {

    if (!args.some(arg => typeof arg === 'string' && !arg.includes('Trying transparent relogin with login token'))) {
		// Only supress this warning
        originalWarn.apply(this, args);
    } else {
		console.debug(args);
	}
}
