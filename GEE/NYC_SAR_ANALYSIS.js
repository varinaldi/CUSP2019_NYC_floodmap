//////////////////////////////////////////////////////////////////////////////////////////////////////
// ------------------------------ NYC SAR ANALYIS  ------------------------------------------------//
////////////////////////////////////////////////////////////////////////////////////////////////////

// Parallel Jupyter Notebook includes SAR Image selection based on #311 calls and precipitation condition on sensing day


// this will based on Normalzied Difference Flood Index:
// https://www.sciencedirect.com/science/article/pii/S0034425718300993?via%3Dihub#f0005



//Map.addLayer(elev, {min:0, max:0, palette:['white']}, 'bg')

// NYC Boundary and bounding box
var NYC = ee.FeatureCollection('users/vivaldirinaldi/nyc_communitydistrict');
var box = ee.Geometry(NYC.geometry().bounds());
var buildingMask = ee.Image('users/vivaldirinaldi/Building_mask').clip(NYC);

//Map.addLayer(NYC, { fill:['white']}, 'bg')

// Center the map
Map.setCenter(-73.968285, 40.785091, 11);

//Map.addLayer( buildingMask, {min:0, max:1}, 'Building Mask');


// reducers for later use
var maxReducer = ee.Reducer.max();
var minReducer = ee.Reducer.min();
var meanReducer = ee.Reducer.mean();
var stdDevReducer = ee.Reducer.stdDev();

// slope
// var hydrosheds = ee.Image('WWF/HydroSHEDS/03VFDEM');
// var terrain = ee.Algorithms.Terrain(hydrosheds);
// var slope = terrain.select('slope');



// Map.addLayer(slope, {min:-10, max: 10}, 'slope')

//////////////////////////////////////////////////////////////////////////////////////////////////////
// ---------------------------------- GET IMAGE BY ID  --------------------------------------------//
// ---------------- T-1 = before sensing, T0 = rainy day, T+1 = after sensing --------------------//
///////////////////////////////////////////////////////////////////////////////////////////////////

// ------------- //
// Flood Images //
// ----------- //

// 2018-08-11
var fl_1 = ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180811T225104_20180811T225129_023205_028585_6C71').clip(NYC);


// ---------------- //
// Reference Image //
// ---------------//

// 2018-07-30
var rf_1 = ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180730T225103_20180730T225128_023030_027FF9_D79A').clip(NYC);

// 2018-08-23
var rf_2 = ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180823T225104_20180823T225129_023380_028B2D_686E').clip(NYC); 

// 2018-07-18
var rf_3 = ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180718T225102_20180718T225127_022855_027A73_4435').clip(NYC);

//2017-10-15
var rf_4 = ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20171015T225059_20171015T225124_018830_01FCB7_0899').clip(NYC);

//2017-09-21
var rf_5 = ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170921T225059_20170921T225124_018480_01F205_A650').clip(NYC);


// 2018-09-28
// var fl_1 = ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180928T225106_20180928T225131_023905_029C08_B08A').select(['VV']).clip(NYC);

// 2017-04-06
//var fl_3= ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170406T225050_20170406T225115_016030_01A735_7967').clip(NYC);

// // 2018-09-16
// var rf_3 = ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20180916T225105_20180916T225130_023730_02965B_9B45').select(['VV']).clip(NYC);

// //2017-09-09
// var rf_2 = ee.Image('COPERNICUS/S1_GRD/S1A_IW_GRDH_1SDV_20170909T225058_20170909T225123_018305_01ECA6_A0F9').select(['VV']).clip(NYC);



// --------------------------------------------//
// stacking the images as reference and flood //
// ------------------------------------------//

var reference = ee.ImageCollection([rf_1, rf_2, rf_3, rf_4, rf_5 ]);

var flood = ee.ImageCollection([fl_1, rf_1, rf_2, rf_3, rf_4, rf_5 ]);


// ------ apply reducer ------- // 
var r = reference.reduce(meanReducer).rename(['VV', 'VH', 'Angel'])
var f = flood.reduce(minReducer).rename(['VV', 'VH', 'Angel']);

var rx = reference.reduce(maxReducer).rename(['VV', 'VH', 'Angel']);
var fx = flood.reduce(maxReducer).rename(['VV', 'VH', 'Angel']);



// Map.addLayer(rx.select(['VV']), {min: -20, max: 0}, 'Reference min',0);
// Map.addLayer(fx.select(['VV']), {min: -20, max: 0}, 'Flood max', 0);



