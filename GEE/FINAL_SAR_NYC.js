

/// ADDING ALL LAYERS AS FINAL MAP for comparison
// Center the map

Map.setCenter(-73.968285, 40.685091, 11);

// Bounding
var NYC = ee.FeatureCollection('users/vivaldirinaldi/nyc_communitydistrict');
var box = ee.Geometry(NYC.geometry().bounds());
var buildingMask = ee.Image('users/vivaldirinaldi/Building_mask').clip(NYC);

// add layers 
var SAR = ee.Image('users/vivaldirinaldi/floodSAR');

var FR = ee.Image('users/vivaldirinaldi/frequency_ratio');

var BGRF = ee.Image('users/vivaldirinaldi/baggingRF');


var uBGRF = ee.Image('users/vivaldirinaldi/UnweightedbaggingRF');

var GMM = ee.Image('users/vivaldirinaldi/gmm');


// Specify Palette


var pal = ['white','#eb4a40', '#ef6a4c','#f2855d','#f8b58b', '#facba6', '#85c4c9','#68abb8','#4f90a6','#3b738f', '#2a5674']

// var pal = ['white', '#ef6a4c','#f2855d','#f8b58b', '#facba6', '#7ccba2','#46aea0','#089099','#00718b','#045275']



FR = FR.multiply(buildingMask).visualize({min: 0, max: 10, palette: pal});

// add the two layers
Map.addLayer(FR,{} , 'Frequency Ratio');
Map.addLayer(uBGRF.multiply(buildingMask), {min: 0, max: 10, palette: pal}, 'Frequency Ratio');
// Map.addLayer(uBGRF, {min: 0, max: 10, palette: pal2}, 'Unweighted Bagging RF',0);
// Map.addLayer(BGRF, {min: 0, max: 10, palette: pal}, 'Bagging RF',0);
// Map.addLayer(GMM, {min: 0, max: 10, palette: pal}, 'gaussian Mixture',0);


Map.addLayer(buildingMask.updateMask(buildingMask.eq(0)), {palette: 'white'}, 'Building', 0);
Map.addLayer(SAR, {palette: "red"}, 'SAR Flood');



// Export the visualization image as map tiles.
Export.map.toCloudStorage({
  // All tiles that intersect the region get exported in their entirety.
  // Clip the image to prevent low resolution tiles from appearing outside
  // of the region.
  image: FR.clip(box),
  description: 'frtile',
  bucket: 'visualhierarki',
  maxZoom: 14,
  region: box
});



 // 311 calls for 08-11-2018
var calls = ee.FeatureCollection('users/vivaldirinaldi/calls081118');

Map.addLayer(calls, {color:'grey', size:10}, 'call', 0);




// clip it by SAR LAYER
var fr = FR.updateMask(SAR);

var bgrf = BGRF.updateMask(SAR)

var ubgrf = uBGRF.updateMask(SAR)

var gmm = GMM.updateMask(SAR)

// MAKE INTO 1
var frBGmm = fr.addBands([bgrf, gmm]);

var frBG = fr.addBands([ubgrf]).rename(['FR', 'BG']);


print(frBG)
// var result = frBG.reduce(ee.Reducer.toList())
// print(result)

// -------------------------------- //
// FR BG GMM SAR PIXEL DISTRIUTION //
// ------------------------------ //

var options = {
  title: 'Frequency Ratio and Bagging Classifier on SAR Flood',
  fontSize: 15,
  legend: { position: 'bottom' },
  hAxis: {title: 'Susceptibility Index'},
  vAxis: {title: 'Frequency'},
  series: {0: {color: 'blue'},
          1: {color: 'green'},
  }}
  
//Create histogram for your region of interest set by geometry above 
var histogram = ui.Chart.image.histogram(frBG, NYC, 30)
    .setSeriesNames(['Frequency Ratio', 'Bagging Classifier'])
    .setOptions(options);
    
// Display the histogram.
print(histogram);



// // -------------------------------- //
// // FR BG GMM 311 PIXEL DISTRIUTION //
// // ------------------------------ //

// var options = {
//   title: 'FR vs BGRF vs GMM on 311 Calls',
//   fontSize: 15,
//   hAxis: {title: 'Susceptibility'},
//   vAxis: {title: 'frequency'},
//   series: {
//     0: {color: 'blue'},
//     1: {color: 'green'},
//     2: {color: 'red'}}
// };
// // Make the histogram, set the options.
// var histogram = ui.Chart.image.histogram(frBG, calls, 1500)
//     .setSeriesNames(['FR', 'BGrf', 'GMM'])
//     .setOptions(options);

// // Display the histogram.
// print(histogram);


