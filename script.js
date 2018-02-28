
    var deviceLocation;
    var index = 0;
    var unitValue;
    var ws = new WebSocket("ws://192.168.0.100:9090");
    var currentTime;
    var timeBefore;

    //1/7 day time interval for "DAY" button
    function day(interval) {
        var date= new Date();
        var date2 = new Date();
        date2.setDate(date2.getDate()-interval);
        currentTime = Date.parse(date);
        timeBefore = Date.parse(date2);
        console.log(name);

    }


    ws.onopen = function () {

        //default 1 day time interval, when program is launched
        tent = document.getElementById("mySelect").value;
        var date= new Date();
        var date2 = new Date();
        date2.setDate(date2.getDate()-1);
        currentTime = Date.parse(date);
        timeBefore = Date.parse(date2);

        //first message to server, for buttons
        message = {
            "message": "devices",
            "object": {
                "tenant": tent,
                "name": "",
                "deviceClass": "",
                "location": "",
                "timeout": "",
                "options": null,
                "manager": "",
                "deviceType": ""
            }
        };
        ws.send(JSON.stringify(message));
    };


    ws.onmessage = function (evt) {
        // JavaScript object, where stored data from server
        var jsObject = JSON.parse(evt.data);
        var dataFromServer = [];
        for (var i = 0; i < jsObject.object.length; i++) {
            dataFromServer[dataFromServer.length] = jsObject.object[i];
        }


        if (jsObject['message'] == 'devices') {
            createButtons(dataFromServer);

        } else {
            dataConversionForChart(dataFromServer);
        }
    };


    //creation of buttons using data from the server
    function createButtons(dataFromServer) {
        var buttonsArray = [];

        for (var i = 0; i < dataFromServer.length; i++) {
            buttonsArray.push(["<input type='button' class='w3-button w3-blue w3-small w3-border w3-round w3-hover-black w3-small' style='width: 100%; height: 30px' title='" + dataFromServer[i].lookupKey.description + ": ( " + dataFromServer[i].lookupKey.unitValue + " )" + "' id='" + dataFromServer[i].tenant + "' name='" + dataFromServer[i].tenant + "' value='" + dataFromServer[i].name + "' onclick='secondMessageToServer(id, value, name, title)'>"]);
        }

        document.getElementById("container1").innerHTML = buttonsArray.join("");

        //emty chart for begining
        highchartMultipleLines();
    }


    function secondMessageToServer(tenant, name, location, unit) {

        //second message to server, using name and tenant from data received from button
        message2 = {
            "message":"device",
            "object":{
                "tenant": "",
                "additionalProperties":{
                    "device_data_request":{
                        "name":name,
                        "tenant": tenant,
                        "to":currentTime,
                        "from":timeBefore
                    }
                }
            }
        }

        ws.send(JSON.stringify(message2));

        // tenant parsing
        var str = location;
        deviceLocation = str.split("/", 4).join(" ");

        // celsius/percent + humidity/temperature
        unitValue = unit;
    }


    function dataConversionForChart(dataFromServer) {
        var convertedData = [];
        var temperatureArray = [];
        //converting timestamp to date
        for (var i = 0; i < dataFromServer.length; i++) {
            var date = new Date(dataFromServer[i].tstamp);
            var year = date.getFullYear();
            var month = date.getMonth();
            var day = date.getDate();
            var hours = date.getHours();
            var minutes = date.getMinutes();
            convertedData.push([Date.UTC(year, month, day, hours, minutes), dataFromServer[i].dval]);
            temperatureArray.push(dataFromServer[i].dval);
            var deviceName = dataFromServer[i].device;
            //device name for compare function
            var deviceNameForMultipleChart = dataFromServer[i].device + " / " + unitValue + " / " + deviceLocation;
        }

        if (document.getElementById('Compare').checked == true)
        {

            //calls multiple lines chart
            if (index < 1)
            {
                highchartMultipleLines()
            }
            index++;
            addSeries(deviceNameForMultipleChart, convertedData);
            chart.redraw();

        } else {
            //calls one line chart
            highchartSingleLine(deviceName, convertedData);
            index=0;
        }
    }


    //highchart for compare function
    function highchartMultipleLines() {

        chart = Highcharts.chart('container2', {
            chart: {
                type: 'spline'
            },
            title: {
                text: ''
            },

            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%Y'
                },
                title: {
                    text: 'Date'
                }
            },
            yAxis: {
                title: {
                    text: ""
                }

            },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormat: '{point.x:%e. %b. %Y %a. %H:%M<br>} {point.y:.2f} ',
                hideDelay: 100,
                useHTML: true

            },

            plotOptions: {
                spline: {
                    marker: {
                        enabled: false
                    }
                }
            }
        });
    }


    //highchart for single line function
    function highchartSingleLine(deviceName, convertedData, maxTemperature, minTemperature) {
        Highcharts.chart('container2', {
            chart: {
                type: 'spline'
            },
            title: {
                text: deviceLocation
            },

            xAxis: {
                type: 'datetime',
                dateTimeLabelFormats: { // don't display the dummy year
                    month: '%e. %b',
                    year: '%Y'
                },
                title: {
                    text: 'Date'
                }
            },
            yAxis: {
                title: {
                    text: unitValue
                }


            },
            tooltip: {
                headerFormat: '<b>{series.name}</b><br>',
                pointFormat: '{point.x:%e. %b. %Y %a. %H:%M<br>}  {point.y:.2f} ',
                hideDelay: 100,
                useHTML: true

            },

            plotOptions: {
                spline: {
                    marker: {
                        enabled: false
                    }
                }
            },

            series: [{
                name: deviceName,
                // Define the data points. All series have a dummy year
                // of 1970/71 in order to be compared on the same x axis. Note
                // that in JavaScript, months start at 0 for January, 1 for February etc.
                data: convertedData
            }]
        });
    }


    //add new lines into chart
    function addSeries(deviceName, convertedData) {
        chart.addSeries({
            name: deviceName,
            // Define the data points. All series have a dummy year
            // of 1970/71 in order to be compared on the same x axis. Note
            // that in JavaScript, months start at 0 for January, 1 for February etc.

            data: convertedData
        },false);
    }
