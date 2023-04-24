function extractKanji(translation) {
    const kanjiRegex = /[\u4e00-\u9faf]+/g;
    const kanjiList = translation.match(kanjiRegex);
    const twoOrMoreKanjiList = kanjiList.filter(kanji => kanji.length >= 2);
  
    return twoOrMoreKanjiList;
  }
  
  function lookupKanji(kanji) {
    if (kanji in hanjaDic) {
      const definitions = hanjaDic[kanji];
      const defList = definitions.map(def => def.def + " " + def.kor);
      return defList.join(", ");
    } else {
      return "";
    }
  }
  
  function fetchTranslation(selectedText) {
    const replacedText = selectedText.replace(/\s+/g, ',');
    const sourceLang = "auto";
    const targetLang = "ja";
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(replacedText)}`;
    
    return fetch(translateUrl)
      .then(response => response.json())
      .then(data => {
        const translation = data[0][0][0];
        return translation;
      })
      .catch(error => {
        console.error(error);
      });
  }
  
  function translateText(selectedText) {
    fetchTranslation(selectedText).then(translation => {
      const kanjiList = extractKanji(translation);
      let words = [kanjiList[0]];
  
      for (let i = 1; i < kanjiList.length; i++) {
        const prevKanji = kanjiList[i - 1];
        const curKanji = kanjiList[i];
        const prevInDic = prevKanji in hanjaDic;
        const curInDic = curKanji in hanjaDic;
        if (prevInDic && curInDic) {
          words[words.length - 1] += curKanji;
        } else {
          words.push(curKanji);
        }
      }
  
      const koreanSentence = selectedText;
      generateOutput(words, koreanSentence);
    });
  }
  
  function generateOutput(words, koreanSentence) {
    const outputList = words.flatMap(w => {
      const kanjiKors = w.split("").map(k => {
        const kanjiLookup = hanjaDic[k];
        if (kanjiLookup) {
          return kanjiLookup.map(l => l.kor);
        } else {
          return [""];
        }
      });
      const kanjiDefs = w.split("").map(k => {
        const kanjiLookup = hanjaDic[k];
        if (kanjiLookup) {
          return kanjiLookup.map(l => l.def + " " + l.kor);
        } else {
          return [""];
        }
      });
      const allKors = cartesianProduct(kanjiKors);
      const allDefs = cartesianProduct(kanjiDefs);
      const outputTuples = allKors.map((kors, i) => {
        return [kors.join(""), allDefs[i].join(", ")];
      });
      if (outputTuples.length > 1) {
        return [outputTuples];
      } else {
        return outputTuples;
      }
    });
    const outputStr = outputList.map(item => {
      if (typeof item === "string") {
        return `${item}`;
      } else {
        return `${item[0]}\n${item[1]}`;
      }
    }).join("\n---\n");
    koreanSentence = insertKanji(outputList, koreanSentence);
    document.getElementById("translation").innerText = koreanSentence + "\n\n" + outputStr;
  }
    
  function insertKanji(outputStr, koreanSentence) {
    outputStr.forEach(item => {
      if (typeof item[0] === "string") {
        koreanSentence = koreanSentence.replace(item[0], (item[0]+'('+item[1]+')'));
      } else {
        koreanSentence = insertKanji(item, koreanSentence);
      }
    });
    return koreanSentence;
  }
    
  
  function cartesianProduct(arrays) {
    if (!arrays || !arrays.length) {
      return [];
    }
  
    function helper(arrays, i, cur, res) {
      if (i === arrays.length) {
        res.push(cur.slice());
        return;
      }
  
      for (let j = 0; j < arrays[i].length; j++) {
        cur[i] = arrays[i][j];
        helper(arrays, i + 1, cur, res);
      }
    }
  
    const res = [];
    helper(arrays, 0, [], res);
    return res;
  }
  
  
  chrome.tabs.executeScript({
    code: "window.getSelection().toString();"
  }, function (selectedText) {
    if (selectedText[0]) {
      const sentences = selectedText[0].split(/[.!?\n]/g).filter(sentence => sentence.trim() !== '');
      sentences.forEach(sentence => {
        translateText(sentence);
      });
    }
  });