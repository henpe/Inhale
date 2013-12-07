var app = {

    restingValue: 0,
    restingValues: [],
    oldZ: 0,
    
    init: function() {

        var self = this;        

        $('.btn-start').on('click', function() {
            window.ondevicemotion = self.throttledHandleMotion;
            self.setupChart();
            self.startAudio();
            self.startTime = new Date().getTime();

            $(this).hide();
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
            canvas = document.getElementById('chart');

        this.chartSeries = new TimeSeries();
        chart.addTimeSeries(this.chartSeries, {lineWidth:3.3});
        chart.streamTo(canvas, 500);
    },

    throttledHandleMotion: _.throttle(function(event) {
        var smoothingFactor = 0.05;
        var runningTime = (new Date().getTime() - app.startTime) / 1000;
        var accelerationZ = event.acceleration.z;

        // Calculate resting value
        if (runningTime <= 5) {
            app.restingValues.push(accelerationZ);
            app.restingValue = app.average(app.restingValues);
        }

        // Offset from rest value
        console.log(app.restingValue);
        accelerationZ += app.restingValue;

        accelerationZ = accelerationZ * smoothingFactor + app.oldZ * (1 - smoothingFactor);

        app.oldZ = accelerationZ;

        var audioFrequency = Math.abs(accelerationZ * 5000);
        app.setAudioFrequency(audioFrequency);

        /*document.getElementById('output').innerHTML = + '<br>restingValue:' + app.restingValue
                             + '<br>audioFrequency:' + audioFrequency 
                             + '<br>Z:' + (accelerationZ);*/



        app.chartSeries.append(new Date().getTime(), accelerationZ);
    }, 10),


    startAudio: function() {
        this.glide = T("param", {value:880});

        T("sin", {freq:this.glide, mul:2}).play();
        //T("+sin", {freq:10}, api).play();
    },

    setAudioFrequency: function(freq) {
        this.glide.linTo(freq, '100ms');
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