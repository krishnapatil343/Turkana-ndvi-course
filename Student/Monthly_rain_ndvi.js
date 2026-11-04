var site = geometry.buffer(2500);
Map.centerObject(site, 12);
Map.addLayer(site, {color: 'yellow'}, 'Sampling buffer');

var start = ee.Date('2015-01-01');
var chirps = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
    .select('precipitation');
var raw = ee.ImageCollection('MODIS/061/MOD13Q1');
var ndvi = raw.map(function (im) {
  return im.select('NDVI').multiply(0.0001)
      .updateMask(im.select('SummaryQA').eq(0))
      .updateMask(im.select('DetailedQA').rightShift(11).bitwiseAnd(7).eq(1))
      .copyProperties(im, ['system:time_start']);
});
var rainGrid = ee.Image(chirps.first()).projection();
var ndviGrid = ee.Image(raw.first()).select('NDVI').projection();

var rows = ee.List.sequence(0, 95).map(function (m) {
  var d0 = start.advance(m, 'month');
  var d1 = d0.advance(1, 'month');
  var rain = chirps.filterDate(d0, d1).sum().rename('rain_mm');
  var green = ndvi.filterDate(d0, d1).mean().rename('ndvi');
  var r = rain.reduceRegion({
    reducer: ee.Reducer.first(), geometry: geometry, crs: rainGrid
  });
  var v = green.reduceRegion({
    reducer: ee.Reducer.mean(), geometry: site, crs: ndviGrid
  });
  return ee.Feature(null, r.combine(v)).set('month', d0.format('YYYY-MM'));
});
var table = ee.FeatureCollection(rows).sort('month');
print('Expected monthly rows', table.size());
print(ui.Chart.feature.byFeature(table, 'month', ['rain_mm']));
print(ui.Chart.feature.byFeature(table, 'month', ['ndvi']));
Export.table.toDrive({
  collection: table, description: 'turkana_rain_ndvi_monthly',
  fileFormat: 'CSV', selectors: ['month', 'rain_mm', 'ndvi']
});