

var svg = d3.select("svg")
  .style("display", "block")
  .style("margin", "auto"),
  // .attr("width", window.innerWidth)
  // .attr("height", window.innerHeight),
  width = +svg.attr("width"),
  height = +svg.attr("height"),
  g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");
  

var stratify = d3.stratify().parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

var cluster = d3.cluster().size([360, Math.min(width, height) / 2 + 5000]); // adjust the radius

var root;

//hierarchy order: ocean - species - archetype
// load data 
d3.csv('data/final_use_updated.csv').then((data) => {
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
  const validatedData = allData.filter(d => !d.parentId || idSet.has(d.parentId)).map(d => {
    const original = data.find(item => `Fish.${item.ocean}.${item.species}.${item.archetype}.${data.indexOf(item)}` === d.id);
    return {
      ...d,
      nameSci: original ? original.title : d.id.split('.').pop(),
      name: original ? original.common_name : d.id.split('.').pop()
    };
  });


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
      .attr("d", diagonal)
      .style("fill", "none")
      .style("stroke", "#000")
      .style("stroke-width", "5px");

    link.enter().append("path")
      .attr("class", "link")
      .attr("d", d => {
        return "M" + project(d.x, d.y)
          + "C" + project(d.x, (d.y + d.parent.y) / 2)
          + " " + project(d.parent.x, (d.y + d.parent.y) / 2)
          + " " + project(d.parent.x, d.parent.y);
      })
      .style("fill", "none")
      .style("stroke", "#f67a0a")
      .style("stroke-width", "5px")
      .style("opacity", 0)
      .transition()
      .duration(2000)
      .style("opacity", 1);

    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
      .attr("transform", d => "translate(" + project(d.x, d.y) + ")")
      .attr("dy", "300em"); // Adjust the spacing between nodes

      function project(x, y) {
        const angle = (x - 90) / 180 * Math.PI;
        const radius = y;
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
      }

    node.append("circle")
      .attr("r", 10)
      .style("fill", "#f67a0a")
      .style("opacity", 0)
      .transition()
      .duration(150)
      .delay((d, i) => 7 * i)
      .style("opacity", 1);

    node.append("text")
      .attr("dy", ".31em")
      .attr("x", d => {
        if (d.depth === 0) return -230; // Adjust X for the "Fish" node
        return d.x < 180 === !d.children ? 10 : -10;
          })
          .attr("text-anchor", d => d.depth === 0 ? "middle" : (d.x < 180 === !d.children ? "start" : "end"))
          .style("opacity", 0)
          .transition()
          .duration(25)
          .delay((d, i) => 3.5 * i)
          .style("opacity", 1)
          .attr("transform", d => {
            if (d.depth === 0) return ""; // No rotation or translation for the "Fish" node
            const angle = d.x < 180 ? d.x - 90 : d.x + 90;
            if (d.children && d.depth !== 0) {
              const translateX = 220; // X translation for parent nodes, excluding "Fish"
              const translateY = -90; // Y translation for parent nodes, excluding "Fish"
              return `rotate(${angle}) translate(${translateX}, ${translateY})`;
            } else {
              const translateX = 30; // X translation for child nodes
              const translateY = 0; // Y translation for child nodes
              return `rotate(${angle}) translate(${translateX}, ${translateY})`;
            }
          })
      .text(d => d.data.name) // text to display
      .style("font-size", d => d.depth === 0 ? "192px" : d.depth === 1 ? "96px" : "64px") //font size for master "fish"; parent nodes; species nodes
      .style("fill", "#5a5a5a");



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


//default load page to center on "fish" node
//reset button to zoom out and show entire visulization
//inset to show where we are on the visualization

//toolip for each node to show more information of each fish
//hover over to highlight the path to the fish, grey out the rest of the nodes + their nameSci
