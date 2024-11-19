const fs = require('fs');

// JSON 파일 경로
const inputFilePath = './data/dataset_final.json';

fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('파일 읽기 오류:', err);
    return;
  }

  // JSON 데이터 파싱
  const jsonData = JSON.parse(data);

  // ocean 열에서 유니크 값 추출
  const uniqueOceans = [...new Set(jsonData.map((item) => item.ocean))];

  console.log('유니크한 ocean 값들:', uniqueOceans);

  // 유니크 값들을 별도 파일로 저장하고 싶다면
  fs.writeFile(
    './data/unique_oceans.json',
    JSON.stringify(uniqueOceans, null, 2),
    'utf8',
    (err) => {
      if (err) {
        console.error('유니크 값 저장 오류:', err);
        return;
      }
      console.log(
        '유니크한 ocean 값이 unique_oceans.json 파일에 저장되었습니다.'
      );
    }
  );
});