function getNDPI(collection){
  var new_image = ee.Image(collection);
  
  var ndpi = new_image.normalizedDifference(['VV', 'VH']).rename(['NDPI']);
  
  new_image = new_image.addBands(ndpi);
  
  return new_image
}

/// make a new NDPI band
r  = getNDPI(r);
rx = getNDPI(rx);

f  = getNDPI(f);
fx = getNDPI(fx)



// Map.addLayer(fx.select(['NDPI']), {min: -1, max: 1, palette:['blue', 'white', 'red']}, 'F NDPI', 0);
// Map.addLayer(rx.select(['NDPI']), {min: -1, max: 1, palette:['blue', 'white', 'red']}, 'R NDPI', 0);


// -----------------------------------------------------//
// ------------- CALCULATE NDFI and NDFVI -------------//
// ---------------------------------------------------//


// --------------------------------------------//
// NDFI = minRef - minFld / minRef + minFld //
// ------------------------------------------//
function getNDFI(ref, flood){
  
  var smoothing = 75;
  var r  = ref.select(['VV']);
  var f  = flood.select(['VV']);


  var stack = r.addBands(f).rename(['r','f']);
  
  var ndfi  = stack.abs().focal_median(smoothing, 'circle', 'meters').normalizedDifference(['r','f']).rename('NDFI');
  
  return stack.addBands(ndfi) 
  
}



var NDFI = getNDFI(r, f);



// Map.addLayer(NDFI.select('NDFI'), {min:-1, max:1, palette:['white', 'black']}, 'NDFI',0)



// // --------------------------------------------//
// // NDFVI = maxFld - maxRef / maxFld - maxRef  //
// // ------------------------------------------//


function getNDFVI(ref, flood){
  
  var smoothing = 75;
  var r  = ref.select(['VV'])
  var f  = flood.select(['VV'])
  
  var stack = r.addBands(f).rename(['r','f']);

  var ndfvi  = stack.abs().focal_median(smoothing, 'circle', 'meters').normalizedDifference(['f','r']).rename('NDFVI');
  
  return stack.addBands(ndfvi) 
  
}


// apply NDFVI
var NDFVI = getNDFVI(r, fx);


// Map.addLayer(NDFVI.select(['NDFVI']), {min:-1, max:1}, 'NDFVI', 0)


// // --------------------------------------------//
// // NDPFI = maxFld - maxRef / maxFld - maxRef  //
// // ------------------------------------------//

function getNDPFI(ref, flood){
  
  var smoothing = 75;
  var r  = ref.select(['NDPI'])
  var f  = flood.select(['NDPI'])
  
  var stack = r.addBands(f).rename(['r','f']);

  var ndfvi  = stack.abs().focal_median(smoothing, 'circle', 'meters').normalizedDifference(['f','r']).rename('NDPFI');
  
  return stack.addBands(ndfvi) 
  
}

// apply NDPFI
var NDPFI = getNDPFI(rx, fx);
// Map.addLayer(NDPFI.select(['NDPFI']), {min:-1, max:1}, 'NDPFI', 0)




// // ---------------------//
// // Calculate Threshold //
// // -------------------//
// suggested k = 1.5

var k = ee.Number(1.5)

var affine = [0.00026949458523585647, 0, -180, 0, -0.00026949458523585647, 86.0000269494563];

// // function to get mean
function getMean(image){
  var img = image.rename(['Mean'])
  var mean = img.reduceRegion({
      reducer: meanReducer,
      geometry: box,
      crs: 'EPSG:4326',
      crsTransform: affine,
      maxPixels: 1e9
  });
  return ee.Number(mean.get('Mean'))
}


function getSD(image){
  var img = image.rename(['SD'])
  var SD = img.reduceRegion({
      reducer: stdDevReducer,
      geometry: box,
      crs: 'EPSG:4326',
      crsTransform: affine,
      maxPixels: 1e9
  });
  return ee.Number(SD.get('SD'))
}




// // NDFI th = mean(ndfi) - k* std(ndfi)

function ndfiThres(image){
  var mean = getMean(image);
  var sd = getSD(image);
  
  var thres = mean.subtract(k.multiply(sd));
  return ee.Number(thres)
}



print('ndfi thres',ndfiThres(NDFI.select(['NDFI'])))

// // // NDFVI th = mean(ndfvi) + k* std(ndfvi)

function ndfviThres(image){
  var mean = getMean(image);
  var sd = getSD(image);
  
  var thres = mean.add(k.multiply(sd));
  return ee.Number(thres)
}


print('ndfvi thres',ndfviThres(NDFVI.select(['NDFVI'])))

print('ndfpi thres',ndfviThres(NDPFI.select(['NDPFI'])))


