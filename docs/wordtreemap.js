// Global state variables
let selectedOcean = null;
let selectedSpecies = null;
let selectedArchetype = null;
let popupMap = null; // Leaflet map instance

// Load JSON file
fetch('final_use_updated.json')
  .then((response) => response.json())
  .then((data) => {
    oceanData = data; // Save all data
    createOceanList(data); // Create Ocean list
  })
  .catch((error) => console.error('Error loading JSON data:', error));

// Common scroll function
function scrollToCenter(targetElement) {
  const rect = targetElement.getBoundingClientRect();
  const targetPositionX = rect.left + window.scrollX - window.innerWidth / 2.4; // Move to the center on the X-axis
  const targetPositionY = rect.top + window.scrollY - window.innerHeight / 5; // Slightly move down on the Y-axis (adjustable ratio)

  window.scrollTo({
    left: targetPositionX,
    top: targetPositionY, // Add Y-axis scroll
    behavior: 'smooth',
  });
}


// Common function to update list styles
function updateListStyles(listSelector, selectedText, dataAttribute) {
  const listItems = document.querySelectorAll(listSelector + ' li');
  listItems.forEach((item) => {
    const valueToCompare = dataAttribute
      ? item.dataset[dataAttribute]
      : item.textContent;
    const isSelected = valueToCompare === selectedText;
    item.classList.toggle('selected', isSelected);

    if (listSelector === '.common-name-list') {
      if (isSelected) {
        item.textContent = item.dataset.title; // Set the text of the selected item to title
      } else {
        item.textContent = item.dataset.commonName; // Set the text of the deselected item to common_name
      }
    }
  });
}

// Create Ocean list
function createOceanList(data) {
  const oceanList = document.querySelector('.ocean-list');
  const oceans = Array.from(new Set(data.map((d) => d.ocean)));

  oceans.forEach((oceanName) => {
    const li = document.createElement('li');
    li.textContent = oceanName;
    li.dataset.ocean = oceanName; // Add data attribute
    li.onclick = () => navigateToSpecies(oceanName);
    li.onmouseover = () => {
      li.classList.add('hovered');
    };
    li.onmouseout = () => {
      li.classList.remove('hovered');
    };
    oceanList.appendChild(li);
  });
}

// Priority arrays
const speciesPriority = [
  'Reef Fish',
  'Pelagic Fish',
  'Eel-like Fish',
  'Demersal Fish',
  'Others',
];

const archetypePriority = ['Predator', 'Prey', 'Others'];

// Function to sort by priority
function sortByPriority(array, priorityArray) {
  return array.sort((a, b) => {
    const priorityA = priorityArray.indexOf(a);
    const priorityB = priorityArray.indexOf(b);

    // If no priority, sort alphabetically
    if (priorityA === -1 && priorityB === -1) return a.localeCompare(b);
    if (priorityA === -1) return 1;
    if (priorityB === -1) return -1;

    return priorityA - priorityB;
  });
}

// Navigate to the Species list
function navigateToSpecies(oceanName) {
  selectedOcean = oceanName;
  selectedSpecies = null;
  selectedArchetype = null;

  const filteredSpecies = oceanData
    .filter((d) => d.ocean === oceanName)
    .map((d) => d.species);

  const uniqueSpecies = Array.from(new Set(filteredSpecies));
  updateSpeciesList(sortByPriority(uniqueSpecies, speciesPriority)); // Sort by priority
  updateListStyles('.ocean-list', oceanName, 'ocean');

  scrollToCenter(document.querySelector('.species-list'));
}

// Update Species list
function updateSpeciesList(speciesData) {
  const speciesList = document.querySelector('.species-list');
  speciesList.innerHTML = '';

  speciesData.forEach((speciesName) => {
    const li = document.createElement('li');
    li.textContent = speciesName;
    li.dataset.species = speciesName; // Add data attribute
    li.onclick = () => navigateToArchetype(speciesName);
    li.onmouseover = () => {
      li.classList.add('hovered');
    };
    li.onmouseout = () => {
      li.classList.remove('hovered');
    };
    speciesList.appendChild(li);
  });

  speciesList.classList.remove('hidden');
}

// Navigate to the Archetype list
function navigateToArchetype(speciesName) {
  selectedSpecies = speciesName;
  selectedArchetype = null;

  const filteredArchetypes = oceanData
    .filter((d) => d.ocean === selectedOcean && d.species === speciesName)
    .map((d) => d.archetype);

  updateArchetypeList(
    sortByPriority(Array.from(new Set(filteredArchetypes)), archetypePriority) // Sort by priority
  );
  updateListStyles('.species-list', speciesName, 'species');

  scrollToCenter(document.querySelector('.archetype-list'));
}

