/* North Turkana rainfall and NDVI | Earth Engine Code Editor
 * Draw a compact rangeland polygon and name the import geometry.
 * Alternatively set boundaryAsset to an uploaded polygon table asset ID.
 * Run the script, then start each CSV export under Tasks.
 */
var boundaryAsset = '';
if (!boundaryAsset && typeof geometry === 'undefined') {
  throw new Error('Draw a polygon named geometry or enter a boundary asset ID.');
}
var region = boundaryAsset
    ? ee.FeatureCollection(boundaryAsset).geometry()
    : ee.Geometry(geometry);

var start = ee.Date('2015-01-01');
var months = ee.List.sequence(0, 95);
var rainDaily = ee.ImageCollection('UCSB-CHG/CHIRPS/DAILY')
    .select('precipitation');
var modis = ee.ImageCollection('MODIS/061/MOD13Q1');
var ndvi = modis.map(function (image) {
  var good = image.select('SummaryQA').eq(0);
  var land = image.select('DetailedQA').rightShift(11).bitwiseAnd(7).eq(1);
  return image.select('NDVI').multiply(0.0001).updateMask(good.and(land))
      .copyProperties(image, ['system:time_start']);
});
var rainGrid = rainDaily.first().projection();
var ndviGrid = modis.first().select('NDVI').projection();

function monthlyRow(offset) {
  offset = ee.Number(offset);
  var begin = start.advance(offset, 'month');
  var end = begin.advance(1, 'month');
  var rain = rainDaily.filterDate(begin, end).sum().rename('rain_mm');
  var green = ndvi.filterDate(begin, end).mean().rename('ndvi');
  var rainfall = rain.reduceRegion({
    reducer: ee.Reducer.mean(), geometry: region, crs: rainGrid,
    maxPixels: 1e8, tileScale: 2
  });
  var greenness = green.reduceRegion({
    reducer: ee.Reducer.mean(), geometry: region, crs: ndviGrid,
    maxPixels: 1e8, tileScale: 2
  });
  return ee.Feature(null, rainfall.combine(greenness)).set({
    offset: offset, month: begin.format('YYYY-MM'), calendar_month: begin.get('month')
  });
}
var monthly = ee.FeatureCollection(months.map(monthlyRow)).sort('offset');

Map.setOptions('SATELLITE');
Map.centerObject(region, 11);
Map.addLayer(ndvi.filterDate('2020-04-01', '2020-05-01').mean().clip(region),
    {min: 0, max: 0.5, palette: ['f5e8c7', '78b56c', '155d27']}, 'April 2020 NDVI');
Map.addLayer(ee.FeatureCollection([ee.Feature(region)]).style({
  color: 'FFFF00', fillColor: '00000000', width: 2
}), {}, 'Study boundary');

var preview = ee.FeatureCollection(ee.List.sequence(60, 71).map(monthlyRow)).sort('offset');
print(ui.Chart.feature.byFeature(preview, 'month', ['rain_mm'])
    .setOptions({title: '2020 preview: rainfall', vAxis: {title: 'mm per month'}}));
print(ui.Chart.feature.byFeature(preview, 'month', ['ndvi'])
    .setOptions({title: '2020 preview: NDVI', vAxis: {title: 'NDVI'}, interpolateNulls: false}));

Export.table.toDrive({
  collection: monthly, description: 'Turkana_monthly_rain_ndvi',
  folder: 'Turkana NDVI Course', fileFormat: 'CSV',
  selectors: ['month', 'rain_mm', 'ndvi']
});

// Calculate each variable's calendar-month mean from available observations.
var climatology = ee.FeatureCollection(ee.List.sequence(1, 12).map(function (month) {
  var subset = monthly.filter(ee.Filter.eq('calendar_month', month));
  return ee.Feature(null, {
    calendar_month: month,
    rain_mean: subset.aggregate_mean('rain_mm'),
    ndvi_mean: subset.aggregate_mean('ndvi')
  });
}));
// Keep independent missingness for the two variables before pairing.
function anomalySeries(band, meanBand, outputBand) {
  return monthly.filter(ee.Filter.notNull([band])).map(function (row) {
    var baseline = ee.Feature(climatology.filter(
        ee.Filter.eq('calendar_month', row.get('calendar_month'))).first());
    return row.set(outputBand, ee.Number(row.get(band)).subtract(baseline.get(meanBand)));
  });
}
var rainAnom = anomalySeries('rain_mm', 'rain_mean', 'rain_anomaly');
var ndviAnom = anomalySeries('ndvi', 'ndvi_mean', 'ndvi_anomaly');

function lagStats(rainRows, greenRows, rainBand, greenBand, lag) {
  var earlier = rainRows.filter(ee.Filter.notNull([rainBand])).map(function (row) {
    return row.set('target_offset', ee.Number(row.get('offset')).add(lag));
  });
  var later = greenRows.filter(ee.Filter.notNull([greenBand]));
  var pairs = ee.FeatureCollection(ee.Join.inner().apply(earlier, later,
      ee.Filter.equals({leftField: 'target_offset', rightField: 'offset'})))
      .map(function (pair) {
        return ee.Feature(null, {
          x: ee.Feature(pair.get('primary')).get(rainBand),
          y: ee.Feature(pair.get('secondary')).get(greenBand)
        });
      });
  var count = pairs.size();
  var r = ee.Algorithms.If(count.gte(2), pairs.reduceColumns({
    reducer: ee.Reducer.pearsonsCorrelation(), selectors: ['x', 'y']
  }).get('correlation'), null);
  return ee.Dictionary({r: r, pairs: count});
}
var lags = ee.FeatureCollection(ee.List.sequence(0, 4).map(function (lag) {
  var raw = lagStats(monthly, monthly, 'rain_mm', 'ndvi', lag);
  var adjusted = lagStats(rainAnom, ndviAnom, 'rain_anomaly', 'ndvi_anomaly', lag);
  return ee.Feature(null, {
    lag_months: lag, raw_r: raw.get('r', null), raw_pairs: raw.get('pairs'),
    anomaly_r: adjusted.get('r', null), anomaly_pairs: adjusted.get('pairs')
  });
}));
Export.table.toDrive({
  collection: lags, description: 'Turkana_lag_results',
  folder: 'Turkana NDVI Course', fileFormat: 'CSV',
  selectors: ['lag_months', 'raw_r', 'raw_pairs', 'anomaly_r', 'anomaly_pairs']
});
