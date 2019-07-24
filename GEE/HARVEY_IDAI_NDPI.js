
// reducers for later use
var maxReducer = ee.Reducer.max();
var minReducer = ee.Reducer.min();
var meanReducer = ee.Reducer.mean();
var stdDevReducer = ee.Reducer.stdDev();




// Harvey made landfall on August 25
var date_start = ee.Date("2017-08-25")
var date_end = ee.Date("2017-09-02")

var ref_start = ee.Date("2017-07-1")
var ref_end = ee.Date("2017-08-1")


// Specify the city location geometry. Increasing width and height too much will result in error due to too many pixels for the histogram

// HARVEY
var centerX = -95.10, centerY = 29.75; var width = 0.35, height = 0.35; 

// IDAI
// var centerX = 34.62611, centerY = -19.8791; var width = 0.25, height = 0.355; 

var geometry = ee.Geometry.Rectangle( [centerX+width,centerY+height,  centerX-width,centerY-height]);

//Draw a box around the region of interest 
var box = ee.Geometry.Rectangle(
[centerX+width,centerY+height, 
 centerX-width,centerY-height]); 


// Map.addLayer(box, {}, 'box')
//Center the mapview around your area
Map.centerObject(geometry, 10);


// Get the VH collection.
var collection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
    .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
    .filter(ee.Filter.eq('resolution', 'H'))
    .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
    .filterBounds(box);
    //.filterBounds(geometry) //Turn this line of code on to only take images from your region of interest (makes rendering faster)




// HARVEY
var r = collection.filterDate(ref_start, ref_end).reduce(meanReducer).rename(['VV', 'VH', 'Angel']).clip(box);
var f = collection.filterDate(ref_start, date_end).reduce(minReducer).rename(['VV', 'VH', 'Angel']).clip(box); 

var fx = collection.filterDate(ref_start, date_end).reduce(maxReducer).rename(['VV', 'VH', 'Angel']).clip(box);
var rx = collection.filterDate(ref_start, ref_end).reduce(maxReducer).rename(['VV', 'VH', 'Angel']).clip(box); 

// // IDAI
// var r =  collection.filterDate('2019-01-01', '2019-03-14').reduce(meanReducer).rename(['VV', 'VH', 'Angel']).clip(box); 
// var f = collection.filterDate('2019-01-01', '2019-03-22').reduce(minReducer).rename(['VV', 'VH', 'Angel']).clip(box); 
// var fx = collection.filterDate('2019-01-01', '2019-03-22').reduce(maxReducer).rename(['VV', 'VH', 'Angel']).clip(box); 


//Add the images to the map


// Map.addLayer(r, {min: -20, max: 0}, 'Reference min', 0);
// Map.addLayer(f, {min: -20, max: 0}, 'Flood min', 0);
// Map.addLayer(fx, {min: -20, max: 0}, 'Flood max', 0);


// -----------------------------------------------------//
// ------------- CALCULATE NDFI and NDFVI -------------//
// ---------------------------------------------------//

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

print(r)

Map.addLayer(fx.select(['NDPI']), {min: -1, max: 1, palette:['blue', 'white', 'red']}, 'F NDPI', 0);
Map.addLayer(rx.select(['NDPI']), {min: -1, max: 1, palette:['blue', 'white', 'red']}, 'R NDPI', 0);



// --------------------------------------------//
// NDFI = minRef - minFld / minRef + minFld //
// ------------------------------------------//
function getNDFI(ref, flood){
  
  var smoothing = 75;
  var r  = ref.select(['VV']);
  var f  = flood.select(['VV']);

  Map.addLayer(r, {min: -20, max: 0}, 'ref VV', 0);
  Map.addLayer(f, {min: -20, max: 0}, 'Flood VV', 0);
  
  var stack = r.addBands(f).rename(['r','f']);
  
  var ndfi  = stack.abs().focal_median(smoothing, 'circle', 'meters').normalizedDifference(['r','f']).rename('NDFI');
  
  return stack.addBands(ndfi) 
  
}



var NDFI = getNDFI(r, f);

print("ndfi", NDFI)

Map.addLayer(NDFI.select('NDFI'), {min:-1, max:1, palette:['white', 'black']}, 'NDFI',0)



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


Map.addLayer(NDFVI.select(['NDFVI']), {min:-1, max:1}, 'NDFVI', 0)


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
Map.addLayer(NDPFI.select(['NDPFI']), {min:-1, max:1}, 'NDPFI', 0)

print("ndpfi", NDPFI.select(['NDPFI']))


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



// -------------------------------- Otsu Function ------------------------------------
// Return the DN that maximizes interclass variance in VV (in the region).
var otsu = function(histogram) {
  var counts = ee.Array(ee.Dictionary(histogram).get('histogram'));
  var means = ee.Array(ee.Dictionary(histogram).get('bucketMeans'));
  var size = means.length().get([0]);
  var total = counts.reduce(ee.Reducer.sum(), [0]).get([0]);
  var sum = means.multiply(counts).reduce(ee.Reducer.sum(), [0]).get([0]);
  var mean = sum.divide(total);
  
  var indices = ee.List.sequence(1, size);
  
  // Compute between sum of squares, where each mean partitions the data.
  var bss = indices.map(function(i) {
    var aCounts = counts.slice(0, 0, i);
    var aCount = aCounts.reduce(ee.Reducer.sum(), [0]).get([0]);
    var aMeans = means.slice(0, 0, i);
    var aMean = aMeans.multiply(aCounts)
        .reduce(ee.Reducer.sum(), [0]).get([0])
        .divide(aCount);
    var bCount = total.subtract(aCount);
    var bMean = sum.subtract(aCount.multiply(aMean)).divide(bCount);
    return aCount.multiply(aMean.subtract(mean).pow(2)).add(
          bCount.multiply(bMean.subtract(mean).pow(2)));
  });
  
  print(ui.Chart.array.values(ee.Array(bss), 0, means));
  
  // Return the mean value corresponding to the maximum BSS.
  return means.sort(bss).get([-1]);
};








// // // // ---- apply threshold -----

var flood_ndfi = NDFI.select('NDFI').lt(ndfiThres(NDFI.select(['NDFI'])));
var flood_ndfvi = NDFVI.select('NDFVI').gt(ndfviThres(NDFVI.select(['NDFVI'])));
var flood_ndpfi = NDPFI.select('NDPFI').gt(ndfviThres(NDPFI.select(['NDPFI'])));


// map
Map.addLayer(flood_ndfi.updateMask(flood_ndfi),
{min:0, max:1, palette:"blue"},'flood_ndfi',0);

Map.addLayer(flood_ndfvi.updateMask(flood_ndfvi),
{palette:"green"},'flood_ndvfi' ,0);

Map.addLayer(flood_ndpfi.updateMask(flood_ndpfi),
{palette:"red"},'flood_ndvfi' ,0);