// ---- apply threshold -----

var flood_ndfi = NDFI.select('NDFI').lt(ndfiThres(NDFI.select(['NDFI'])));
var flood_ndfvi = NDFVI.select('NDFVI').gt(ndfviThres(NDFVI.select(['NDFVI'])));
var flood_ndpfi = NDPFI.select('NDPFI').gt(ndfviThres(NDPFI.select(['NDPFI'])));



flood_ndfi = flood_ndfi.updateMask(flood_ndfi)
flood_ndfvi = flood_ndfvi.updateMask(flood_ndfvi)
flood_ndpfi = flood_ndpfi.updateMask(flood_ndpfi)

// map
Map.addLayer(flood_ndfi,
{min:0, max:1, palette:"blue"},'flood_ndfi',0);

Map.addLayer(flood_ndfvi,
{palette:"green"},'flood_ndvfi' ,0);

Map.addLayer(flood_ndpfi,
{palette:"red"},'flood_ndpfi' ,0);






//////////////////////////////////////////////////////////////////////////////////////////////////////
// ---------------------------------- InSAR COHERENCE----------------------------------------------//
////////////////////////////////////////////////////////////////////////////////////////////////////

// Coherence estimation was done using ESA SNAP with Sentinel 1 data downloaded from ASF

// rPre = 07/18/2018 & 07/30/2018 --- rCo = 07/30/2018 & 08/11/2018

var smoothing = 100;

// get coherence image
var rcoNYC    = ee.Image('users/vivaldirinaldi/NYC_rCO');
var rcoStaten = ee.Image('users/vivaldirinaldi/State_rCO');

var rpreNYC    = ee.Image('users/vivaldirinaldi/NYC_rPRE');
var rpreStaten = ee.Image('users/vivaldirinaldi/Staten_rPRE');


// Stitch them together
var Pre = ee.ImageCollection([ rpreNYC, rpreStaten]).max();
var Co = ee.ImageCollection([ rcoNYC, rcoStaten]).max();


// specify bands 
var rPre = ee.Image(Pre.select(['b1'])).clip(NYC);
var rCo = ee.Image(Co.select(['b1'])).clip(NYC);

// get the difference == anything that drops will be in negative (-) values
var rhoChange = rCo.focal_median(smoothing, 'circle', 'meters').subtract(rPre.focal_median(smoothing, 'circle', 'meters')); 



// // print histogram
// print("rPre", ui.Chart.image.histogram(rPre, box, 1000))
// print("rCo", ui.Chart.image.histogram(rCo, box, 1000))
// print("rhoChange", ui.Chart.image.histogram(rhoChange, box, 1000))

// put them on map 
// Map.addLayer(rPre, {min:0, max:1}, 'rPre', 0);
// Map.addLayer(rCo, {min:0, max:1 }, 'rCo', 0);
// Map.addLayer(rhoChange, {min:-1, max:1, palette: ['blue','white', 'red']}, 'rho change', 0);







///////////////////////////////////////////////////////////////////////
// --------------- EVENT - REFERENCE DFFERENCE ---------------------//
/////////////////////////////////////////////////////////////////////



var smoothing = 75

var change = f.select(['VV']).focal_median(smoothing, 'circle', 'meters').subtract(r.select(['VV']).focal_median(smoothing, 'circle', 'meters'));


// Map.addLayer(change, {min: -10, max: 10, palette: ['blue', 'white', 'red']}, 'Post - Pre', 0)




//---------------------------------------------------------------------------------//
//--------------------------- THRESHOLDING ---------------------------------------//
//-------------------------------------------------------------------------------//


// low thershold based on mean and standard deviation
function lowThreshold(image){
  var kp = ee.Number(1.5);
  var mean = getMean(image);
  var sd = getSD(image);
  
  var thres = mean.subtract(kp.multiply(sd));
  return ee.Number(thres)
}


//---------------------------------------------- Apply otsu on ---------------------------


// filter only the ones that drop in intensity and coherence
var rhoDrop = rhoChange.updateMask(rhoChange.lt(0));


var changeDrop = change.updateMask(change.lt(0))


// -----------------------------------------------------------------------
var rDrop = rhoDrop.updateMask(rhoDrop.lt(lowThreshold(rhoDrop)));


var cDrop = change.updateMask(change.lt(lowThreshold(change)));


Map.addLayer(cDrop, {min:-1, max:1, palette: ['blue']}, 'intensity drop', 0);
Map.addLayer(rDrop, {min:-1, max:1, palette: ['yellow']}, 'rho drop', 0);

