/* TODO LIST
1) Clear the map when panned
2) Populate the slider based on the IC (imageCollection)
4) Add thermal band contours
*/

// Map.setCenter(-50.4, 68.9, 12); // Saqqarliup
Map.setCenter(-42.57, 62.75, 12);

var IC; // ee.ImageCollection
var IM; // ee.Image

var brightness = 5;
var sceneIndex = 0;
var showTOA = 0;


// Populate the IC variable
var getSceneList = function() {
  var s2013 = ee.ImageCollection.load('LANDSAT/LC8_L1T_TOA').filterDate('2013-05-01', '2013-10-31').filterBounds(Map.getCenter()).sort('system:time_start');
  var s2014 = ee.ImageCollection.load('LANDSAT/LC8_L1T_TOA').filterDate('2014-05-01', '2014-10-31').filterBounds(Map.getCenter()).sort('system:time_start');
  var s2015 = ee.ImageCollection.load('LANDSAT/LC8_L1T_TOA').filterDate('2015-05-01', '2015-10-31').filterBounds(Map.getCenter()).sort('system:time_start');
  var s2016 = ee.ImageCollection.load('LANDSAT/LC8_L1T_TOA').filterDate('2016-05-01', '2016-10-31').filterBounds(Map.getCenter()).sort('system:time_start');
  IC = s2013.toList(1E3);
  IC = IC.cat(s2014.toList(1E4));
  IC = IC.cat(s2015.toList(1E4));
  IC = IC.cat(s2016.toList(1E4));

  if (sliderScene) { // recompute
    IC.size().evaluate(function(computedSize) {
    sliderScene.setMax(computedSize-1);});
  }
};

// Pansharpen an image
var PS = function(scene) {
  var natural = ['B4', 'B3', 'B2'];
  var hsv = scene.select(['B4','B3','B2']).rgbToHsv(); // Convert the RGB bands to the HSV
  // Add band 8 and convert back to RGB
  var sharpened = ee.Image.cat([hsv.select('hue'), hsv.select('saturation'), scene.select('B8')]).hsvToRgb();
  // Do a very basic color correction
  var imageRGB = sharpened.visualize({min: 0, max:brightness/10,	gamma:[1.05, 1.08, 0.8]});
  return imageRGB;
};

function dateFromDay(year, day) {
  var date = new Date(year, 0); // initialize a date in `year-01-01`
  return new Date(date.setDate(day)); // add the number of days
}

// Shows the current scene.
var showScene = function() {
  IM = ee.Image(IC.get(sceneIndex));
  var label = IM.getInfo().id;
  var date = dateFromDay(label.slice(29, 33), label.slice(33, 36));
  //var toa = ee.Algorithms.Landsat.TOA(IM);
  //print(IM.getInfo().id)
  //toa = toa.toInt();//({B1:'int32'});
  //print(toa);
  //Map.addLayer(IM2, );
  Map.layers().reset();
  Map.addLayer(PS(IM), null, date.toUTCString());
};

getSceneList()
showScene();

// UI
// SCENE
var setSceneIndex = function(index) { sceneIndex = index; showScene(); };
var labelScene = ui.Label("Scene #");
var sliderScene = ui.Slider({min: 0, max: 999, step: 1, onChange: setSceneIndex});
// BRIGHTNESS
var setBrightness = function(value) { brightness = value; showScene(); };
var labelBrightness = ui.Label("Brightenss");
var sliderBrightness = ui.Slider({ min: 1, max: 10, value: brightness, step: 1, onChange: setBrightness});
// TOA
//var showTOA = function(value) { print(value); };
//var labelTOA = ui.Label("TOA");
//var btnTOA = ui.Button("TOA", {onChange: showTOA() };);
//var btnTOA = ui.Button({label: 'Show TOA', onClick: function() { showTOA = 1; showScene()}});
/*
  onClick: function() {
    if (btnTOA.getLabel() == "Show TOA") {
      showScene();
      btnTOA.setLabel("Hide TOA")
    } else {
      btnTOA.setLabel("Show TOA")
}}});
*/

    
var panel = ui.Panel({
    widgets: [labelScene, sliderScene, 
              labelBrightness, sliderBrightness,
              //labelTOA, 
              //btnTOA
              ],
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
	position: 'top-left',
	padding: '7px'
    }
});
Map.add(panel);

// When panning: Regenerate list of scenes covering the new center
var mapPanned = function() {
    getSceneList();
    sceneIndex = 0;
    sliderScene.setValue(sceneIndex);
    //sceneIndex = IC.indexOf(IM);
    //if ( sceneIndex == "-1" ) { sceneIndex = 0; }
    showScene();
};

// When clicked, print information
var mapClicked = function (map, p) { print(map.lat, map.lon, IM.get("LANDSAT_SCENE_ID")); };

IC.size().evaluate(function(computedSize) {
  sliderScene.setMax(computedSize);
});

Map.onChangeCenter(mapPanned);
Map.onClick(mapClicked);
