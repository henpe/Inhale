vz = z = 0;
var app = {

    appRunning: false,
    restingValue: 0,
    restingValues: [],
    oldZ: 0,

    deviceMotionEvent: {
        acceleration : { x: 0, y: 0, z: 0} // just some defaults
    },

    init: function() {

        var self = this;

        self.$startButtonEl = $('.btn-start');

        self.$startButtonEl.on('click', function() {
            window.ondevicemotion = function(event) {
                self.deviceMotionEvent = event;
            };
            self.setupChart();
            self.startAudio();
            self.startTime = new Date().getTime();

            self.handleMotion();

            self.appRunning = true;
            $(this).hide();

            setInterval(function() {
                self.updateChart();
            }, 250);
        });

        this.buttonBreathe();
    },

    buttonBreathe: function() {
        // This makes the Start button 'breathe' on startup
        // Thanks to http://sean.voisen.org/blog/2011/10/breathing-led-with-arduino/

        if (this.appRunning) return; // No need to do this anymore

        var now = new Date().getTime(),
            breathingValue = (Math.exp(Math.sin(now/2000.0*Math.PI)) - 0.36787944)*108.0,
            opacity = (breathingValue/255) * 1;

        this.$startButtonEl.css('opacity', opacity);
        requestAnimationFrame(function() {
            app.buttonBreathe();
        });
    },

    setupChart: function() {
        var chart = new SmoothieChart({
                grid:{
                    fillStyle:'transparent',
                    strokeStyle:'transparent',
                    borderVisible:false
                },
                labels:{disabled:true}
            }),
            guideChart = new SmoothieChart({
                minValue: -1,
                maxValue: 1,
                grid:{
                    fillStyle:'transparent',
                    strokeStyle:'transparent',
                    borderVisible:false
                },
                labels:{disabled:true}
            }),
            canvas = document.getElementById('chart'),
            guideCanvas = document.getElementById('guide-chart');

        this.chartSeries = new TimeSeries();
        this.guideChartSeries = new TimeSeries();

        chart.addTimeSeries(this.chartSeries, {lineWidth:3.3});
        chart.streamTo(canvas, 100);

        guideChart.addTimeSeries(this.guideChartSeries, {lineWidth:2.3, strokeStyle: 'rgba(255,255,255,0.2)'});
        guideChart.streamTo(guideCanvas, 100);
    },

    handleMotion: function() {

        var smoothingFactor = 0.01;
        var accelerationZ = (app.deviceMotionEvent.acceleration.z * 100);

        this.runningTime = (new Date().getTime() - app.startTime) / 1000;

        // Calculate resting value
        if (this.runningTime <= 5) {
            app.restingValues.push(accelerationZ);
            app.restingValue = app.average(app.restingValues);
        }

        // Offset from rest value
        //accelerationZ += app.restingValue;

        accelerationZ = accelerationZ * smoothingFactor + app.oldZ * (1 - smoothingFactor);
        vz = vz + accelerationZ;
        vz = vz * 0.98;
        z = parseInt(z + vz / 25);

        var diff = Math.abs(accelerationZ) - Math.abs(app.oldZ),
            direction = (Math.round(accelerationZ > app.oldZ)) ? 'up' : 'down';

        //document.getElementById('output').innerHTML = Math.round(accelerationZ) + ' ' + direction;
        if (Math.abs(diff) > 0.5) {

            //var audioFrequency = 100 + (diff * 400); //Math.abs(accelerationZ * 10);
            var highDiff = diff * 100,
                audioFrequency = convertToRange(highDiff, [-300, 300], [50, 300]);

            app.setAudioFrequency(audioFrequency);

            //document.getElementById('output').innerHTML = audioFrequency;
        } else {
            //document.getElementById('output').innerHTML = '';
        }
        /*document.getElementById('output').innerHTML = + '<br>restingValue:' + app.restingValue
                             + '<br>audioFrequency:' + audioFrequency
                             + '<br>Z:' + (accelerationZ);*/


        var now = new Date().getTime();
        //app.chartSeries.append(now, accelerationZ);
        //app.guideChartSeries.append(now, Math.sin(runningTime));

        app.oldZ = accelerationZ;

        requestAnimationFrame(function() {
            app.handleMotion();
        });
    },

    updateChart: function() {
        var now = new Date().getTime();
        this.chartSeries.append(now, this.oldZ);
        this.guideChartSeries.append(now, Math.sin(this.runningTime));
    },


    startAudio: function() {
        this.glide = T("param", {value:800});
        this.audio = T("lpf", {cutoff:this.glide, Q:5}, T("noise", {mul:6})).play();

        /*var self = this;
        var cutoff = 800;
        setInterval(function() {
            if (self.audio.cutoff == 1000) {
                cutoff = 400;
            }
            cutoff += 100;
            //self.audio.cutoff += 100;
            self.glide.linTo(cutoff, '100ms');
        }, 1000);*/
    },

    setAudioFrequency: function(freq) {
        this.glide.linTo(freq, '100ms');
        //this.audio.freq = freq;
    },

    average: function(arr) {
        return _.reduce(arr, function(memo, num) {
            return memo + num;
        }, 0) / arr.length;
    }

};

function convertToRange(value, srcRange, dstRange){
  // value is outside source range return
  if (value < srcRange[0]) { return dstRange[0]; }
  if (value > srcRange[1]) { return dstRange[1]; }

  var srcMax = srcRange[1] - srcRange[0],
      dstMax = dstRange[1] - dstRange[0],
      adjValue = value - srcRange[0];

  return (adjValue * dstMax / srcMax) + dstRange[0];

}


$(function() {
    app.init();
});