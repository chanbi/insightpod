//////////// Podcasts ////////////

function getSortedPodcasts(podcasts) {
  return podcasts.sort((p1, p2) => {
    if (p1.title < p2.title) return -1
    if (p1.title > p2.title) return 1
    return 0
  })
}

function filterPodcastsByTitle(podcasts, value) {
  let lcValue = value.toLowerCase()
  return podcasts.filter((podcast) => podcast.title.toLowerCase().search(lcValue) != -1)
}

function countUnarchiveEpisodes(podcast) {
  return (podcast.episodes || []).filter((ep) => !ep.archived).length
}

function countArchiveEpisodes(podcast) {
  return (podcast.episodes || []).filter((ep) => ep.archived).length
}

function calculateTotalTimeUnarchiveEpisodes(podcast) {
  return moment.duration((podcast.episodes || []).filter((ep) => !ep.archived).reduce((acc, ep) => acc + ep.duration, 0))
}

function countUnarchiveEpisodesBetweenDurations(podcast, longerThan, shorterThan) {
  return (podcast.episodes || []).filter((ep) => !ep.archived)
    .map((ep) => moment.duration(ep.duration).asMinutes())
    .filter((minutes) => minutes >= longerThan && minutes < shorterThan).length
}

function customDurationTemplate () {
  return this.duration.asDays() >= 7 ? 'w[w] d[d]' : this.duration.asHours() >= 24 ? 'd[d] h[h]' : this.duration.asMinutes() >= 50 ? 'h[h] m[m]' : 'm[m] s[s]'
}

//////////// Episodes ////////////

function getSortedEpisodes(episodes) {
  return episodes.sort((e1, e2) => {
    if (moment(e1.pubDate).isBefore(e2.pubDate)) return 1
    if (moment(e1.pubDate).isAfter(e2.pubDate)) return -1
    return 0
  })
}

function filterEpisodesByTitle(episodes, value) {
  const lcValue = value.toLowerCase()
  return episodes.filter((episode) => episode.title.toLowerCase().search(lcValue) != -1)
}

function exportAllEpisodes(podcast) {
  const objUrl = createCsv(transformDataForCvs(podcast.episodes))
  const filename = podcast.title.replaceAll(/\s/g, '_') + '.csv'
  downloadFile(objUrl, filename)
  console.log(`Downloaded ${filename}`)
}

function exportNewEpisodes(podcast) {
  let filteredEpisodes = podcast.episodes
  if (podcast.lastExportTimestamp) {
    filteredEpisodes = podcast.episodes.filter((episode) => Date.parse(episode.pubDate) > podcast.lastExportTimestamp)
  }

  if (filteredEpisodes.length > 0) {
    const objUrl = createCsv(transformDataForCvs(filteredEpisodes))
    const filename = podcast.title.replaceAll(/\s/g, '_') + '.csv'
    downloadFile(objUrl, filename)
    console.log(`Downloaded ${filename}`)
  } else {
    alert('No new episodes to export')
    console.warn('No new episodes to export')
  }
}

function archiveAllEpisodes(podcast) {
  return { 
    ...podcast, 
    episodes: podcast.episodes.map((ep) => ({ ...ep, archived: true })) 
  }
}