

var svg = d3.select("svg")
  .style("display", "block")
  .style("margin", "auto")
  .attr("width", window.innerWidth)
  .attr("height", window.innerHeight)
  width = +svg.attr("width"),
  height = +svg.attr("height"),
  g = svg.append("g").attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");  

var stratify = d3.stratify().parentId(function(d) { return d.id.substring(0, d.id.lastIndexOf(".")); });

var cluster = d3.cluster().size([360, Math.min(width, height) / 2 + 5000]); // adjust the radius

var root;

//hierarchy order: ocean - species - archetype
// load data
d3.csv('final_use_updated.csv').then((data) => {
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
      .style("stroke-width", "4px")
      .style("opacity", 0)
      .transition()
      .duration(2000)
      .style("opacity", 1);

    const node = g.selectAll(".node")
      .data(root.descendants())
      .enter().append("g")
      .attr("class", d => "node" + (d.children ? " node--internal" : " node--leaf"))
      .attr("transform", d => "translate(" + project(d.x, d.y) + ")")
      .attr("dy", "30em"); // Adjust the spacing between nodes

      function project(x, y) {
        const angle = (x - 90) / 180 * Math.PI;
        const radius = y;
        return [radius * Math.cos(angle), radius * Math.sin(angle)];
      }

    node.append("circle")
      .attr("r", 5)
      .style("fill", "#f67a0a")
      .style("opacity", 0)
      .transition()
      .duration(250)
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
      .duration(250)
      .style("opacity", 1)
      .attr("transform", d => {
        if (d.depth === 0) return ""; // No rotation or translation for the "Fish" node
        const angle = d.x < 180 ? d.x - 90 : d.x + 90;  d.x - 90;
        if (d.children && d.depth === 1) {
          const translateX = 220; // X translation for ocean nodes
          const translateY = -70; // Y translation for ocean nodes
          return `rotate(${angle}) translate(${translateX}, ${translateY})`;
        } else if (d.children && d.depth === 2) {
          const translateX = 150; // X translation for species nodes
          const translateY = -40; // Y translation for species nodes
          return `rotate(${angle}) translate(${translateX}, ${translateY})`;
            } else {
              const translateX = d.x > 180 ? -15 : 0; // X translation for child nodes
              const translateY = 0; // Y translation for child nodes
              return `rotate(${angle}) translate(${translateX}, ${translateY})`;    }
      })
      .text(d => d.data.name) // text to display
      .style("font-size", d => {
        if (d.depth === 0) return "192px"; // font size for master "fish"
        if (d.depth === 1) return "96px"; // font size for parent nodes
        if (d.depth === 2) return "64px"; // font size for species nodes
        return "14px"; // font size for child nodes
      })
      .attr("dx", d => d.depth > 2 ? "0.5em" : "0") // Adjust spacing for child nodes only
      .style("fill", "#5a5a5a");

      // Add emoji to the fish node
      node.filter(d => d.depth === 0).append("text")
        .attr("dy", ".31em")
        .attr("x", -130)
        .attr("text-anchor", "left")
        .style("font-size", "89px")
        .style("opacity", 0)
        .transition()
        .duration(250)
        .style("opacity", 1)
        .text("🐟"); 

      document.addEventListener("DOMContentLoaded", function() {
      const fishNode = d3.select(".node").filter(d => d.depth === 0).node();
      if (fishNode) {
        if ('scrollIntoView' in fishNode) {
      fishNode.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        } else {
      fishNode.scrollIntoView(true); // Fallback for older browsers
        }
      }
      });

  //a map inset of the whole visualisation with a dynamic window that moves to show where we are on the visualization as the user pans - to be on the bottom right
  const insetWidth = 220;
  const insetHeight = 220;

  const insetSvg = d3.select("body").append("svg")
    .attr("width", insetWidth)
    .attr("height", insetHeight)
    .style("position", "absolute")
    .style("bottom", "-5px")
    .style("right", "25px")
    .style("border", "1px solid #ccc")
    .style("border-radius", "10px")
    .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.2)")
    .style("background", "white")
    .style('animation', 'float 6s ease-in-out infinite')
    .style('transition', 'top 0.5s ease-out')
    .style("opacity", "90%");

  const insetG = insetSvg.append("g")
    .attr("transform", "translate(" + insetWidth / 2 + "," + insetHeight / 2 + ")");

  const fishNode = root.descendants().find(d => d.depth === 0);
  if (fishNode) {
    insetG.attr("transform", "translate(" + (insetWidth / 2 - fishNode.x) + "," + (insetHeight / 2 - fishNode.y / 10) + ")");
  }

  const insetCluster = d3.cluster().size([360, window.innerWidth/2 - 60, window.innerHeight/2 - 60]);

  insetG.attr("transform", "translate(" + (insetWidth / 2 - fishNode.x + 82) + "," + (insetHeight / 2 - fishNode.y / 10) + ")");
  insetCluster(root);

  insetG.selectAll(".link")
    .data(root.descendants().slice(1))
    .enter().append("path")
    .attr("class", "link")
    .attr("d", d => {
      return "M" + project(d.x, d.y / 10)
        + "C" + project(d.x, (d.y / 10 + d.parent.y / 10) / 2)
        + " " + project(d.parent.x, (d.y / 10 + d.parent.y / 10) / 2)
        + " " + project(d.parent.x, d.parent.y / 10);
    })
    .style("fill", "none")
    .style("stroke", "#f67a0a")
    .style("stroke-width", "0.1px");

  insetG.selectAll(".node")
    .data(root.descendants())
    .enter().append("circle")
    .attr("class", "node")
    .attr("transform", d => "translate(" + project(d.x, d.y / 10) + ")")
    .attr("r", 2)
    .style("fill", "#ccc");

  const insetWindow = insetSvg.append("rect")
    .attr("width", insetWidth / 8)
    .attr("height", insetHeight / 8)
    .attr("x", -10)
    .attr("y", -10)
    .style("fill", "#188d8d")
    .style("opacity", 0.7)
    .attr("rx", 2)
    .attr("ry", 2);

  svg.call(zoom.on("zoom", (event) => {
    g.attr("transform", event.transform.translate(600, 470));
    const scale = event.transform.k;
    const translate = event.transform;
    insetWindow.attr("transform", `translate(${(-translate.x / scale) / 60 + 100}, ${(-translate.y / scale) / 60 + 100}) scale(${1 / scale})`);
  }));



  //hover over to highlight the path to the fish, grey out the rest of the nodes + show their nameSci in opensans semi-condensed
  node.filter(d => d.depth > 2).on("mouseover", function(event, d) {
  
  // Highlight hovered node to the root
  let current = d;
  while (current) {
    d3.selectAll(".node").filter(n => n === current).select("circle").style("fill", "#188d8d");
    d3.selectAll(".link").filter(l => l.target === current).style("stroke", "#188d8d");
    current = current.parent;
  }

  // Grey out the rest of the nodes and paths
  node.filter(n => !d.ancestors().includes(n))
    .select("circle")
    .style("opacity", 0.1);

  g.selectAll(".link")
    .filter(l => !d.ancestors().includes(l.target))
    .style("opacity", 0.1);

  // Show the scientific name
  d3.select(this).select("text")
    .text(d.data.nameSci)
    .style("font-family", "Open Sans SemiCondensed")
    .style("fill", "#188d8d");
  })
  .on("mouseout", function(event, d) {
  
  // Reset the path to the root
  let current = d;
  while (current) {
    d3.select(current.node).select("circle").style("fill", "#f67a0a");
    current = current.parent;
  }

  // Reset the opacity and color of the rest of the nodes
  node.select("circle").style("opacity", 1).style("fill", "#f67a0a");
  g.selectAll(".link").style("opacity", 1);

  // Reset the text, font, and color
  d3.select(this).select("text")
    .text(d.data.name)
    .style("font-family", "inherit")
    .style("fill", "#5a5a5a");
  })
  .on("click", function(event, d) { // Clicking on a node to open a window to show more info
    const selectedFish = data.find(fish => `Fish.${fish.ocean}.${fish.species}.${fish.archetype}.${data.indexOf(fish)}` === d.id);
    if (selectedFish) {
      const infoWindow = d3.select("body").append("div")
        .style("position", "absolute")
        .style("top", "70px")
        .style("right", "20px")
        .style("width", "400px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "15px")
        .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.2)")
        .style("padding", "10px")
        .style("opacity", "90%");

      infoWindow.append("img")
        .attr("src", selectedFish.thumbnail)
        .style("width", "100%")
        .style("border-radius", "7px")
        .style("margin-bottom", "0.5em");

      infoWindow.append("html")
        .style("font-family", "Open Sans")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("color", "#333")
        .html(`<span style="font-family: 'Futura'; font-size: 24px; color: #188d8d; font-style: bold;">${selectedFish.common_name}</span> 
          <br> 
          <span style="font-family: 'Open Sans'; font-size: 16px; color: #333; font-style: italic; margin-bottom: 1em;">${selectedFish.title}</span>
          <br><br> Ocean
          <span style="font-family: 'Open Sans ExtraBold'; font-size: 16px; color: #188d8d; font-style: bold; margin-bottom: 2em;">${selectedFish.ocean}</span>
          <br> Species
          <span style="font-family: 'Open Sans ExtraBold'; font-size: 16px; color: #188d8d; font-style: bold; margin-bottom: 2em;">${selectedFish.species}</span>
          <br> Archetype
          <span style="font-family: 'Open Sans ExtraBold'; font-size: 16px; color: #188d8d; font-style: bold; margin-bottom: 2em;">${selectedFish.archetype}</span>
          <br><br> 
          <span style="font-family: 'Open Sans'; font-size: 16px; color: #333; font-style: regular; margin-bottom: 1em;">Habitat Location 
          </span>`);

      infoWindow.append("img")
        .attr("src", "cross.svg")
        .style("width", "20px")
        .style("height", "20px")
        .style("position", "absolute")
        .style("top", "20px")
        .style("right", "20px")
        .style("opacity", "90%")
        .style("filter", "invert(70%)")
        .style("cursor", "pointer")
        .on("click", () => infoWindow.remove());

      infoWindow.append("div") // Stamen Toner tiles
      const mapContainer = infoWindow.append("div")
        .attr("id", "map")
        .style("width", "100%")
        .style("height", "200px")
        .style("border-radius", "7px");

      setTimeout(() => {
        const popupMap = L.map(mapContainer.node(), { zoomControl: false }).setView([selectedFish.latitude, selectedFish.longitude], 2);
        L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
          attribution: '<a href="http://stamen.com">Stamen Design</a>',
          minZoom: 2,
          maxZoom: 6,
        }).addTo(popupMap);

        // Add marker to the map with default icon
        const defaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconSize: [25, 41], // size of the icon
          iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
          popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // shadow
          className: 'default-marker-icon' // Add custom class
        });

        // Add custom CSS to remove background and set color to grey
        const style = document.createElement('style');
        style.innerHTML = `
          .default-marker-icon {
            background: none !important;
            filter: grayscale(100%);
          }
        `;
        document.head.appendChild(style);

        L.marker([selectedFish.latitude, selectedFish.longitude], { icon: defaultIcon }).addTo(popupMap).openPopup();
      }, 0);
    }
  });



  //search bar with dropdown suggestions to search for a specific fish - top left corner
  const searchContainer = d3.select("body").append("div")
  .style("position", "absolute")
  .style("top", "65px")
  .style("left", "30px")
  .style("width", "300px")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("border-radius", "25px")
  .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.2)")
  .style("padding", "10px")
  .style('animation', 'float 6s ease-in-out infinite')
  .style('transition', 'top 0.5s ease-out')
  .style("opacity", "90%");

  const searchInput = searchContainer.append("input")
  .attr("type", "text")
  .attr("placeholder", " Explore Societies Underwater...")
  .style("width", "97%")
  .style("padding", "5px")
  .style("border", "0px solid #ccc")
  .style("border-radius", "20px")
  .style("font-family", "Open Sans")
  .style("font-size", "16px")
  .style("font-weight", "bold")
  .style("color", "#333");

  const suggestionsContainer = searchContainer.append("div")
  .style("position", "absolute")
  .style("top", "40px")
  .style("left", "10px")
  .style("width", "300px")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("border-radius", "5px")
  .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.2)")
  .style("max-height", "200px")
  .style("overflow-y", "auto")
  .style("display", "none")
  .style("opacity", "90%");

  searchInput.on("input", function() {
  const query = this.value.toLowerCase();
  const suggestions = validatedData.filter(d => d.name.toLowerCase().includes(query) || d.nameSci.toLowerCase().includes(query));

  suggestionsContainer.style("display", suggestions.length ? "block" : "none");
  suggestionsContainer.selectAll("div").remove();

  suggestionsContainer.selectAll("div")
    .data(suggestions)
    .enter().append("div")
    .style("padding", "10px")
    .style("cursor", "pointer")
    .style("border-bottom", "1px solid #ccc")
    .style("font-family", "Open Sans")
    .style("font-weight", "bold")
    .style("opacity", "0.9")
    .html(d => `<span style="color: #f67a0a;">${d.name}</span> - ${d.nameSci}`)
    .on("click", function(event) {
      const d = d3.select(this).datum();
      const node = g.selectAll(".node").filter(n => n.data.id === d.id).node();
      if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      d3.select(node).select("circle").style("fill", "red").style("stroke", "none");
      setTimeout(() => d3.select(node).select("circle").style("fill", "#f67a0a"), 2000);
      }
      searchInput.property("value", "");
      suggestionsContainer.style("display", "none");

      // Clicking on a suggestion to open a window to show more info
      const selectedFish = data.find(fish => `Fish.${fish.ocean}.${fish.species}.${fish.archetype}.${data.indexOf(fish)}` === d.id);
      if (selectedFish) {
      const infoWindow = d3.select("body").append("div")
        .style("position", "absolute")
        .style("top", "70px")
        .style("right", "20px")
        .style("width", "400px")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "15px")
        .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.2)")
        .style("padding", "10px")
        .style("opacity", "90%");

      infoWindow.append("img")
        .attr("src", selectedFish.thumbnail)
        .style("width", "100%")
        .style("border-radius", "7px")
        .style("margin-bottom", "0.5em");

      infoWindow.append("html")
        .style("font-family", "Open Sans")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .style("color", "#333")
        .html(`<span style="font-family: 'Futura'; font-size: 24px; color: #188d8d; font-style: bold;">${selectedFish.common_name}</span> 
          <br> 
          <span style="font-family: 'Open Sans'; font-size: 16px; color: #333; font-style: italic; margin-bottom: 1em;">${selectedFish.title}</span>
          <br><br> Ocean
          <span style="font-family: 'Open Sans ExtraBold'; font-size: 16px; color: #188d8d; font-style: bold; margin-bottom: 2em;">${selectedFish.ocean}</span>
          <br> Species
          <span style="font-family: 'Open Sans ExtraBold'; font-size: 16px; color: #188d8d; font-style: bold; margin-bottom: 2em;">${selectedFish.species}</span>
          <br> Archetype
          <span style="font-family: 'Open Sans ExtraBold'; font-size: 16px; color: #188d8d; font-style: bold; margin-bottom: 2em;">${selectedFish.archetype}</span>
          <br><br> 
          <span style="font-family: 'Open Sans'; font-size: 16px; color: #333; font-style: regular; margin-bottom: 1em;">Habitat Location 
          </span>`);

      infoWindow.append("img")
        .attr("src", "cross.svg")
        .style("width", "20px")
        .style("height", "20px")
        .style("position", "absolute")
        .style("top", "20px")
        .style("right", "20px")
        .style("opacity", "90%")
        .style("filter", "invert(70%)")
        .style("cursor", "pointer")
        .on("click", () => infoWindow.remove());

      infoWindow.append("div") // Stamen Toner tiles
      const mapContainer = infoWindow.append("div")
        .attr("id", "map")
        .style("width", "100%")
        .style("height", "200px")
        .style("border-radius", "7px");
        // .style("margin-top", "1em")

      setTimeout(() => {
        const popupMap = L.map(mapContainer.node(), { zoomControl: false }).setView([selectedFish.latitude, selectedFish.longitude], 2);
        L.tileLayer('https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', {
          attribution: '<a href="http://stamen.com">Stamen Design</a>',
          minZoom: 2,
          maxZoom: 6,
        }).addTo(popupMap);

        // Add marker to the map with default icon
        const defaultIcon = L.icon({
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          iconSize: [25, 41], // size of the icon
          iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
          popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // shadow
          className: 'default-marker-icon' // Add custom class
        });

        // Add custom CSS to remove background and set color to grey
        const style = document.createElement('style');
        style.innerHTML = `
          .default-marker-icon {
            background: none !important;
            filter: grayscale(100%);
          }
        `;
        document.head.appendChild(style);

        L.marker([selectedFish.latitude, selectedFish.longitude], { icon: defaultIcon }).addTo(popupMap).openPopup();
      }, 0);

      }






    });
  });


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



