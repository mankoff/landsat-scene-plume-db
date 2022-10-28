var row;

row = '0,LC80122482013122LGN01,81.4474921754631,-27.4713134765625,2.0,1.0,,'
row = '0,LC80020172013148LGN00,61.199488225361,-45.204963684082,1,,,,'

function padTo2Digits(num) {
  return ee.String(ee.Number(num).format('%02d'));
}

function yyyydoy2yyyymmdd(yyyy, doy) {
    var d = new Date(yyyy, 1, doy)
    var month = padTo2Digits(d.getUTCMonth()+1)
    var day = padTo2Digits(d.getUTCDate()-1)
    return [month, day];
}

var parts = row.split(',')
var scene = parts[1]
var lat = ee.Number.parse(ee.String(parts[2]))
var lon = ee.Number.parse(ee.String(parts[3]))
if (parts[3] == "") {
    var lon = ee.Number.parse(ee.String("-56.1"))
}

Map.setCenter(lon.getInfo(), lat.getInfo(), 11);

var IC; // ee.ImageCollection
var IM; // ee.Image

var brightness = 8;
var sceneIndex = 0;
var showTOA = 0;


// Populate the IC variable
var getSceneList = function() {
  var compare = ee.String('LANDSAT_SCENE_ID == "').cat(scene).cat('"')
  var im = ee.ImageCollection.load('LANDSAT/LC8_L1T_TOA');
  im = im.filter(ee.Filter.expression(compare))
  IC = im.toList(1E3);
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
  Map.layers().reset();
  Map.addLayer(PS(IM));//, null, date);
};

getSceneList()
showScene();

// BRIGHTNESS
var setBrightness = function(value) { brightness = value; showScene(); };
var labelBrightness = ui.Label("Brightenss");
var sliderBrightness = ui.Slider({ min: 1, max: 10, value: brightness, step: 1, onChange: setBrightness});

var panel = ui.Panel({
    widgets: [labelBrightness, sliderBrightness],
    layout: ui.Panel.Layout.flow('vertical'),
    style: {
	position: 'top-left',
	padding: '7px'
    }
});
Map.add(panel);

// When clicked, print information
var mapClicked = function (map, p) { print(map.lat, map.lon, IM.get("LANDSAT_SCENE_ID")); };

//Map.onChangeCenter(mapPanned);
Map.onClick(mapClicked);
