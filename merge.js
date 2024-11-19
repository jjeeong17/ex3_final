const fs = require('fs');

// 파일 경로
const file1Path = './data/final.json'; // 원본 데이터 파일 경로
const file2Path = './data/image.json'; // 썸네일 데이터 파일 경로
const outputPath = './merged.json'; // 병합된 결과를 저장할 파일 경로

// JSON 파일 읽기
const file1 = JSON.parse(fs.readFileSync(file1Path, 'utf-8'));
const file2 = JSON.parse(fs.readFileSync(file2Path, 'utf-8'));

// `id`를 기준으로 병합
const mergedData = file1.map((item) => {
  const matchingThumbnail = file2.find(
    (thumbnailItem) => thumbnailItem.id === item.id
  );

  return {
    ...item,
    thumbnail: matchingThumbnail ? matchingThumbnail.thumbnail : null,
  };
});

// 결과를 파일로 저장
fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), 'utf-8');

console.log(`병합된 데이터가 ${outputPath}에 저장되었습니다.`);
