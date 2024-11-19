const fs = require('fs');

// JSON 파일 경로
const inputFilePath = './data/final_use.json';
const outputFilePath = './data/real_final.json';

// 계층 구조 생성 함수
function buildHierarchy(data) {
  const root = { name: 'Root', children: [] };

  data.forEach((item) => {
    // Ocean 노드 찾기 또는 생성
    let oceanNode = root.children.find((child) => child.name === item.ocean);
    if (!oceanNode) {
      oceanNode = { name: item.ocean, children: [] };
      root.children.push(oceanNode);
    }

    // Species 노드 찾기 또는 생성
    let speciesNode = oceanNode.children.find(
      (child) => child.name === item.species
    );
    if (!speciesNode) {
      speciesNode = { name: item.species, children: [] };
      oceanNode.children.push(speciesNode);
    }

    // Archetype 노드 찾기 또는 생성
    let archetypeNode = speciesNode.children.find(
      (child) => child.name === item.archetype
    );
    if (!archetypeNode) {
      archetypeNode = { name: item.archetype, children: [] };
      speciesNode.children.push(archetypeNode);
    }

    // Common Name 노드 생성
    const commonNameNode = {
      name: item.common_name, // 기본 표시 이름은 Common Name
      title: item.title, // Hover 시 표시할 Scientific Name (Title)
      data: {
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        depth: item.depth,
        record_link: item.record_link,
        thumbnail: item.thumbnail,
      },
    };
    archetypeNode.children.push(commonNameNode);
  });

  return root;
}

// JSON 파일 읽기
fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('파일 읽기 오류:', err);
    return;
  }

  // JSON 데이터 파싱
  const jsonData = JSON.parse(data);

  // 계층 구조 생성
  const hierarchy = buildHierarchy(jsonData);

  // 수정된 JSON 데이터 저장
  fs.writeFile(outputFilePath, JSON.stringify(hierarchy, null, 2), (err) => {
    if (err) {
      console.error('파일 저장 오류:', err);
      return;
    }
    console.log('Hierarchy가 성공적으로 저장되었습니다.');
  });
});
