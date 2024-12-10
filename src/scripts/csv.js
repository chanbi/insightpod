function transformDataForCvs(episodes) {
  const refinedData = []

  const titleKeys = ['episode-title', 'publication-date', 'duration']
  refinedData.push(titleKeys)

  for (let episode of episodes) {
    let subsetEpisode = {}

    subsetEpisode['title'] = `"${episode.title}"`
    subsetEpisode['pubDate'] = episode.pubDate.replaceAll(/,/g, '')

    if (episode.duration.length == 4 && episode.duration.includes(':')) {
      subsetEpisode['duration'] = `"00:0${episode.duration}"`
    } else if (episode.duration.length == 5 && episode.duration.includes(':')) {
      subsetEpisode['duration'] = `"00:${episode.duration}"`
    } else {
      subsetEpisode['duration'] = episode.duration
    }

    refinedData.push(Object.values(subsetEpisode))
  }

  return refinedData
}

function createCsv(data) {
  let csvContent = ''
  for (let row of data) {
    csvContent += `${row.join(',')}\n`
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8,' })
  return URL.createObjectURL(blob)
}

function downloadFile(objUrl, filename) {
  const link = document.createElement('a')
  link.href = objUrl
  link.download = filename
  link.click()
}