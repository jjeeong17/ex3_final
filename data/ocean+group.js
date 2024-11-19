const fs = require('fs');

// 원본 JSON 파일 경로
const inputFilePath = './data/merged.json';
// 수정된 JSON 파일 저장 경로
const outputFilePath = './data/dataset_final.json';

// JSON 파일 읽기
fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('파일 읽기 오류:', err);
    return;
  }

  // JSON 데이터 파싱
  let jsonData = JSON.parse(data);

  // 데이터 변환
  jsonData = jsonData.map((item) => {
    // "ocean" 열 처리
    if (item.ocean) {
      let ocean = item.ocean.split(',')[0].trim(); // 쉼표 이전 단어만 추출
      // 특정 값 변환
      if (ocean === 'South Atlantic Ocean') ocean = 'Atlantic';
      if (ocean === 'South Pacific Ocean') ocean = 'Pacific';
      if (ocean === 'North Atlantic Ocean') ocean = 'Atlantic';
      if (ocean === 'Indian Ocean') ocean = 'Indian';
      item.ocean = ocean; // 수정된 값 저장
    }

    // "newGroup" 열 이름을 "archetype"으로 변경
    if (item.newGroup) {
      item.archetype = item.newGroup; // 새로운 열에 값 복사
      delete item.newGroup; // 기존 열 삭제
    }

    return item;
  });

  // 수정된 데이터를 새로운 JSON 파일로 저장
  fs.writeFile(
    outputFilePath,
    JSON.stringify(jsonData, null, 2),
    'utf8',
    (err) => {
      if (err) {
        console.error('파일 저장 오류:', err);
        return;
      }
      console.log(`데이터가 성공적으로 ${outputFilePath}에 저장되었습니다.`);
    }
  );
});
