// 전역 상태 변수
let selectedOcean = null;
let selectedSpecies = null;
let selectedArchetype = null;
let popupMap = null; // Leaflet 지도 인스턴스

// JSON 파일 로드
fetch('../data/final_use.json')
  .then((response) => response.json())
  .then((data) => {
    oceanData = data; // 전체 데이터 저장
    createOceanList(data); // Ocean 리스트 생성
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

// 리스트 스타일 업데이트 공통 함수
function updateListStyles(listSelector, selectedText) {
  const listItems = document.querySelectorAll(listSelector + ' li');
  listItems.forEach((item) => {
    item.classList.toggle('selected', item.textContent === selectedText);
  });
}

// Ocean 리스트 생성
function createOceanList(data) {
  const oceanList = document.querySelector('.ocean-list');
  const oceans = Array.from(new Set(data.map((d) => d.ocean)));

  oceans.forEach((oceanName) => {
    const li = document.createElement('li');
    li.textContent = oceanName;
    li.onclick = () => navigateToSpecies(oceanName);
    oceanList.appendChild(li);
  });
}

// Species 리스트로 이동
function navigateToSpecies(oceanName) {
  selectedOcean = oceanName;
  selectedSpecies = null;
  selectedArchetype = null;

  const filteredSpecies = oceanData
    .filter((d) => d.ocean === oceanName)
    .map((d) => d.species);

  const uniqueSpecies = Array.from(new Set(filteredSpecies));
  updateSpeciesList(uniqueSpecies.sort());
  updateListStyles('.ocean-list', oceanName);

  scrollToCenter(document.querySelector('.species-list'));
}

// Species 리스트 업데이트
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

// Archetype 리스트로 이동
function navigateToArchetype(speciesName) {
  selectedSpecies = speciesName;
  selectedArchetype = null;

  const filteredArchetypes = oceanData
    .filter((d) => d.ocean === selectedOcean && d.species === speciesName)
    .map((d) => d.archetype);

  updateArchetypeList(Array.from(new Set(filteredArchetypes)).sort());
  updateListStyles('.species-list', speciesName);

  scrollToCenter(document.querySelector('.archetype-list'));
}

// Archetype 리스트 업데이트
function updateArchetypeList(archetypeData) {
  const archetypeList = document.querySelector('.archetype-list');
  archetypeList.innerHTML = '';

  archetypeData.forEach((archetypeName) => {
    const li = document.createElement('li');
    li.textContent = archetypeName;
    li.onclick = () => navigateToCommonNames(archetypeName);
    archetypeList.appendChild(li);
  });

  archetypeList.classList.remove('hidden');
}

// Common Name 리스트로 이동
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
  updateListStyles('.archetype-list', archetypeName);

  scrollToCenter(document.querySelector('.common-name-list'));
}

// Common Name 리스트 업데이트
function updateCommonNameList(commonNameData) {
  const commonNameList = document.querySelector('.common-name-list');
  commonNameList.innerHTML = '';

  commonNameData.forEach((commonName) => {
    const li = document.createElement('li');
    li.textContent = commonName.common_name;
    li.style.cursor = 'pointer';

    li.onclick = () => showPopup(commonName);
    li.onmouseover = () => (li.textContent = commonName.title);
    li.onmouseout = () => (li.textContent = commonName.common_name);

    commonNameList.appendChild(li);
  });

  commonNameList.classList.remove('hidden');
}

// 팝업 표시
function showPopup(data) {
  const popup = document.getElementById('popup');
  document.getElementById('popup-image').src = data.thumbnail || 'default.jpg';
  document.getElementById('popup-common-name').textContent = data.common_name;
  document.getElementById('popup-title').textContent = data.title;
  document.getElementById('popup-ocean').textContent = data.ocean;
  document.getElementById('popup-species').textContent = data.species;
  document.getElementById('popup-archetype').textContent = data.archetype;
  document.getElementById('popup-depth').textContent = data.depth;

  // 지도 초기화
  const mapContainer = document.createElement('div');
  mapContainer.id = `map-sample-${data.common_name}`; // 고유 ID 생성
  mapContainer.style.width = '250px';
  mapContainer.style.height = '150px';
  mapContainer.style.marginTop = '10px';
  mapContainer.style.borderRadius = '5px';

  const popupMapContainer = document.getElementById('popup-map');
  popupMapContainer.innerHTML = ''; // 기존 지도 초기화
  popupMapContainer.appendChild(mapContainer);

  const map = L.map(mapContainer.id, { zoomControl: false }).setView(
    [parseFloat(data.latitude), parseFloat(data.longitude)],
    5
  );

  L.marker([parseFloat(data.latitude), parseFloat(data.longitude)])
    .addTo(map)
    .getElement().style.filter = 'grayscale(100%)';

  L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg',
    {
      attribution: '<a href="http://stamen.com">Stamen Design</a>',
      maxZoom: 18,
    }
  ).addTo(map);

  popup.style.display = 'block';
}

// 팝업 닫기
document.getElementById('close-popup').onclick = () => {
  const popup = document.getElementById('popup');
  popup.style.display = 'none';
};
