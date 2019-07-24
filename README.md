
<img src="https://cusp.nyu.edu/wp-content/uploads/2017/12/PNG-logo-01.png" width="40%" height="40%">

# Urban Flooding Susceptibility Index - CUSP Capstone 2019 <br>

**Davey Ives ([GitHub](https://github.com/dives88)) - Rachel Sim ([GitHub](https://github.com/rachelsmc?tab=repositories))- Tarek Arafat - Vivaldi Rinaldi ([GitHub](https://github.com/varinaldi))** <br>

Mapping NYC Urban Flooding Susceptibility from extreme rainfall using remote sensing observations, frequency ratio, and machine learning techniques. View our maps [here](https://dhi211.wixsite.com/nyc-ufsi-map).<br>


<br>

There are 3 notebooks in this repo:
1. MLmodels
2. WorkingWithSAR
3. Top311

<br>


### MLmodels.ipynb
This notebook runs through five ML techniques for Positive-Unlabeled learning. Data required:
- rasters of feature layers in same dimensions
- raster of 311 flood complaint layerin same dimension

Standard packages are used with the exception of baggingPU, script can be found [here](https://github.com/roywright/pu_learning/blob/master/baggingPU.py), credits to Roy Wright.

### WorkingWithSAR.ipynb
This notebook runs through the filtering method for 311 complaints used in the analysis. Data required:
- 311 complaints from NYC Open Data

### WorkingWithSAR.ipynb
This notebook runs through SAR image identification using Google Earth Engine API, filtered 311 calls, and precipitation condition. Data required:
- 311 calls from NYC Open Data
- Historical weather condition from NOAA

<br>

GEE folder consists of the scripts written on Google Earth Engine Code Editor, which are written in JavaScript.

