
<img src="https://cusp.nyu.edu/wp-content/uploads/2017/12/PNG-logo-01.png" width="40%" height="40%">

# Urban Flooding Susceptibility Index - CUSP Capstone 2019 <br>

**Davey Ives ([GitHub](https://github.com/dives88)) - Rachel Sim ([GitHub](https://github.com/rachelsmc?tab=repositories))- Tarek Arafat - Vivaldi Rinaldi ([GitHub](https://github.com/varinaldi))** <br>

Mapping NYC Urban Flooding Susceptibility from extreme rainfall using remote sensing observations, frequency ratio, and machine learning techniques. View our maps [here](ADDLINKHERE).<br>


<br>

There are ___ notebooks in this repo:
1. MLmodels
2. Vivaldi's notebooks (SAR?)
3. Vivaldi's R script

<br>


### MLmodels.ipynb
This notebook runs through five ML techniques for Positive-Unlabeled learning. Data required:
- rasters of feature layers in same dimensions
- raster of 311 flood complaint layerin same dimension

Standard packages are used with the exception of baggingPU, script can be found [here](https://github.com/roywright/pu_learning/blob/master/baggingPU.py), credits to Roy Wright.
