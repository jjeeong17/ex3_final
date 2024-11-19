const fs = require('fs');

const outputFilePath = './data/real_final.json';

fs.readFile(outputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('파일 읽기 오류:', err);
    return;
  }

  const jsonData = JSON.parse(data);

  // 최하위 노드 검증
  jsonData.children.forEach((ocean) => {
    ocean.children.forEach((species) => {
      species.children.forEach((archetype) => {
        archetype.children.forEach((commonNameNode) => {
          console.log('Ocean:', ocean.name);
          console.log('  Species:', species.name);
          console.log('    Archetype:', archetype.name);
          console.log('      Common Name:', commonNameNode.name);
          console.log('      Data:', commonNameNode.data);
          console.log('---');
        });
      });
    });
  });
});
