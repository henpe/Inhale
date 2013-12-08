vz = z = 0;
var app = {

    restingValue: 0,
    restingValues: [],
    oldZ: 0,

    deviceMotionEvent: {
        acceleration : { x: 0, y: 0, z: 0} // just some defaults
    },
    
    init: function() {

        var self = this;

        $('.btn-start').on('click', function() {
            window.ondevicemotion = function(event) {
                self.deviceMotionEvent = event;
            };
            self.setupChart();
            self.startAudio();
            self.startTime = new Date().getTime();

            self.handleMotion();

            $(this).hide();
        });
    },


    setupChart: function() {
        var chart = new SmoothieChart({
                //minValue: 0,
                //maxValue: 100,
                grid:{
                    fillStyle:'transparent',
                    strokeStyle:'transparent',
                    borderVisible:false
                },
                labels:{disabled:true}
            }),
            canvas = document.getElementById('chart');

        this.chartSeries = new TimeSeries();
        this.guideChartSeries = new TimeSeries();

        chart.addTimeSeries(this.chartSeries, {lineWidth:3.3});
        chart.addTimeSeries(this.guideChartSeries, {lineWidth:3.3, strokeStyle: 'rgba(100,100,100,0.8)'});
        chart.streamTo(canvas, 100);
    },

    handleMotion: function() {

        var smoothingFactor = 0.01;
        var runningTime = (new Date().getTime() - app.startTime) / 1000;
        var accelerationZ = (app.deviceMotionEvent.acceleration.z * 100);

        // Calculate resting value
        if (runningTime <= 5) {
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

        document.getElementById('output').innerHTML = Math.round(accelerationZ) + ' ' + direction;
        if (Math.abs(diff) > 0.5) {
            
            var audioFrequency = 100 + (diff * 400); //Math.abs(accelerationZ * 10);
            app.setAudioFrequency(audioFrequency);            
        } else {
            //document.getElementById('output').innerHTML = '';
        }
        /*document.getElementById('output').innerHTML = + '<br>restingValue:' + app.restingValue
                             + '<br>audioFrequency:' + audioFrequency 
                             + '<br>Z:' + (accelerationZ);*/


        var now = new Date().getTime();
        app.chartSeries.append(now, accelerationZ);
        app.guideChartSeries.append(now, Math.sin(runningTime));

        app.oldZ = accelerationZ;

        requestAnimationFrame(function() {
            app.handleMotion();
        });
    },


    startAudio: function() {
        this.glide = T("param", {value:880});

        this.audio = T("sin", {freq:this.glide, mul:6}).play();
        //T("+sin", {freq:10}, api).play();
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


$(function() {
    app.init();
})