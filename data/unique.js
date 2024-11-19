const fs = require('fs');

// JSON 파일 불러오기
fs.readFile(
  '/Users/bella/Desktop/ms1/qualitative_ex2_longJohnSilvers/treemap/data/[TO_BE_USED]updated_final_copy.json',
  'utf8',
  (err, data) => {
    if (err) {
      console.error('Error loading JSON:', err);
      return;
    }

    try {
      // JSON 파싱
      const jsonData = JSON.parse(data);

      const uniqueSpecies = [
        ...new Set(
          jsonData.map((item) => {
            const words = item.common_name.split(' ');
            return words[words.length - 1]; // 마지막 단어 추출
          })
        ),
      ];

      console.log(uniqueSpecies);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
    }
  }
);
