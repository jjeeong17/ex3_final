// 전역 상태 변수
let selectedOcean = null;
let selectedSpecies = null;
let selectedArchetype = null;

// JSON 파일 로드
fetch('../data/final_use.json')
  .then((response) => response.json())
  .then((data) => {
    console.log('JSON 데이터:', data);
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

function createOceanList(data) {
  const oceanList = document.querySelector('.ocean-list');

  // 고유한 Ocean 값 추출
  const oceans = Array.from(new Set(data.map((d) => d.ocean)));

  oceans.forEach((oceanName) => {
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
  selectedOcean = oceanName; // 현재 선택된 Ocean 저장
  selectedSpecies = null; // 이전 선택된 Species 초기화
  selectedArchetype = null; // 이전 선택된 Archetype 초기화

  // Ocean에 해당하는 Species 필터링
  const filteredSpecies = oceanData
    .filter((d) => d.ocean === oceanName)
    .map((d) => d.species);

  const uniqueSpecies = Array.from(new Set(filteredSpecies));
  const sortedSpecies = uniqueSpecies.sort(
    (a, b) => speciesOrder.indexOf(a) - speciesOrder.indexOf(b)
  );

  updateSpeciesList(sortedSpecies);
  updateListStyles('.ocean-list', oceanName); // Ocean 스타일 업데이트

  const speciesSection = document.querySelector('.species-list');
  scrollToCenter(speciesSection);
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
  selectedSpecies = speciesName; // 현재 선택된 Species 저장
  selectedArchetype = null; // 이전 선택된 Archetype 초기화

  // Ocean 및 Species 조건에 맞는 Archetype 필터링
  const filteredArchetypes = oceanData
    .filter((d) => d.ocean === selectedOcean && d.species === speciesName)
    .map((d) => d.archetype);

  const uniqueArchetypes = Array.from(new Set(filteredArchetypes));
  const sortedArchetypes = uniqueArchetypes.sort(
    (a, b) => archetypeOrder.indexOf(a) - archetypeOrder.indexOf(b)
  );

  updateArchetypeList(sortedArchetypes);
  updateListStyles('.species-list', speciesName); // Species 스타일 업데이트

  const archetypeList = document.querySelector('.archetype-list');
  scrollToCenter(archetypeList);
}

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

function navigateToCommonNames(archetypeName) {
  selectedArchetype = archetypeName; // 현재 선택된 Archetype 저장

  // Ocean, Species, Archetype 조건에 맞는 Common Name 필터링
  const filteredCommonNames = oceanData
    .filter(
      (d) =>
        d.ocean === selectedOcean &&
        d.species === selectedSpecies &&
        d.archetype === archetypeName
    )
    .sort((a, b) => parseFloat(a.depth) - parseFloat(b.depth)) // Depth 낮은 순으로 정렬
    .map((d) => ({
      common_name: d.common_name,
      title: d.title,
    }));

  updateCommonNameList(filteredCommonNames);
  updateListStyles('.archetype-list', archetypeName); // Archetype 스타일 업데이트

  const commonNameList = document.querySelector('.common-name-list');
  scrollToCenter(commonNameList);
}

function updateCommonNameList(commonNameData) {
  const commonNameList = document.querySelector('.common-name-list');
  commonNameList.innerHTML = '';

  commonNameData.forEach((commonName) => {
    const li = document.createElement('li');
    li.textContent = commonName.common_name;

    li.onmouseover = () => {
      li.textContent = commonName.title;
    };

    li.onmouseout = () => {
      li.textContent = commonName.common_name;
    };

    commonNameList.appendChild(li);
  });

  commonNameList.classList.remove('hidden');
}
