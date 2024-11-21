// 전역 상태 변수
let selectedOcean = null;
let selectedSpecies = null;
let selectedArchetype = null;
let popupMap = null; // Leaflet 지도 인스턴스

// JSON 파일 로드
fetch('../data/final_use_updated.json')
  .then((response) => response.json())
  .then((data) => {
    oceanData = data; // 전체 데이터 저장
    createOceanList(data); // Ocean 리스트 생성
  })
  .catch((error) => console.error('JSON 데이터 로드 오류:', error));

// 공통 스크롤 함수
function scrollToCenter(targetElement) {
  const rect = targetElement.getBoundingClientRect();
  const targetPositionX = rect.left + window.scrollX - window.innerWidth / 2.4; // X축 중앙 이동
  const targetPositionY = rect.top + window.scrollY - window.innerHeight / 5; // Y축 약간 아래 이동 (비율 조정 가능)

  window.scrollTo({
    left: targetPositionX,
    top: targetPositionY, // Y축 스크롤 추가
    behavior: 'smooth',
  });
}

// 리스트 스타일 업데이트 공통 함수
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
        item.textContent = item.dataset.title; // 선택된 아이템의 텍스트를 title로 설정
      } else {
        item.textContent = item.dataset.commonName; // 선택 해제된 아이템의 텍스트를 common_name으로 설정
      }
    }
  });
}

// Ocean 리스트 생성
function createOceanList(data) {
  const oceanList = document.querySelector('.ocean-list');
  const oceans = Array.from(new Set(data.map((d) => d.ocean)));

  oceans.forEach((oceanName) => {
    const li = document.createElement('li');
    li.textContent = oceanName;
    li.dataset.ocean = oceanName; // 데이터 속성 추가
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

// 우선순위 배열
const speciesPriority = [
  'Reef Fish',
  'Pelagic Fish',
  'Eel-like Fish',
  'Demersal Fish',
  'Others',
];

const archetypePriority = ['Predator', 'Prey', 'Others'];

// 우선순위에 따라 정렬 함수
function sortByPriority(array, priorityArray) {
  return array.sort((a, b) => {
    const priorityA = priorityArray.indexOf(a);
    const priorityB = priorityArray.indexOf(b);

    // 우선순위가 없는 경우 알파벳 순으로 정렬
    if (priorityA === -1 && priorityB === -1) return a.localeCompare(b);
    if (priorityA === -1) return 1;
    if (priorityB === -1) return -1;

    return priorityA - priorityB;
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
  updateSpeciesList(sortByPriority(uniqueSpecies, speciesPriority)); // 우선순위 정렬
  updateListStyles('.ocean-list', oceanName, 'ocean');

  scrollToCenter(document.querySelector('.species-list'));
}

// Species 리스트 업데이트
function updateSpeciesList(speciesData) {
  const speciesList = document.querySelector('.species-list');
  speciesList.innerHTML = '';

  speciesData.forEach((speciesName) => {
    const li = document.createElement('li');
    li.textContent = speciesName;
    li.dataset.species = speciesName; // 데이터 속성 추가
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

// Archetype 리스트로 이동
function navigateToArchetype(speciesName) {
  selectedSpecies = speciesName;
  selectedArchetype = null;

  const filteredArchetypes = oceanData
    .filter((d) => d.ocean === selectedOcean && d.species === speciesName)
    .map((d) => d.archetype);

  updateArchetypeList(
    sortByPriority(Array.from(new Set(filteredArchetypes)), archetypePriority) // 우선순위 정렬
  );
  updateListStyles('.species-list', speciesName, 'species');

  scrollToCenter(document.querySelector('.archetype-list'));
}

// Archetype 리스트 업데이트
function updateArchetypeList(archetypeData) {
  const archetypeList = document.querySelector('.archetype-list');
  archetypeList.innerHTML = '';

  archetypeData.forEach((archetypeName) => {
    const li = document.createElement('li');
    li.textContent = archetypeName;
    li.dataset.archetype = archetypeName; // 데이터 속성 추가
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
  updateListStyles('.archetype-list', archetypeName, 'archetype');

  scrollToCenter(document.querySelector('.common-name-list'));
}

// Common Name 리스트 업데이트
function updateCommonNameList(commonNameData) {
  const commonNameList = document.querySelector('.common-name-list');
  commonNameList.innerHTML = '';

  commonNameData.forEach((commonName) => {
    const li = document.createElement('li');
    li.textContent = commonName.common_name;
    li.dataset.commonName = commonName.common_name; // 원래 common_name 저장
    li.dataset.title = commonName.title; // title 저장
    li.style.cursor = 'pointer';

    li.onclick = () => {
      showPopup(commonName);
      updateListStyles(
        '.common-name-list',
        commonName.common_name,
        'commonName'
      ); // 스타일 업데이트
      li.textContent = commonName.title; // 클릭 시 텍스트를 title로 변경
    };
    li.onmouseover = () => {
      li.textContent = commonName.title;
      li.classList.add('hovered'); // Hover 스타일 적용
    };
    li.onmouseout = () => {
      if (!li.classList.contains('selected')) {
        li.textContent = commonName.common_name;
        li.classList.remove('hovered'); // Hover 스타일 제거
      }
    };

    commonNameList.appendChild(li);
  });

  commonNameList.classList.remove('hidden');
}

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
        item.textContent = item.dataset.title; // 선택된 아이템의 텍스트를 title로 설정
      } else {
        item.textContent = item.dataset.commonName; // 선택 해제된 아이템의 텍스트를 common_name으로 설정
      }
    }
  });
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
  mapContainer.style.width = '380px'; /* 너비 설정 */
  mapContainer.style.height = '150px'; /* 높이 설정 */
  mapContainer.style.marginTop = '20px'; /* 상단 여백 */
  mapContainer.style.marginLeft = '-10px'; /* 왼쪽으로 50px 이동 */
  mapContainer.style.borderRadius = '5px'; /* 모서리를 둥글게 */

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