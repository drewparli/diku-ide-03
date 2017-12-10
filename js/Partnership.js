/* This is the main data structure for the whole visualization. */
function Partnership() {
  this.members = []
  this.children = []
  this.status = null
}



/* This is the main routine */
function main(filename)
{
  d3.csv(filename, function(data)
  {
    var vis = new Visualization()
    initVis(vis)
    preprocessData(vis, data)
    console.log("VIS", vis)
	addMinMaxArea(vis)
    addTempLines(vis)
    addMeanDeviations(vis)
  })
}

function preprocessData(vis, data)
{

  /*
  d is a single year in the temperature dataset
  Loop through to find yearly stats and collect values for overall stats
  */
  vis.data = data.map(function(d)
  {
    let y = d.YEAR
    let t = [d.JAN, d.FEB, d.MAR, d.APR, d.MAY, d.JUN,
             d.JUL, d.AUG, d.SEP, d.OCT, d.NOV, d.DEC].map(Number)
    // TODO: add mean temp for whole range of years by month
    // TODO: find standard deviation from this mean for each data point

    let sum = 0
    let min = 100   // only for the current year
    let max = -100
    for (var i = 0; i <= t.length - 1; i++) {
      if (t[i] != 999.9)
        {
          /* check overall and yearly min-max temperatures */
          if (t[i] > max) {max = t[i]}
          if (t[i] < min) {min = t[i]}
          if (t[i] > vis.gdata.max[i]) {vis.gdata.max[i] = t[i]}
          if (t[i] < vis.gdata.min[i]) {vis.gdata.min[i] = t[i]}

          /* collect for yearly average */
          sum += t[i];

          /* collect value for calculating monthly average */
          if (parseFloat(d.YEAR) < 1980) {vis.gdata.mean[i].push(t[i])}

        } else {continue;
          // TODO: use the average of the past few years here instead
        }
    }

    /* Find the yearly mean */
    let m = sum / t.length

    /* Create pairs of points for line segments */
    let s = mkSegments(vis, t)

    return {"mean": m,
            "min": min,
            "max": max,
            "segments": s,
            "temps": t,
            "year": y,
            };
  })

  /* make an svg polygon point list for later */
  let p = vis.gdata.max.map(function(y, x) {
      return [vis.scale.x(x) + vis.margin.left, vis.scale.y(y) + vis.margin.top]
    }).concat(
    vis.gdata.min.map(function(y, x){
      return [vis.scale.x(x) + vis.margin.left, vis.scale.y(y) + vis.margin.top]
    }).reverse()
    )

  p.forEach(function(elem, i) {
    p[i] = elem[0] + "," + elem[1]
  })

  vis.gdata.polygon = p.join(" ")

  /* Calculate overall monthly mean */
  vis.gdata.mean = vis.gdata.mean.map(function(monthArr, i)
  {
    return monthArr.reduce(sumArray) / monthArr.length
  })

  /* Calculate the standard deviation from the monthly mean for each month */
  vis.data.map(function(yearData, i)
  {
    vis.data[i]["devs"] = yearData.temps.map(function(temp, i)
    {
      if (temp != 999.9) {return temp - vis.gdata.mean[i]} else {return temp}
    })
  })
}


function mkSegments(vis, tempArr)
{
  var i = 0
  var j = 1
  var segments = []
  while (j <= tempArr.length - 1) {
    if (tempArr[i] != 999.9 && tempArr[j] != 999.9)
    {
       s = {"x1": vis.scale.x(i),
            "y1": vis.scale.y(tempArr[i]),
            "x2": vis.scale.x(j),
            "y2": vis.scale.y(tempArr[j])
            }
      segments.push(s)
    }
    i += 1;
    j += 1;
  }
  return segments
}


