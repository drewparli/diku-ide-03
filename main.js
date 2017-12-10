/* Run the main function after the index page loads */
d3.select(window).on('load', main("trump-tree.json"));

function main(filename) {d3.json(filename, visualize)}

/* This is the main routine */
function visualize(data) {

  // set the dimensions and margins of the diagram
  var margin = {top: 50, right: 60, bottom: 50, left: 60},
      width = 900 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;

  /* using d3's tree layout */
  var trumpTree = d3.tree()
      .size([height, width])  // height, width => Horizontal layout

  //  assigns the data to a hierarchy using parent-child relationships
  var childNodes = d3.hierarchy(data, children);

  console.log(childNodes.data)

  /*
  d3.hierarchy takes an optional `children` accessor function, we can use
  this to tell d3 where find find children nodes in the data structure
  */
  function children(d) {
    // console.log(d.name, d)
    return d.partners ? d.partners : d.children}

  // console.log("childNodes", childNodes)

  // maps the node data to the tree layout
  childNodes = trumpTree(childNodes);


  // append the svg obgect to the body of the page
  // appends a 'group' element to 'svg'
  // moves the 'group' element to the top left margin
  var svg = d3.select("body")
    .attr("class", "vis")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom),

  gLinks = svg.append("g")
    .attr("id", "links")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  gNodes = svg.append("g")
    .attr("id", "nodes")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

  // adds each node as a group
  var node = gNodes.selectAll(".node")
    .data(childNodes.descendants())

    .enter()
    .append("g")
    .attr("class", function(d)
      {
        return "node" +
          (d.children ? " node--internal" : " node--leaf")
      })
    .attr("transform", function(d)
      {
        // console.log(d)
        d.y = d.depth * 150
        return "translate(" + d.y + "," + d.x + ")"
      })

  /* For each node, we add an svg rectangle */
  node.append("rect")
    .attr("width", 100)
    .attr("height", 20)
    .attr("transform", "translate(-50, -10)")

  /* For each node, we add the person's name */
  node.append("text")
    .attr("x", function(d) { return 0 })
    .attr("y", function(d) { return 3 })
    .style("text-anchor", "middle")
    .text(function(d) { return d.data.name; });


  //
  gLinks.selectAll(".link2")
      // use slice since we only want the childNodes and not the current node
      .data(childNodes.descendants().slice(1))

      .enter()
      .append("path")
      .attr("class", "link2")
      .attr("d",
        function(d) {
          if (d.parent.parent == null) {
            return "M" + d.y + "," + d.x
          } else {return d.parent.parent.data.partners ? "M" + d.y + "," + d.x +
      "V" + d.parent.parent.x + "H" + d.parent.parent.y : "M" + d.y + "," + d.x}
        })
  // adds the links between the nodes
  gLinks.selectAll(".link1")
      // use slice since we only want the childNodes and not the current node
      .data(childNodes.descendants().slice(1))

      .enter()
      .append("path")
      .attr("class", "link1")
      .attr("d",
        function(d) {
          return d.parent.data.children ? "M" + d.y + "," + d.x +
                 "V" + d.parent.x + "H" + d.parent.y
                 : "M0,0"
        })
}