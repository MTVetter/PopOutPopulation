var svg = d3.select("svg");

//lookup svg width and height from DOM instead of hard-coding values
var svgWidth = +svg.attr("viewBox").split(" ")[2],
  svgHeight = +svg.attr("viewBox").split(" ")[3];

//get reference to the <rect> node, which is invisible and in the background
//wire up a click listener so that the brought up feature can be "reset" later
var rect = svg.select("rect.background").on("click", reset);

//Get reference to the <g> node
//GeoJSON features will be drawn here
var g = svg.select("g");

//The D3 geographic path generator is used for drawing the svg paths of GeoJSON
//And during bounding box calculations
var projection = d3.geoAlbers()  
  .center([-10, 28])
  .rotate([45, -15, 0])
  .translate([400, 300])
  .scale(450);
var geoPathGenerator = d3.geoPath()
  .projection(projection);

//Transition-relate variables
var activeFeature = d3.select(null),
  transitionDuration = 1250,
  featureStrokeWidth = 0.75,
  featureStroke = "#fff",
  featureFill = "#a6bddb",
  //During transition:
  // -swap stroke and fill colors
  // -change stroke width
  broughtUpFeatureStrokeWidth = 3,
  broughtUpFeatureStroke = "#a6bddb",
  broughtUpFeatureFill = "#e8e8e8",
  totalPop;

//Color symbology for the counties based on the 2016 population totals
var color = d3.scaleThreshold()
  .domain([10000, 20000, 40000, 80000, 500000, 1000000])
  .range(["#fff", "#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"]);


//Load and draw the counties
d3.json("data/deleteTesting.json").then(function(loadedTopoJson) {

  var allCountiesGeoJsonData = topojson.feature(loadedTopoJson,loadedTopoJson.objects.counties).features;

  var attrArray = ["tp_1980","per_sqmile_80","tp_1990","per_sqmile_90","tp_2000","per_sqmile_00","tp_2010","per_sqmile_10","tp_2016","per_sqmile_16","Area_SqMi"];

  //Load the CSV data
  d3.csv("data/population.csv").then(function(loadCSV) {
    for (var i=0; i<loadCSV.length; i++){
      var csvCounty = loadCSV[i];
      var csvKey = csvCounty.name;

      for (var a=0; a<allCountiesGeoJsonData.length; a++){
        var geojsonProps = allCountiesGeoJsonData[a].properties;
        var geojsonKey = geojsonProps.County;

        if (geojsonKey == csvKey){
          attrArray.forEach(function(attr){
            var val = parseFloat(csvCounty[attr]);
            geojsonProps[attr] = val;
          });
        }
      }
    }
    
    //Get the 2016 population for each county 
    totalPop = {};
    loadCSV.forEach(function(d){
      totalPop[d.name] = +d.tp_2016;
    });

    //Add the counties to the svg
    g.selectAll("path")
      .data(allCountiesGeoJsonData)
      .enter()
      .append("path")
      .attr("d", geoPathGenerator)
      .attr("class", "feature")
      .style("fill", function(d){
        return color(totalPop[d.properties.County]);
      })
      .on("click", bringUpFeature);
  });
});


function bringUpFeature(geoJsonDatum) {
  if (activeFeature.node() === this) {
    return reset();
  }

  activeFeature.classed("active-feature", false);

  activeFeature = d3
    .select(this)
    .classed("active-feature", true)
    .raise();

  var t = getGeoBoundsTransform(
    geoJsonDatum,
    geoPathGenerator,
    svgWidth,
    svgHeight
  );

  console.log(t);

  activeFeature
    .transition()
    .duration(transitionDuration)
    .style("stroke-width", broughtUpFeatureStrokeWidth / t.scale + "px")
    .style("stroke", "#000")
    .style("fill", function(d){
      return color(totalPop[d.properties.County])
    })
    .attr("transform", "translate(" + t.translate + ") scale(" + t.scale + ")"
    );

  var otherFeatures = g.selectAll("path.feature:not(.active-feature");

  //Remove the original click listener before transitioning the other features out of view
  otherFeatures.on("click", null);

  otherFeatures
    .transition()
    .duration(transitionDuration)
    .style("opacity", "0")
    .on("end", function(d, idx, nodeList) {
      //Completely remove the display of the other features after transition is over
      if (idx === nodeList.length - 1) {
        otherFeatures.style("display", "none");
      }
    });

  //Create a function to add a comma to the numbers
  var formatComma = d3.format(",");
  var formatDec = d3.format(",.2f");

  //Set the opacity of the fields to 100%
  d3.selectAll("#pop").style("opacity", "100");

  //Select the appropriate div to add the text
  d3.select("#title")
    .text(geoJsonDatum.properties.County)
    .style("font-size", "65px")
    .style("font-family", "Yellowtail")
    .style("opacity", "100");

  d3.select("#county-1980-pop")
    .text(formatComma(geoJsonDatum.properties.tp_1980))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");

  d3.select("#county-1990-pop")
    .text(formatComma(geoJsonDatum.properties.tp_1990))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");

  d3.select("#county-2000-pop")
    .text(formatComma(geoJsonDatum.properties.tp_2000))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");

  d3.select("#county-2010-pop")
    .text(formatComma(geoJsonDatum.properties.tp_2010))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");

  d3.select("#county-2016-pop")
    .text(formatComma(geoJsonDatum.properties.tp_2016))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");

  d3.select("#county-sqMile1980")
    .text(formatDec(geoJsonDatum.properties.per_sqmile_80))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");

  d3.select("#county-sqMile1990")
    .text(formatDec(geoJsonDatum.properties.per_sqmile_90))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");

  d3.select("#county-sqMile2000")
    .text(formatDec(geoJsonDatum.properties.per_sqmile_00))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");

  d3.select("#county-sqMile2010")
    .text(formatDec(geoJsonDatum.properties.per_sqmile_10))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");

  d3.select("#county-sqMile2016")
    .text(formatDec(geoJsonDatum.properties.per_sqmile_16))
    .style("font-size", "25px")
    .style("margin-bottom", "-10px")
    .style("opacity", "100");
}

function reset() {
  activeFeature
    .transition()
    .duration(transitionDuration)
    .style("stroke-width", featureStrokeWidth)
    .style("stroke", featureStroke)
    .style("fill", function(d){
      return color(totalPop[d.properties.County]);
    })
    .attr("transform", "");

  var otherFeatures = g.selectAll("path.feature:not(.active-feature)");

  //Reset display of other features before transitioning back into the view
  otherFeatures.style("display", "");

  otherFeatures
    .transition()
    .duration(transitionDuration)
    .style("opacity", "1")
    .on("end", function(d, idx, nodeList) {
      //Reestablish the original click listener after transition is over
      if (idx === nodeList.length - 1) {
        otherFeatures.on("click", bringUpFeature);
      }
    });

  activeFeature.classed("active-feature", false);
  activeFeature = d3.select(null);

  //Reset the text
  d3.selectAll("#pop").style("opacity", "0");
  d3.select("#title").style("opacity", "0");
  
}

function getGeoBoundsTransform(geoJsonDatum, geoPathGenerator, width, height) {
    var bounds = geoPathGenerator.bounds(geoJsonDatum),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = 0.9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    return {
        translate: translate,
        scale: scale
    };
}
