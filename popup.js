function extractKanji(translation) {
    const kanjiRegex = /[\u4e00-\u9faf]+/g;
    const kanjiList = translation.match(kanjiRegex);
    const twoOrMoreKanjiList = kanjiList.filter(kanji => kanji.length >= 2);
    const twoOrMoreKanji = twoOrMoreKanjiList.join("");
  
    return twoOrMoreKanji;
  }
  
  function lookupKanji(kanji) {
    if (kanji in hanjaDic) {
      const definitions = hanjaDic[kanji];
      const defList = definitions.map(def => def.kor + ": " + def.def);
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
        const kanji = extractKanji(translation);
        const output = kanji.split("").map(k => k + ": " + lookupKanji(k)).join("\n");
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
  