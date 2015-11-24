/**
 * @author richt / http://richt.me
 * @author WestLangley / http://github.com/WestLangley
 *
 * W3C Device Orientation control (http://w3c.github.io/deviceorientation/spec-source-orientation.html)
 */

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