function initVis(vis)
{
  // Insipration for using scales - https://bl.ocks.org/mbostock/3371592
  vis.scale.x = d3.scaleLinear()
    .domain([0,11])   // this is the value on the axis
    // this is the space allocated the axis
    .range([0, vis.width - vis.margin.left - vis.margin.left])
    .nice()

  vis.scale.y = d3.scaleLinear()
    .domain([-10, 26])   // this is the value on the axis
    // this is the space allocated the axis
    .range([400 - vis.margin.top - vis.margin.bottom, 0])
    .nice()

  /* For actual temperatures */
  // vis.scale.heatmap = d3.scaleLinear()
  //   .domain([23, -7])   // this is the value on the axis
  //   // this is the space allocated the axis
  //   .range([0, 1])

  /* For temperature deviations */
  vis.scale.heatmap = d3.scaleLinear()
    .domain([7, -7])
    .range([0, 1])

  var xAxis = d3.axisBottom(vis.scale.x)
    .ticks(12)

  var yAxis = d3.axisLeft(vis.scale.y)
    .ticks(16)

  /* Adding the title */
  d3.select("body")
    .append("div")
    .append("h1")
    .attr("class", "title")
    .text("Monthly Temperature Data, Copenhagen Denmark (1880-now)")

  /* Adding the main containter for the temperature graph */
  d3.select("body")
    .append("svg")
    .attr("id", "tempGraph")
    .attr("width", 800)
    .attr("height", 400)

  /* Adding the main containter for the heat map */
  d3.select("body")
    .append("svg")
    .attr("id", "heatmap")
    .attr("transform", "translate(0," + vis.heatmap.origin.y + ")")
    .attr("width", 900)
    .attr("height", 1800)

  /* Adding some spacing at the bottom of the visualization */
  d3.select("body")
    .append("svg")
    .attr("id", "footer")
    .attr("transform", "translate(0,50)")
    .attr("width", 800)
    .attr("height", 100)

  d3.select("#tempGraph")
    .append("svg:g")
    .attr("id", "xAxis")
    .attr("class", "axis")
    .attr("transform", "translate(30,"+ (400 - 30) +")")
    .call(xAxis)
    .selectAll("line")
    .attr("class", "xLines")
    .attr("y1", -340)
    .attr("y2", 6)
    .attr("stroke", null)

  d3.select("#tempGraph")
    .append("svg:g")
    .attr("id", "yAxis")
    .attr("class", "axis")
    .attr("transform", "translate(30,30)")
    .call(yAxis)
    .selectAll("line")
    .attr("class", "yLines")
    .attr("x1", -4)
    .attr("x2", 800 - 30 - 30)
    .attr("stroke", null)

  /* remove the solid lines along the y-axis */
  d3.select("#tempGraph")
    .select("#yAxis")
    .select(".domain").remove()

  /* remove the solid lines along the y-axis */
  d3.select("#tempGraph")
    .select("#xAxis")
    .select(".domain").remove()

  /* create a group for the lines of the graph */
  d3.select("#tempGraph")
    .append("svg:g")
    .attr("id", "minMaxArea")

  d3.select("#tempGraph")
    .append("svg:g")
    .attr("id", "lines")

  /* change the labels of the x-axis */
  d3.select("#tempGraph")
    .select("#xAxis")
    .selectAll("text")
    .text(function(d,i)
    {
      return vis.months[i]
    })

  /* create a group for the cells of the heat map */
  d3.select("#heatmap")
    .append("svg:g")
    .attr("id", "rows")
}


var addTempLines = function(vis)
{
  var tempGraph = d3.select("#tempGraph")
    .select("#lines")

  var groups = tempGraph.selectAll("g")
    .data(vis.data)

  groups.enter()
    .append("svg:g")
    .attr("class", "tempLine-off")
    .attr("transform", "translate("+vis.margin.left+","+vis.margin.top+")")
    .attr("id", function(d,i)
    {
        return "_" + d.year
    })

  // add line segments for each data point
  vis.data.forEach(function(data, i)
    {
    var year = d3.select("#tempGraph")
      .select("#_" + data.year)

    var lines = year.selectAll("line")
      .data(data.segments)

    lines.enter()
      .append("svg:line")
      .attr("x1", function(seg){return seg.x1})
      .attr("x2", function(seg){return seg.x2})
      .attr("y1", function(seg){return seg.y1})
      .attr("y2", function(seg){return seg.y2})
      .attr("class", "tempLine-off")
    })

  // default is the 2017 temperature line being turned on
  d3.select("#tempGraph")
    .select("#lines")
    .select("#_2017")
    .attr("class", "tempLine-on")
}

