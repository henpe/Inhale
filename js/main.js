var outputEl = document.getElementById('output');

var oldX = oldY = oldZ = 0;
var factor = 0.05;
var valuesArray = [],
	valuesSize = 50,
	smoothSize = 50,
	chartValues = new TimeSeries(),
	minZ,
	maxZ;

var chart = new SmoothieChart();
chart.addTimeSeries(chartValues, { strokeStyle: 'rgba(0, 255, 0, 1)', fillStyle: 'rgba(0, 255, 0, 0.2)', lineWidth: 4 });
chart.streamTo(document.getElementById("chart"), 500);	

var startTime = new Date().getTime(),
	restingValues = [],
	restingValue;


var distance_X = 0
var velocity_X = 0
var lastSampleTime = 0;


function update_acceleration_X (acceleration_X) {
    velocity_X = velocity_X + acceleration_X
    distance_X = distance_X + velocity_X
}

// To use the distance value just read the distance_X variable:
function get_distance_X_and_reset () {
    x = distance_X
    distance_X = 0
    return x
}

window.ondevicemotion = _.throttle(function(event) {  
	var runningTime = (new Date().getTime() - startTime) / 1000;
    var accelerationX = event.acceleration.x;
    var accelerationY = event.acceleration.y;
    var accelerationZ = event.acceleration.z;

    update_acceleration_X(accelerationZ);

    //var distance = runningTime * accelerationZ;
    var timeDelta = (new Date().getTime() - lastSampleTime) / 1000;
    var distance = (accelerationZ * 9.82 * timeDelta) + (accelerationZ * 9.82 * timeDelta * timeDelta) / 2;
    distance *= 1000;
    //var distance = 0.5 * accelerationZ * Math.pow(timeDelta, 2);

    // Calculate resting value
    if (runningTime <= 5) {
    	restingValues.push(accelerationZ);
    	restingValue = average(restingValues);
    }

    // Offset from rest value
    accelerationZ += restingValue;

    // Array used to average 
    valuesArray.push(accelerationZ);
    if (valuesArray.length > smoothSize) {
    	valuesArray.shift();
    }

    var smoothedValue = average(valuesArray);

    //smoothedValue *= 1000;

    /*outputEl.innerHTML = 'Smooth: ' + (smoothedValue)
    			       + '<br>Running Time: ' + runningTime
    			       + '<br>restingValue:' + restingValue 
    				   + '<br>Distance: ' + distance
    				   + '<br>Array size: ' + valuesArray.length;
    

    /*valuesArray.push(accelerationZ);
    if (valuesArray.length > valuesSize) {
    	valuesArray.shift();
    }*/

    minZ = _.min(valuesArray);
    maxZ = _.max(valuesArray);

    accelerationX = accelerationX * factor + oldX * (1 - factor);
    accelerationY = accelerationY * factor + oldY * (1 - factor);
    accelerationZ = accelerationZ * factor + oldZ * (1 - factor);

    oldX = accelerationX;
    oldY = accelerationY;
    oldZ = accelerationZ;

    audioFrequency = Math.abs(accelerationZ * 5000);

    outputEl.innerHTML = 'minZ:' + minZ 
    					 + '<br>maxZ:' + maxZ 
    					 + '<br>timeDelta:' + timeDelta
    					 + '<br>restingValue:' + restingValue
    					 + '<br>distance:' + distance
    					 + '<br>audioFrequency:' + audioFrequency 
    					 + '<br>Z:' + (accelerationZ);



    chartValues.append(new Date().getTime(), distance);
    lastSampleTime = new Date().getTime();
}, 10);


function average(arr) {
	return _.reduce(arr, function(memo, num) {
		return memo + num;
	}, 0) / arr.length;
}


function startAudio() {
	var glide = T("param", {value:880});
	var VCO = T("sin", {freq:glide, mul:2}).play();

	T("+sin", {freq:10}, api).play();

	setInterval(function() {
		//osc.frequency.value += 50;
		//VCO.freq.value = audioFrequency;
		glide.linTo(audioFrequency, '100ms')
	}, 10);


	/*
	var api = T("WebAudioAPI:recv");
	var context = api.context;

	var osc = context.createOscillator();
	osc.frequency.value = 280;
	osc.noteOn(0);

	api.recv(osc);

	T("+sin", {freq:0.5}, api).play();

	setInterval(function() {
		//osc.frequency.value += 50;
		osc.frequency.value = audioFrequency;
	}, 500);*/
}


// convertToRange(20,[10,50],[5,10]);
function convertToRange(value, srcRange, dstRange){
  // value is outside source range return
  if (value < srcRange[0] || value > srcRange[1]){
    return NaN; 
  }

  var srcMax = srcRange[1] - srcRange[0],
      dstMax = dstRange[1] - dstRange[0],
      adjValue = value - srcRange[0];

  return (adjValue * dstMax / srcMax) + dstRange[0];

}