//reset button to show entire visualization circle - bottom left corner
const resetButtonContainer = d3.select("body").append("div")
  .style("position", "absolute")
  .style("bottom", "-5px")
  .style("left", "30px")
  .style("width", "30px")
  .style("height", "30px")
  .style("background", "white")
  .style("border", "1px solid #ccc")
  .style("border-radius", "5px")
  .style("box-shadow", "2px 2px 6px rgba(0, 0, 0, 0.2)")
  .style("display", "flex")
  .style("align-items", "center")
  .style("justify-content", "center")
  .style("cursor", "pointer")
  .style('animation', 'float 6s ease-in-out infinite')
  .style('transition', 'top 0.5s ease-out')
  .style("opacity", "90%");

const resetButton = resetButtonContainer.append("img")
  .attr("src", "home.svg")
  .style("width", "20px")
  .style("height", "20px")
  .on("click", () => {
    svg.transition()
      .duration(750)
      .call(zoom.transform, d3.zoomIdentity);
  });

const zoom = d3.zoom()
  .scaleExtent([0.1, 5])
  .on("zoom", (event) => {
    g.attr("transform", event.transform.translate(600, 470));
  });

svg.call(zoom);

// floating animation
d3.select("head").append("style").text(`
  @keyframes float {
    0% { transform: translateY(0); }
    50% { transform: translate(7px, -5px); }
    100% { transform: translateY(0); }
  }
`);

//credits bottom left 
const footerText = d3.select("body").append("div")
  .style("position", "absolute")
  .style("bottom", "-8px")
  .style("left", "85px")
  .style("font-family", "Open Sans")
  .style("font-size", "14px")
  .style("color", "#333")
  .style("opacity", "90%")
  .style("font-weight", "bold")
  .style('animation', 'float 6s ease-in-out infinite')
  .style('transition', 'top 0.5s ease-out')
  .html("Data Visualisation | MS1 | Fall '24 <br> Exercise 3: Interactivity |  Hyeonjeong | Xuan");


//fix lines hover


// rotate to orientate text to be upright?
//transition animation to side scrolling instead of radial viz