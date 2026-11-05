# Choose your study boundary

Open the updated notebook from this repository or download it and upload it to Colab. Existing Google Drive copies keep their own code.

1. Run the connection and product cells.
2. Run the interactive map cell. It uses an Esri imagery basemap.
3. Choose one boundary method in the following cell.
   - **draw** — use the rectangle or polygon tool on the map, finish the shape and then run the boundary cell.
   - **upload** — select one ZIP containing the .shp, .shx, .dbf and .prj files with matching names, or one GeoJSON file. The code reads its coordinate system and converts it to WGS 84.
   - **coordinates** — enter west, south, east and north separated by commas.
4. Inspect the yellow boundary and NDVI layer before extraction. Both rainfall and NDVI are averaged over this area at their native grid scales.
5. Run the remaining cells. The Drive output folder includes study_boundary.geojson, two CSV tables and two figures.

Use a compact rangeland area and document why you selected it. Re-run extraction and analysis after changing the boundary.
