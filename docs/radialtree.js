var svg = d3.select("svg")
  .style("display", "block")
  .style("margin", "auto")
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight),
  width = +svg.attr("width"),
  height = +svg.attr("height"),
  g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var stratify = d3.stratify().parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

var cluster = d3.cluster().size([360, Math.min(width, height) / 2 - 150]);

var root;

//hierarchy order: ocean - species - archetype
// load data
d3.csv('../data/final_use_updated.csv').then((data) => {
  // Step 1: Extract unique oceans, species, and archetypes to create hierarchical nodes
  const fishNode = {
    id: 'Fish',
    parentId: null
  };

  // Create a list of unique oceans
  const oceans = Array.from(new Set(data.map(d => d.ocean))).map(ocean => ({
    id: `Fish.${ocean}`,
    parentId: 'Fish'
  }));

  // Create a list of unique species with their ocean as parent
  const species = Array.from(new Set(data.map(d => `${d.ocean}.${d.species}`))).map(speciesKey => {
    const [ocean, species] = speciesKey.split('.');
    return {
      id: `Fish.${ocean}.${species}`,
      parentId: `Fish.${ocean}`
    };
  });

  // Create archetype nodes with their species as parent
  const archetypes = data.map((d, i) => ({
    id: `Fish.${d.ocean}.${d.species}.${d.archetype}.${i}`,
    parentId: `Fish.${d.ocean}.${d.species}`
  }));

  // Combine all nodes into one data array
  const allData = [fishNode, ...oceans, ...species, ...archetypes];

  console.log('Data before validation:', allData);

  // Step 2: Create a set of all valid IDs
  const idSet = new Set(allData.map(d => d.id));

  // Step 3: Filter data to only include nodes where parentId exists in idSet
  const validatedData = allData.filter(d => !d.parentId || idSet.has(d.parentId));

  // Step 4: Log validated data and missing parents for further investigation
  const missingParents = validatedData.filter(d => d.parentId && !idSet.has(d.parentId));
  if (missingParents.length > 0) {
    console.error('Missing Parent Nodes:', missingParents);
    throw new Error('Some nodes have missing or invalid parents.');
  }

  console.log('Validated Data:', validatedData);

  if (validatedData.length === 0) {
    throw new Error("No valid data available after validation");
  }

  // Step 5: Create the hierarchy using d3.stratify
  try {
    const stratify = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parentId);

    const root = stratify(validatedData)
      .sort((a, b) => a.height - b.height || a.id.localeCompare(b.id));

    if (!root) {
      throw new Error("No root created, check data structure");
    }

    // Step 6: Proceed with clustering and visualization
    cluster(root);

    const link = g.selectAll(".link")
      .data(root.descendants().slice(1));

    link.transition()
      .delay(300)
      .duration(600)
      .attr("d", diagonal);

    link.enter().append("path")
      .attr("class", "link")
      .attr("d", diagonal)
      .style("opacity", 0)
      .transition()
      .duration(100)
      .delay((d, i) => 7 * i)
      .style("opacity", 0.2);

    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
      .attr("transform", d => "translate(" + project(d.x, d.y) + ")")
      .attr("dy", "1em"); // Adjust the spacing between nodes

    node.append("circle")
      .attr("r", 2)
      .style("opacity", 0)
      .transition()
      .duration(300)
      .delay((d, i) => 14 * i)
      .style("opacity", 0.5);

    node.append("text")
      .attr("dy", ".31em")
      .attr("x", d => d.x < 180 === !d.children ? 10 : -10)
      .attr("text-anchor", d => d.x < 180 === !d.children ? "start" : "end")
      .style("opacity", 0)
      .transition()
      .duration(100)
      .delay((d, i) => 7 * i)
      .style("opacity", 1)
      .attr("transform", d => "rotate(" + (d.x < 180 ? d.x - 90 : d.x + 90) + ")")
      .text(d => d.id.substring(d.id.lastIndexOf(".") + 1)) //text to display
      .style("font-size", "10px")
      .style("fill", "#000");



  } catch (error) {
    console.error('Error during stratification or visualization:', error);
  }
}).catch((error) => console.error('Error processing CSV data:', error));





  
function diagonal(d) {
  return "M" + project(d.x, d.y) +
    "C" + project(d.x, (d.y + d.parent.y) / 2) +
    " " + project(d.parent.x, (d.y + d.parent.y) / 2) +
    " " + project(d.parent.x, d.parent.y);
}

function project(x, y) {
  var angle = (x - 90) / 180 * Math.PI, radius = y;
  return [radius * Math.cos(angle), radius * Math.sin(angle)];
}