/*
Creates a polygonal area for the min and max temperatures for the
entire dataset.
*/
var addMinMaxArea = function(vis)
{
  var vis = d3.select("#tempGraph")
    .select("#minMaxArea")
    .append("svg:polygon")
    .attr("points", vis.gdata.polygon)
    .attr("class", "min-max-area")
}


var addMeanDeviations = function(kbh)
{
  var vis = d3.select('#heatmap')
    .select("#rows")

  // add rows per year
  var groups = vis.selectAll("g")
    .data(kbh.data.reverse())

  /*
  Each row is added as an svg hyperlink. This allows us to make the
  temperature graph on top be interactive according to which row is
  clicked
  */
  groups.enter()
    .append("svg:a")
    .attr("class", "row")
    .attr("id", function(d,i)
      {
        return "_" + d.year
      })

    // event handler for when a year is clicked
    .on("click", function(d)
      {
        console.log(d) // for testing
        let dot_new = "#dot_" + d.year
        let dot_cur = "#dot_" + Current

        d3.select("#heatmap")
          .select("#rows")
          .select(dot_new)
          .attr("class", "dotOn")

        d3.select("#tempGraph")
          .select("#_" + d.year)
          .attr("class","tempLine-on")

        d3.select("#heatmap")
          .select("#rows")
          .select(dot_cur)
          .attr("class", "dotOff")

        d3.select("#tempGraph")
          .select("#_" + Current)
          .attr("class","tempLine-off")

        Current = String(d.year)
      })
    .attr("transform", function(d,i)
    {
      let x = 0
      let y = (i * kbh.box.height) + (i * 1)
      return "translate(" + x + "," + y + ")"
    })

  // add cells per month
  kbh.data.forEach(function(data, i)
    {
    var year = d3.select("#heatmap")
      .select("#rows")
      .select("#_" + data.year)

    var cells = year.selectAll("rect")
      .data(data.devs)

    cells.enter()
      .append("svg:rect")
      .attr("id", function(d,i)
      {
        return "_" + i
      })
      .attr("class", "tempCell")
      .attr("width", kbh.box.width)
      .attr("height", kbh.box.height)
      .attr("style", function(d)
      {
        if (d != 999.9) {
          let temp = kbh.scale.heatmap(d)
          return "fill:" + d3.interpolateRdBu(temp) + ";"
        }
      })
      .attr("transform", function(d,i)
      {
        var x = kbh.scale.x(i) + 30 - 32
        var y = 0
        return "translate(" + x + "," + y + ")"
      })

    /*
    This element is used to indicate which year (row) in the heat map has
    been selected.
    */
    year.append("svg:circle")
      .attr("id", function(d) { return "dot_" + d.year; })
      .attr("class", function(d)
      {
        if (d.year == "2017") {return "dotOn"} else {return "dotOff"}
      })
      .attr("transform", function(d,i)
      {
        var x = kbh.scale.x(12) + 30 - 32 + 6
        var y = 2
        return "translate(" + x + "," + y + ")"
      })
      .attr("r", 2)
      // .attr("fill", "white")

    /* Labels every fifth year. */
    year.append("svg:text")
      .attr("id", data.year)
      .attr("class", "gridYear")
      .text(function(d) { if (Number(d.year) % 5 == 0) return data.year; })
      .attr("transform", function(d,i)
      {
        var x = kbh.scale.x(12) + 30 - 32 + 14
        var y = 6
        return "translate(" + x + "," + y + ")"
      })
    })
}


/* Helper Functions */
function sumArray(total, val) {
  return total + val
}
