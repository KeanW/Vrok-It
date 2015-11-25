
(function(global) {
	function NoSleep() {};
	NoSleep.prototype.enable = function() {};
	NoSleep.prototype.disable = function() {};
	global.NoSleep = NoSleep;
})(this);

THREE.DeviceOrientationControls = function () {
	this.connect = function() {};
	this.update = function() { return null };
	this.disconnect = function() {};
};

VideoHelper = function () {
	this.start = function() {};
	this.isStarted = function() { return false };
	this.stop = function() {};
};