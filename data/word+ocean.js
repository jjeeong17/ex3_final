const fs = require('fs');

// JSON 파일 경로
const inputFilePath = './data/final_use.json';
const outputFilePath = './data/final_use_updated.json';

fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('파일 읽기 오류:', err);
    return;
  }

  // JSON 데이터 파싱
  let jsonData = JSON.parse(data);

  // 데이터 변환: ocean 필드에 " Ocean" 추가
  jsonData = jsonData.map((item) => {
    if (item.ocean) {
      item.ocean = `${item.ocean} Ocean`;
    }
    return item;
  });

  // 변환된 데이터를 파일에 저장
  fs.writeFile(
    outputFilePath,
    JSON.stringify(jsonData, null, 2),
    'utf8',
    (err) => {
      if (err) {
        console.error('파일 쓰기 오류:', err);
        return;
      }
      console.log('JSON 파일이 성공적으로 업데이트되었습니다.');
    }
  );
});
