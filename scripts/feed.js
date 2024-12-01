function fetchPodcastFeed(feedUrl) {
  // Note: some RSS feeds can't be loaded in the browser due to CORS security.
  // To get around this, you can use a proxy.
  const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/'

  return fetch(CORS_PROXY + feedUrl, {
    method: 'GET',
    redirect: 'follow'
  })
    .then(response => {
      if (response.ok) {
        return response.text()
      } else if (response.status == '403')
      throw new Error('Something went wrong')
    })
    .catch((error) => {
      console.error('Error: ', error)
      populateAlert(error)
    })
}

function parsePodcastFeed(text) {
  let returnObj = { podcast: { image: {} }, episodes: [] }

  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(text, 'text/xml')

  const channelNode = xmlDoc.getElementsByTagName('channel')[0]
  const podcastGuidNode = channelNode.getElementsByTagName('podcast:guid')[0]

  const guidPod = podcastGuidNode ? podcastGuidNode.innerHTML : null
  guidPod ? returnObj.podcast.guid = guidPod : null
  returnObj.podcast.title = escapeAmp(escapeCdata(channelNode.getElementsByTagName('title')[0].innerHTML))
  returnObj.podcast.link = escapeCdata(channelNode.getElementsByTagName('link')[0].innerHTML)
  returnObj.podcast.image.url = channelNode.getElementsByTagName('itunes:image')[0].getAttribute('href')
  returnObj.podcast.image.title = returnObj.podcast.title

  const itemNodes = xmlDoc.getElementsByTagName('item')
  for (let itemNode of itemNodes) {
    const itemUrl = itemNode.getElementsByTagName('enclosure')[0]
    const itemGuid = itemNode.getElementsByTagName('guid')[0]
    const itemDuration = itemNode.getElementsByTagName('itunes:duration')[0]
    const itemSeason = itemNode.getElementsByTagName('itunes:season')[0]
    const itemEpNo = itemNode.getElementsByTagName('itunes:episode')[0]

    const url = (itemUrl && itemUrl.getAttribute('url')) ? itemUrl.getAttribute('url') : null
    const title = escapeAmp(escapeCdata(itemNode.getElementsByTagName('title')[0].innerHTML))

    let durationVal
    if (itemDuration) {
      durationVal = itemDuration.innerHTML

      if (durationVal.length == 4 && durationVal.includes(':')) {
        durationVal = `00:0${durationVal}`
      } else if (durationVal.length == 5 && durationVal.includes(':')) {
        durationVal = `00:${durationVal}`
      } else if (durationVal.length > 6 && durationVal.includes(':')) {
        // Do nothing
      } else {
        durationVal = parseInt(durationVal) * 1000
      }
    }

    const episode = {}
    episode.guid = itemGuid ? itemGuid.innerHTML : url ? `url#${strToHash(url)}` : `title#${strToHash(title)}`
    episode.title = title
    episode.number = (itemSeason && itemEpNo)? `S${itemSeason.innerHTML}E${itemEpNo.innerHTML}` : itemEpNo? `E${itemEpNo.innerHTML}` : undefined
    episode.url = url
    episode.pubDate = itemNode.getElementsByTagName('pubDate')[0].innerHTML
    episode.duration = moment.duration(durationVal).asMilliseconds()
    returnObj.episodes.push(episode)
  }

  return returnObj
}