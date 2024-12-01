function readFile(onloadFn) {
  const [file] = document.querySelector('input[type=file]').files
  const reader = new FileReader()

  reader.addEventListener('load', () => {
    onloadFn(reader.result)
  }, false)

  if (file) {
    reader.readAsText(file)
  }
}

function parseOpmlPodcastList(text) {
  const podcastList = []

  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(text, 'text/xml')

  const outlineNodes = xmlDoc.getElementsByTagName('outline')
  if (outlineNodes.length > 0) {
    for (let outline of outlineNodes) {
      if (outline.getAttribute('type') == 'rss') {
        podcastList.push({
          guid: `url#${strToHash(outline.getAttribute('xmlUrl'))}`,
          title: escapeAmp(outline.getAttribute('text')),
          feedUrl: outline.getAttribute('xmlUrl')
        })
      }
    }
  }

  return podcastList
}