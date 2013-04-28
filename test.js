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

/*
test.prototype.goForward = function() {
	this.client.front(0.25);
	setTimeout(function(){this.client.stop()}.bind(this),1000);
}
*/

test.prototype.moveTo = function(e,n)
{
	var dNS = n, dEW = e;
	var precision = 500;
	var lastTime = this.latestData.time;

	var self = this;

	var accumulate = function() {
		var heading = self.latestData.magneto.heading.fusionUnwrapped * Math.PI/180;
		var v = self.latestData.demo.velocity;
		var dt = self.latestData.time - lastTime;
		lastTime = self.latestData.time;

		var east = v.x * Math.cos(heading)
			- v.y * Math.sin(heading);

		var north = v.x * Math.sin(heading)
			+ v.y * Math.cos(heading);

		console.log("We've moved "+north+"mm north, and "+east+"mm east");

		dEW -= east;
		dNS -= north;
	}

	var adjust = function() {
		var heading = self.latestData.magneto.heading.fusionUnwrapped * Math.PI/180;

		//set right speed
		var right = dEW * Math.cos(heading) -
			dNS * Math.sin(heading);
		var front = dEW * Math.sin(heading) +
			dNS * Math.cos(heading);

		if(right < 0)
			self.client.right(linearSpeed)
		else
			self.client.left(linearSpeed);

		if(front > 0)
			self.client.front(linearSpeed);
		else
			self.client.back(linearSpeed);
	}

	var tick = function() {
		accumulate();
		adjust();

		var dist = point_distance(dNS,dEW,0,0);
		console.log(dist+" to go");
		if(dist < precision)
		{
			console.log("We're here. Stopping");
			self.client.stop();
			clearInterval(tickInterval);
		}
	}

	var tickInterval = setInterval(tick.bind(this),50);

}

test.prototype.abort = function() {
	this.client.stop();
	this.client.land();
	process.exit();
}

exports.test = test;

function point_distance(x,y,a,b)
{
	return Math.sqrt(
		Math.pow(x-a,2) +
		Math.pow(y-b,2));
}
