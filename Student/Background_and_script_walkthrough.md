# NDVI and rainfall in North Turkana

NDVI = (near infrared − red) / (near infrared + red). Green leaves usually reflect near infrared strongly and absorb red light. Compare vegetation, bare soil and water on a map before interpreting an NDVI time series. The thesis compared rainfall and NDVI visually at Gaterongerai and Tapernawl (§5.3.1, pp. 47–49). This lab measures the lag and checks how much of the relationship remains after removing seasonal means.

| Product | Scale and timing | Use and access |
|---|---|---|
| MODIS Terra MOD13Q1 v6.1 | 250 m, 16-day composite, NDVI scale factor 0.0001 | Core vegetation series. [Earth Engine catalog](https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1). For an optional sample, search MOD13Q1 v6.1 in [NASA Earthdata Search](https://search.earthdata.nasa.gov/) and sign in with your own Earthdata credentials. |
| Sentinel-2 harmonized surface reflectance | B8 near infrared and B4 red at 10 m, nominal five-day revisit with two satellites | Optional single-date NDVI demonstration after cloud screening. [Earth Engine catalog](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED). |
| CHIRPS daily v2 | 0.05° grid, roughly 5–6 km near Turkana, daily precipitation depth | Core rainfall series. Sum days to mm/month. Adapted from Ioana’s proposal. [Earth Engine catalog](https://developers.google.com/earth-engine/datasets/catalog/UCSB-CHG_CHIRPS_DAILY). |

## Setup

Earth Engine runs geospatial analysis in a browser. Open the [Code Editor](https://code.earthengine.google.com/), sign in with your own Google credentials, and select an instructor-provided Earth Engine enabled Cloud project or register an eligible project. Confirm access before class. [Access guide](https://developers.google.com/earth-engine/guides/access)

## Run and check each block

1. **Site.** Draw a point named `geometry` on rangeland in North Turkana. `buffer(2500)` creates a 2.5 km sampling region. Run and check the yellow outline against the satellite basemap. Record longitude, latitude and land cover. Capture the map.
2. **Products.** An `ImageCollection` contains dated rasters. `select` chooses a band. The MODIS mask retains good-quality land pixels, then the scale factor converts stored integers to unitless NDVI.
3. **Monthly summaries.** `filterDate` selects observations between the first day of the month and the first day of the next month. Sum rainfall through time and sample its grid cell at the point. Average MODIS composites by timestamp month and use `reduceRegion` to average over the buffer. Inspect both charts. Rainfall should be nonnegative and NDVI should fall between −0.2 and 1. Capture the charts.
4. **Export.** A `FeatureCollection` holds one row per month. Run the CSV export from Tasks and download the result from Google Drive. Sort by month and verify 96 unique consecutive months from January 2015 to December 2022.
5. **Lag workbook.** Paste only the two numeric data columns into B9:C104, aligned to the prefilled months. Leave missing values blank. At lag 1, January rainfall pairs with February NDVI. The workbook subtracts each calendar month's mean and compares correlations with matched numeric pairs. Check the pair counts. Use the Word guide's hand calculation to verify at least one lag. Capture the first calculation.
6. **Interpret.** Compare the strongest positive lag before and after removing the seasonal cycle. A weak or broad peak leaves the delay uncertain. Independent validation would be needed before interpreting the lag as a forecast lead time.

## Optional interactive map

Open a fresh Code Editor script and paste Interactive_Map.js after drawing the same geometry. Choose a year and month to display the screened NDVI composite. Compare a wet month with the following month using your exported rainfall and NDVI charts. The instructor can adapt this to a published [Earth Engine App](https://developers.google.com/earth-engine/guides/apps) by replacing the drawn geometry with approved site coordinates.