// Update Archetype list
function updateArchetypeList(archetypeData) {
  const archetypeList = document.querySelector('.archetype-list');
  archetypeList.innerHTML = '';

  archetypeData.forEach((archetypeName) => {
    const li = document.createElement('li');
    li.textContent = archetypeName;
    li.dataset.archetype = archetypeName; // Add data attribute
    li.onclick = () => navigateToCommonNames(archetypeName);
    li.onmouseover = () => {
      li.classList.add('hovered');
    };
    li.onmouseout = () => {
      li.classList.remove('hovered');
    };
    archetypeList.appendChild(li);
  });

  archetypeList.classList.remove('hidden');
}

// Navigate to the Common Name list
function navigateToCommonNames(archetypeName) {
  selectedArchetype = archetypeName;

  const filteredCommonNames = oceanData
    .filter(
      (d) =>
        d.ocean === selectedOcean &&
        d.species === selectedSpecies &&
        d.archetype === archetypeName
    )
    .sort((a, b) => parseFloat(a.depth) - parseFloat(b.depth));

  updateCommonNameList(filteredCommonNames);
  updateListStyles('.archetype-list', archetypeName, 'archetype');

  scrollToCenter(document.querySelector('.common-name-list'));
}

// Update Common Name list
function updateCommonNameList(commonNameData) {
  const commonNameList = document.querySelector('.common-name-list');
  commonNameList.innerHTML = '';

  commonNameData.forEach((commonName) => {
    const li = document.createElement('li');
    li.textContent = commonName.common_name;
    li.dataset.commonName = commonName.common_name; // Save original common_name
    li.dataset.title = commonName.title; // Save title
    li.style.cursor = 'pointer';

    li.onclick = () => {
      showPopup(commonName);
      updateListStyles(
        '.common-name-list',
        commonName.common_name,
        'commonName'
      ); // Update styles
      li.textContent = commonName.title; // Change text to title on click
    };
    li.onmouseover = () => {
      li.textContent = commonName.title;
      li.classList.add('hovered'); // Apply hover style
    };
    li.onmouseout = () => {
      if (!li.classList.contains('selected')) {
        li.textContent = commonName.common_name;
        li.classList.remove('hovered'); // Remove hover style
      }
    };

    commonNameList.appendChild(li);
  });

  commonNameList.classList.remove('hidden');
}

//add lines to each list item connecting the items like a flow chart



// Show popup
function showPopup(data) {
  const popup = document.getElementById('popup');
  const popupImage = document.getElementById('popup-image');
  popupImage.src = data.thumbnail || 'default.jpg';
  popupImage.onload = () => {
    const imageRatio = popupImage.naturalWidth / popupImage.naturalHeight;
    const containerRatio = popupImage.parentElement.clientWidth / popupImage.parentElement.clientHeight;
    if (imageRatio !== containerRatio) {
      popupImage.style.backgroundColor = 'white';
    }
  };
  document.getElementById('popup-common-name').textContent = data.common_name;
  document.getElementById('popup-title').textContent = data.title;
  document.getElementById('popup-ocean').textContent = data.ocean;
  document.getElementById('popup-species').textContent = data.species;
  document.getElementById('popup-archetype').textContent = data.archetype;
  document.getElementById('popup-depth').textContent = data.depth;

  // Initialize map
  const mapContainer = document.createElement('div');
  mapContainer.id = `map-sample-${data.common_name}`; // Create unique ID
  mapContainer.style.width = '350px'; /* Set width */
  mapContainer.style.height = '200px'; /* Set height */
  mapContainer.style.marginTop = '40px'; /* Add top margin */
  mapContainer.style.marginLeft = '7px'; /* Move left */
  mapContainer.style.borderRadius = '10px'; /* Round corners */
  mapContainer.style.fontSize = '14px'; /* Set font size */

  const popupMapContainer = document.getElementById('popup-map');
  popupMapContainer.innerHTML = ''; // Clear existing map
  popupMapContainer.appendChild(mapContainer);


    // Ensure the map container is properly sized and initialized
    setTimeout(() => {
      // Initialize Leaflet map with Stamen Toner tiles
      popupMap = L.map(mapContainer.id, { zoomControl: false }).setView([data.latitude, data.longitude], 2);
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

      L.marker([data.latitude, data.longitude], { icon: defaultIcon }).addTo(popupMap).openPopup();
    }, 0);

      

  // Display popup
  popup.style.display = 'block';

  // Expand screen
  document.body.style.width = '220vw'; // Expand screen width when popup is displayed
}

// Close popup
document.getElementById('close-popup').onclick = () => {
  const popup = document.getElementById('popup');
  popup.style.display = 'none';

  // Restore screen size
  document.body.style.width = '200vw'; // Restore to original size when popup is closed
};
