var arDrone = require('ar-drone');
var rotationalSpeed = 0.5;
var linearSpeed = 0.25;

function test() {

	this.client = arDrone.createClient();

	this.latestData = null;
	//client.createRepl();
	control = arDrone.createUdpControl();
	setInterval(function() {
		control.flush();
	}, 30);
	this.client.config('general:navdata_demo', 'FALSE');

	this.client.on('navdata', this.gotNavData.bind(this));

	this.data = "";

	setInterval(this.logData.bind(this),500);

	process.on('SIGINT', function() {
		console.log('quit')
	});
}

test.prototype.logData = function() {
	this.data+=',\n'+JSON.stringify(this.latestData);
}

test.prototype.gotNavData = function(n) {
	this.latestData = n;
}

var interval = null;

test.prototype.stopAtSouth = function() {
	var heading = this.latestData.magneto.heading.fusionUnwrapped;

	console.log(heading);

	if(Math.abs(heading) < 25)
	{
		console.log("Stopping");
		this.client.stop();
		clearInterval(interval);
		this.client.land();
	}
}

test.prototype.quit = function() {
	this.client.land();
	fs.writeFile('logfile',this.data);
}

test.prototype.faceSouth = function(n) {
	if(this.latestData.magneto.heading.fusionUnwrapped < -25) {
		console.log("Turn clockwise");
		this.client.clockwise(0.5);
	}
	else {
		console.log("Turn counterclockwise");
		this.client.counterClockwise(0.5);
	}
	interval = setInterval(this.stopAtSouth.bind(this),100);
}

test.prototype.goForward = function() {
	this.client.front(0.25);
	setTimeout(function(){this.client.stop()}.bind(this),1000);
}

exports.test = test;
