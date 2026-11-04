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

var layer = ui.Map.Layer(ee.Image(), {
  min: 0, max: 0.5, palette: ['f5e8c7', '78b56c', '155d27']
}, 'Monthly NDVI');
Map.layers().insert(0, layer);
var years = ui.Select(['2015','2016','2017','2018','2019','2020','2021','2022']);
var months = ui.Select(['01','02','03','04','05','06','07','08','09','10','11','12']);
function update() {
  if (!years.getValue() || !months.getValue()) return;
  var date = ee.Date(years.getValue() + '-' + months.getValue() + '-01');
  layer.setEeObject(ndvi.filterDate(date, date.advance(1, 'month')).mean().clip(site.buffer(10000)));
  layer.setName('NDVI ' + years.getValue() + '-' + months.getValue());
}
years.onChange(update);
months.onChange(update);
Map.add(ui.Panel([ui.Label('North Turkana monthly NDVI'), years, months],
    ui.Panel.Layout.flow('horizontal'), {position: 'top-left'}));
years.setValue('2020');
months.setValue('04');
