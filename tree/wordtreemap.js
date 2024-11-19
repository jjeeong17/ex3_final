// JSON 파일 로드
fetch('../data/final_use.json')
  .then((response) => response.json())
  .then((data) => {
    console.log('JSON 데이터:', data);
    oceanData = d3.group(data, (d) => d.ocean);
    createOceanList(oceanData);
  })
  .catch((error) => console.error('JSON 데이터 로드 오류:', error));

// 공통 스크롤 함수
function scrollToCenter(targetElement) {
  const targetPosition =
    targetElement.getBoundingClientRect().left +
    window.scrollX -
    window.innerWidth / 3;

  window.scrollTo({
    left: targetPosition,
    behavior: 'smooth',
  });
}

function createOceanList(oceanData) {
  const oceanList = document.querySelector('.ocean-list');

  Array.from(oceanData.keys()).forEach((oceanName) => {
    const li = document.createElement('li');
    li.textContent = oceanName;
    li.onclick = () => navigateToSpecies(oceanName);
    oceanList.appendChild(li);
  });
}

const speciesOrder = [
  'Reef Fish',
  'Pelagic Fish',
  'Demersal/Benthic Fish',
  'Eel-like Fish',
  'Others',
];

const archetypeOrder = ['Predator', 'Prey', 'Others'];

function navigateToSpecies(oceanName) {
  const filteredSpecies = Array.from(
    oceanData.get(oceanName),
    (d) => d.species
  );

  const uniqueSpecies = Array.from(new Set(filteredSpecies));
  const sortedSpecies = uniqueSpecies.sort(
    (a, b) => speciesOrder.indexOf(a) - speciesOrder.indexOf(b)
  );

  updateSpeciesList(sortedSpecies);
  updateOceanListStyles(oceanName);

  const speciesSection = document.querySelector('.species-list');
  scrollToCenter(speciesSection);
}

function updateOceanListStyles(selectedOcean) {
  const oceanListItems = document.querySelectorAll('.ocean-list li');
  oceanListItems.forEach((item) => {
    item.style.color = item.textContent === selectedOcean ? '#0077be' : '#ccc';
  });
}

function updateSpeciesList(speciesData) {
  const speciesList = document.querySelector('.species-list');
  speciesList.innerHTML = '';

  speciesData.forEach((speciesName) => {
    const li = document.createElement('li');
    li.textContent = speciesName;
    li.onclick = () => navigateToArchetype(speciesName);
    speciesList.appendChild(li);
  });

  speciesList.classList.remove('hidden');
}

function navigateToArchetype(speciesName) {
  const filteredArchetypes = Array.from(oceanData.values())
    .flat()
    .filter((d) => d.species === speciesName)
    .map((d) => d.archetype);

  const uniqueArchetypes = Array.from(new Set(filteredArchetypes));
  const sortedArchetypes = uniqueArchetypes.sort(
    (a, b) => archetypeOrder.indexOf(a) - archetypeOrder.indexOf(b)
  );

  updateArchetypeList(sortedArchetypes);

  const archetypeList = document.querySelector('.archetype-list');
  scrollToCenter(archetypeList);
}

function updateArchetypeList(archetypeData) {
  const archetypeList = document.querySelector('.archetype-list');
  archetypeList.innerHTML = '';

  archetypeData.forEach((archetypeName) => {
    const li = document.createElement('li');
    li.textContent = archetypeName;
    li.onclick = () => navigateToCommonNames(archetypeName); // Common Names로 이동
    archetypeList.appendChild(li);
  });

  archetypeList.classList.remove('hidden');
}

// Common Name로 이동
function navigateToCommonNames(archetypeName) {
  const filteredCommonNames = Array.from(oceanData.values())
    .flat()
    .filter((d) => d.archetype === archetypeName)
    .sort((a, b) => parseFloat(a.depth) - parseFloat(b.depth)) // depth 낮은 순으로 정렬
    .map((d) => ({
      commonName: d.common_name,
      depth: d.depth,
    }));

  updateCommonNameList(filteredCommonNames);

  const commonNameList = document.querySelector('.common-name-list');
  scrollToCenter(commonNameList);
}

function updateCommonNameList(commonNameData) {
  const commonNameList = document.querySelector('.common-name-list');
  commonNameList.innerHTML = '';

  commonNameData.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.commonName}`; // Common Name 및 Depth 표시
    commonNameList.appendChild(li);
  });

  commonNameList.classList.remove('hidden');
}
