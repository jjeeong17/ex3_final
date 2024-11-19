const fs = require('fs');

// JSON 파일 경로
const inputFilePath = './data/dataset_final.json';
const outputFilePath = './data/final_use.json';

// Species 카테고리 매핑 테이블 (위에서 정의한 것)
// Species 카테고리 매핑 테이블
const speciesCategoryMapping = {
  // Reef Fish
  parrotfish: 'Reef Fish',
  butterflyfish: 'Reef Fish',
  angelfish: 'Reef Fish',
  surgeonfish: 'Reef Fish',
  damselfish: 'Reef Fish',
  damsel: 'Reef Fish',
  wrasse: 'Reef Fish',
  blenny: 'Reef Fish',
  goby: 'Reef Fish',
  chromis: 'Reef Fish',
  boxfish: 'Reef Fish',
  dascyllus: 'Reef Fish',
  hawkfish: 'Reef Fish',
  farmerfish: 'Reef Fish',
  mandarinfish: 'Reef Fish',
  dartfish: 'Reef Fish',
  idol: 'Reef Fish',
  bannerfish: 'Reef Fish',
  flagtail: 'Reef Fish',
  batfish: 'Reef Fish',
  filefish: 'Reef Fish',
  sweetlips: 'Reef Fish',
  cardinalfish: 'Reef Fish',
  goldie: 'Reef Fish',
  lionfish: 'Reef Fish',
  // Pelagic Fish
  tuna: 'Pelagic Fish',
  'mahi-mahi': 'Pelagic Fish',
  wahoo: 'Pelagic Fish',
  mackerel: 'Pelagic Fish',
  sailfish: 'Pelagic Fish',
  barracuda: 'Pelagic Fish',
  'smooth-hound': 'Pelagic Fish',
  snapper: 'Pelagic Fish',
  scad: 'Pelagic Fish',
  trumpetfish: 'Pelagic Fish',
  trevally: 'Pelagic Fish',
  // Demersal/Benthic Fish
  grouper: 'Demersal Fish',
  goatfish: 'Demersal Fish',
  sandgoby: 'Demersal Fish',
  scorpionfish: 'Demersal Fish',
  frogfish: 'Demersal Fish',
  lionfish: 'Demersal Fish',
  jobfish: 'Demersal Fish',
  hind: 'Demersal Fish',
  firefish: 'Demersal Fish',
  // Eel-like Fish
  eel: 'Eel-like Fish',
  moray: 'Eel-like Fish',
  pipefish: 'Eel-like Fish',
  seahorse: 'Eel-like Fish',
  wormfish: 'Eel-like Fish',
  sandgoby: 'Eel-like Fish',
  fangblenny: 'Eel-like Fish',
  snailfish: 'Eel-like Fish',
  // Others
  shark: 'Others',
  hammerhead: 'Others',
  puffer: 'Others',
  balloonfish: 'Others',
  spiderfish: 'Others',
  thicklip: 'Others',
  unicornfish: 'Others',
  sweetlips: 'Others',
  mandarinfish: 'Others',
  boxfish: 'Others',
  triggerfish: 'Others',
  dragonet: 'Others',
  soldierfish: 'Others',
  silverside: 'Others',
  squirrelfish: 'Others',
  flagtail: 'Others',
  perch: 'Others',
  lanternfish: 'Others',
  fusilier: 'Others',
  sergeant: 'Others',
  bannerfish: 'Others',
  spiderfish: 'Others',
  batfish: 'Others',
  tang: 'Others',
  spadefish: 'Others',
  unicornfish: 'Others',
};

// JSON 파일 읽기
fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('파일 읽기 오류:', err);
    return;
  }

  // JSON 데이터 파싱
  let jsonData = JSON.parse(data);

  // 각 항목에 species 필드 추가
  jsonData = jsonData.map((item) => {
    if (item.common_name) {
      // common_name을 공백으로 분할하여 마지막 단어 추출
      const nameParts = item.common_name.split(' ');
      const lastWord = nameParts[nameParts.length - 1].toLowerCase();

      // speciesCategoryMapping에서 카테고리 찾기
      let speciesCategory = speciesCategoryMapping[lastWord];

      // 매핑되지 않은 경우 전체 common_name으로 검색
      if (!speciesCategory) {
        const fullName = item.common_name.toLowerCase();
        speciesCategory = speciesCategoryMapping[fullName];
      }

      // 그래도 매핑되지 않으면 'Others'로 분류
      if (!speciesCategory) {
        speciesCategory = 'Others';
      }

      item.species = speciesCategory;
    } else {
      item.species = 'Others'; // common_name이 없는 경우
    }
    return item;
  });

  // 수정된 JSON 데이터 저장
  fs.writeFile(outputFilePath, JSON.stringify(jsonData, null, 2), (err) => {
    if (err) {
      console.error('파일 저장 오류:', err);
      return;
    }
    console.log('species 필드가 추가된 파일이 저장되었습니다.');
  });
});
