//==================================
//  Initialization
//==================================


// Google maps variables
let boston = {lat: 42.3601,lng: -71.0589};
let DirectionResults ;
    
var mapOptions = {
    zoom: 8,
    center: boston ,
    disableDefaultUI: true
}

// initialize google api objects
var map = new google.maps.Map(document.getElementById('map'),mapOptions);
var directonsService = new google.maps.DirectionsService();
var directionsDisplay = new google.maps.DirectionsRenderer();
        
directionsDisplay.setMap(map);

// Simulation Variables
var drivingProcess;
var currentPolyLine;
var currentPath;

// Calculate route markers

//Destination
var destination = null;
var destinationMarker;

//Cycleposition
var cyclePosition = boston;
var cycleMarker = new google.maps.Marker({
    position: cyclePosition,
    //draggable: true,
    icon: '../images/bicycle.png'
})
cycleMarker.setMap(map);

// Add event listeners
var driveToggle = document.getElementById("driveBicycle")
driveToggle.addEventListener('change',driveRoute);


map.addListener("click", async function(mapsMouseEvent){
    
    var moveBicycleChecked = document.getElementById("moveBicycle").checked;

    
    if(moveBicycleChecked){
        cyclePosition = mapsMouseEvent.latLng;
        cycleMarker.setPosition(cyclePosition);
    }
    
    else{
        //Set the destination position
        destination = mapsMouseEvent.latLng;

        if(destinationMarker!=null){
            destinationMarker.setMap(null);
        }

        destinationMarker = new google.maps.Marker({
            position: destination,
            //icon: '../images/bicycle.png'
        })
        
        destinationMarker.setMap(map);
    }

    //calculate Route 
    if(destination){

        await calcRoute(cyclePosition,destination);

        if(drivingProcess==null){
            driveRoute();
        }
    }
});

//update slider value
var velocitySlider = document.getElementById("velocitySlider");
var velocityDisplay = document.getElementById("velocityDisplay");
velocityDisplay.innerHTML = velocitySlider.value;

velocitySlider.oninput = function() {
    velocityDisplay.innerHTML = this.value;
}


//=========================================
// Functions
//=========================================

async function setCyclePosition(){

    var address = document.getElementById("from").value;
    var error = null;

    if(cycleMarker!=null){
        cycleMarker.setMap(null);
    }

    if(address!=''){
       await addressToLatLong(address)
       .then((result) => {
            cyclePosition=result})
       .catch((err)=>{
            error = err;
            alert('Something went wrong:' + err)});
    }

    if(error==null){
        cycleMarker = new google.maps.Marker({
            position: cyclePosition,
        })
        cycleMarker.setMap(map);

        if(destination){
            calcRoute(cyclePosition,destination);
        }
    }
    else{
        return;
    }
}

function addressToLatLong(address){
    
    return new Promise((resolve,reject) => {

        var geocoder = new google.maps.Geocoder();

        geocoder.geocode( { 'address': address}, function(results,status){
            if(status=='OK'){
                 resolve(results[0].geometry.location);
            }
            else{
                reject(status);
            }
        });
    });
}

function showMarkers(locationArray,col){
    for (i=0;i<locationArray.length;i++){
        var marker = new google.maps.Marker({
            position: locationArray[i],
        });

        marker.setMap(map);
    }
}


function calcRoute(ori,desti) {

    return new Promise((resolve,reject) => {

        // create a request
        var request = {
            origin: ori,
            destination: desti,
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        }

        // pass the request to the route method
        directonsService.route(request, function (result,status) {

            if (status == google.maps.DirectionsStatus.OK) {
                
                DirectionResults = result;
                currentPath = result.routes[0].overview_path;

                drawPath();
                resolve();
            }

            else{
                directionsDisplay.setDirections({routes: []});
                map.setCenter(cyclePosition);
                reject();
            }
        });

    })
}

function drawPath(){
    
    if(currentPolyLine != null){
        currentPolyLine.setMap(null);
    }

    currentPolyLine = new google.maps.Polyline({
        path: currentPath,
        geodesic: true,
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 2,
    });

    currentPolyLine.setMap(map);
}


function getDistances() {
    
    var cl = currentPath.length;
    var AllDistances = new Array(cl-1); // values in meters

    for (i=0;i<(cl-1);i++){
        AllDistances[i] = google.maps.geometry.spherical.computeDistanceBetween(currentPath[i],currentPath[i+1]);
    }

    return AllDistances;
}


function mainLoop(){

    var velocity = velocitySlider.value; // Value in meters per second default value is 10
    var AllDistances = getDistances();
    var s = velocity*5;
    var D = AllDistances[0];
    var cnt=1;

    while(D<s){
        D += AllDistances[cnt];
        
        if(cnt==AllDistances.length){
            cycleMarker.setPosition(currentPath[cnt]);
            clearInterval(drivingProcess);
            return;
        }

        cnt++;
    }

    var proz = 1-(D/AllDistances[cnt-1])+(s/AllDistances[cnt-1]);
    var position = google.maps.geometry.spherical.interpolate(currentPath[cnt-1],currentPath[cnt],proz);

    // Update the position
    cycleMarker.setPosition(position);
    cyclePosition = position;

    //update path
    for(i=0;i<cnt;i++){
        currentPath.shift();
    }
    currentPath.unshift(position);
    drawPath();

    // Reset after reaching the finish
    if(currentPath.length<10){
        clearInterval(drivingProcess);
        drivingProcess=null;
    }
}


function driveRoute(){

    var loopFrequency = 2; // Milliseconds

    if(driveToggle.checked && destination){
        drivingProcess = setInterval(mainLoop,loopFrequency);
    }
    else{
        clearInterval(drivingProcess);
        drivingProcess=null;
    }
}



