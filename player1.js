

let boston = {lat: 42.3601,lng: -71.0589};
let DirectionResults ;
    
var mapOptions = {
    zoom: 8,
    center: boston ,
    disableDefaultUI: true
}

var map = new google.maps.Map(document.getElementById('map'),mapOptions);

var directonsService = new google.maps.DirectionsService();

var directionsDisplay = new google.maps.DirectionsRenderer();
        
directionsDisplay.setMap(map);


// Simulation Variables
var time = 0;
var marker2;
var drivingProcess;
var my_path;

function showMarkers(locationArray,col){
    for (i=0;i<locationArray.length;i++){
        var marker = new google.maps.Marker({
            position: locationArray[i],
        });

        marker.setMap(map);
    }
}


function calcRoute() {

    // create a request
    var request = {
        origin: document.getElementById("from").value,
        destination: document.getElementById("to").value,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC
    }

    // pass the request to the route method
    directonsService.route(request, function (result,status) {

        if (status == google.maps.DirectionsStatus.OK) {
            
            DirectionResults = result;
            //showMarkers(DirectionResults.routes[0].overview_path)
            //console.log(DirectionResults.routes[0].overview_path.length)

            if(my_path != null){
                my_path.setMap(null);
            }

            my_path = new google.maps.Polyline({
                path: DirectionResults.routes[0].overview_path,
                geodesic: true,
                strokeColor: "#FF0000",
                strokeOpacity: 1.0,
                strokeWeight: 2,
            });

            my_path.setMap(map);
            
            //directionsDisplay.setDirections(result);
        }

        else{
            directionsDisplay.setDirections({routes: []});
            map.setCenter(boston);
        }
    });
}

function getDistances() {
    
    var currentPath = DirectionResults.routes[0].overview_path;
    var cl = currentPath.length;
    var AllDistances = new Array(cl-1); // values in meters

    for (i=0;i<(cl-1);i++){
        AllDistances[i] = google.maps.geometry.spherical.computeDistanceBetween(currentPath[i],currentPath[i+1]);
    }

    return AllDistances;
}


function mainLoop(){

    time++;
    var currentPath = DirectionResults.routes[0].overview_path;
    var velocity = 10; // Value in meters per second
    var AllDistances = getDistances();
    var s = velocity*time*5;
    var D = AllDistances[0];
    var cnt=1;

    while(D<s){
        D += AllDistances[cnt];
        
        if(cnt==AllDistances.length){
            marker2.setPosition(currentPath[cnt]);
            clearInterval(drivingProcess);
            time = 0;
            return;
        }
        
        cnt++;
    }


    var proz = 1-(D/AllDistances[cnt-1])+(s/AllDistances[cnt-1]);
    var position = google.maps.geometry.spherical.interpolate(currentPath[cnt-1],currentPath[cnt],proz);

    //console.log(position);
    
    if(time==1){
        marker2 = new google.maps.Marker({
            position: position,
            draggable: true,
            icon: 'https://img.icons8.com/fluent/48/000000/marker-storm.png',
        });

        marker2.setMap(map);
    }
    else{
        marker2.setPosition(position);
    }

    if((cnt+1)==currentPath.length){
        clearInterval(drivingProcess);
        time = 0;
    }
}


function driveRoute(){

    if(marker2 != null){
    marker2.setMap(null);
    }
    drivingProcess = setInterval(mainLoop,1);
    //mainLoop();
}


var options = {
    types: ['(cities)']
}

var input1 = document.getElementById("from");
var autocomplete1 = new google.maps.places.Autocomplete(input1, options);

var input2 = document.getElementById("to");
var autocomplete2 = new google.maps.places.Autocomplete(input2, options);