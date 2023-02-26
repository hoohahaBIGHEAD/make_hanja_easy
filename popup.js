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
  
  function translateText(selectedText) {
    const sourceLang = "auto";
    const targetLang = "ja";
    const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(selectedText)}`;
  
    fetch(translateUrl)
      .then(response => response.json())
      .then(data => {
        const translation = data[0][0][0];
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
  
        const output = words.map(w => {
          const defs = w.split("").map(k => {
            const kanjiLookup = hanjaDic[k];
            if (kanjiLookup && kanjiLookup[0].kor) {
              return kanjiLookup[0].kor;
            } else {
              return "";
            }
          }).join("");
          const wordWithParens = w + "(" + defs + ")";
          const wordDefs = w.split("").map(k => lookupKanji(k)).join(", ");
          return wordWithParens + ": " + wordDefs;
        }).join("\n");
  
        document.getElementById("translation").innerText = output;
      })
      .catch(error => {
        console.error(error);
      });
  }
  
  
  chrome.tabs.executeScript({
    code: "window.getSelection().toString();"
  }, function (selectedText) {
    if (selectedText[0]) {
      translateText(selectedText[0]);
    }
  });
  