// create a mask to 
var mask = rDrop.mask();


var intensity_FINAL = cDrop.updateMask(mask).clip(NYC);
var NDPFI_FINAL     = flood_ndpfi.updateMask(mask).clip(NYC);
var NDFI_FINAL      = flood_ndfi.updateMask(mask).clip(NYC);


Map.addLayer(intensity_FINAL, {min:-1, max:1, palette: ['blue']}, 'intensity drop',0);
Map.addLayer(NDPFI_FINAL, {palette:["green"]},'NDFIV Flood',0);
Map.addLayer(NDFI_FINAL, {palette:["magenta"]},'NDFI Flood',0);


// final SAR Flood layer 
var finalSAR = ee.ImageCollection([ intensity_FINAL.select(['VV']).visualize({palette:'red'}) , 
                                    NDPFI_FINAL.select(['NDPFI']).visualize({palette:'red'}),
                                    NDFI_FINAL.select(['NDFI']).visualize({palette:'red'})]).mosaic();


Map.addLayer(finalSAR, {}, 'FINAL', 0 )



var floodMask = finalSAR.select(['vis-red']).add(finalSAR.select(['vis-green'])).add(finalSAR.select(['vis-green']));





/////
// CROSS VALIDATE // 



// get FR layers
var fr = ee.Image('users/vivaldirinaldi/frequency_ratio');

var twi = ee.Image('users/vivaldirinaldi/Topographic_Wetness_Index');

var bgrf = ee.Image('users/vivaldirinaldi/baggingRF');


var gmm = ee.Image('users/vivaldirinaldi/gmm');

var occ = ee.Image('users/vivaldirinaldi/occ_rbf_SVM');

// Specify Palette
// var palettes = require('users/gena/packages:palettes');

// var palette = palettes.colorbrewer.RdYlGn[10].reverse();


// add the two layers
// Map.addLayer(fr, {min: 0, max: 10, palette: palette}, 'Frequency Ratio',0);
Map.addLayer(finalSAR, {}, 'FINAL' )





// Map.addLayer(wowMask, {min: 0, max: 1, palette: 'red'},  'haaaaaaaaa');





// print("NDFI_FINAL", ui.Chart.image.histogram(fr.updateMask(NDFI_FINAL.mask()), NYC, 100))

// print("intensity_FINAL", ui.Chart.image.histogram(fr.updateMask(intensity_FINAL.mask()), NYC, 100))



// // 311 calls for 08-11-2018
// var calls = ee.FeatureCollection('users/vivaldirinaldi/calls081118');

// Map.addLayer(calls, {color:'grey', size:10}, 'call', 0);

// Map.addLayer(occ, {}, 'occSVM', 0);


// // MAKE INTO 1
// var frBG = fr.addBands([bgrf, gmm]);




// // ---------------------------- //
// // FR BG GMM PIXEL DISTRIUTION //
// // -------------------------- //

// var options = {
//   title: 'FR - BGRF Pixel Distribution',
//   fontSize: 15,
//   hAxis: {title: 'Susceptibility'},
//   vAxis: {title: 'frequency'},
//   series: {
//     0: {color: 'blue'},
//     1: {color: 'green'},
//     2: {color: 'red'}
//   }
// };

// var histogram = ui.Chart.image.histogram(frBG, box, 1500)
//     .setSeriesNames(['FR', 'BGrf', 'GMM'])
//     .setOptions(options);

// print(histogram);




// // -------------------------------- //
// // FR BG GMM SAR PIXEL DISTRIUTION //
// // ------------------------------ //

// var options = {
//   title: 'FR vs BGRF vs GMM on SAR Flood',
//   fontSize: 15,
//   hAxis: {title: 'SAR Flood Pixel'},
//   vAxis: {title: 'frequency'},
//   series: {0: {color: 'blue'},
//           1: {color: 'green'},
//           2: {color: 'red'}
//   }}
  
// //Create histogram for your region of interest set by geometry above 
// var histogram = ui.Chart.image.histogram(frBG.updateMask(finalSAR.mask()), NYC, 100)
//     .setSeriesNames(['FR','BGRF', 'GMM'])
//     .setOptions(options);
    
// // Display the histogram.
// print(histogram);




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




// ///////



// var floodMask = ee.Image(finalSAR.select(['vis-red']).add(finalSAR.select(['vis-green'])).add(finalSAR.select(['vis-green'])));

// Export.image.toAsset({
//   image: floodMask,
//   description: 'imageToAssetExample',
//   assetId: 'floodSAR',
//   scale: 30,
//   region: box
// });






