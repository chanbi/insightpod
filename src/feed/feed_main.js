import moment from 'moment'
import momentDurationFormatSetup from 'moment-duration-format'
import { openPodcastsDB, getPodcastFromDB, savePodcastToDB } from '@scripts/db'
import { setButtonOnClick, setButtonStyle, populateHtmlTable, setInputOnInput, redrawHtmlTableData, createButtonElement, redrawHtmlTableFooter, redrawHtmlTableBody, populatePodcastHeader } from '@scripts/dom'
import { customDurationTemplate, countUnarchiveEpisodes, calculateTotalTimeUnarchiveEpisodes, getSortedEpisodes, filterEpisodesByTitle, countArchiveEpisodes, archiveAllEpisodes, exportNewEpisodes, exportAllEpisodes } from '@scripts/features'
import { fetchPodcastFeed, parsePodcastFeed } from '@scripts/feed'
import { mergeArrays } from '@scripts/utils'

momentDurationFormatSetup(moment)
typeof moment.duration.fn.format === 'function'
typeof moment.duration.format === 'function'

const db = openPodcastsDB()
const podcastId = new URLSearchParams(window.location.search).get('id')
let podcast = {}

const columnDefs = [
  {
    thText: '',
    thStyle: 'sm-col',
    tdChildNode: (episode, trEl) => {
      const iconNameFn = (isArchived) => (!isArchived) ? 'archive' : 'unarchive'
      episode.archived ? trEl.classList.add('disabled') : null

      const onClickFn = (event) => {
        const buttonEl = event.currentTarget
        const arrIndex = podcast.episodes.findIndex((ep) => episode.guid == ep.guid)
        if (arrIndex != -1) {
          podcast.episodes[arrIndex].archived = !podcast.episodes[arrIndex].archived
          savePodcastToDB(db, podcast)
            .then((pod) => podcast = pod)
            .then(() => console.log('Saved archive state'))
            .then(() => {
              setButtonStyle(buttonEl, iconNameFn(!episode.archived), 'icon')
              trEl.classList.toggle('disabled')
              document.getElementById('archive-all-btn').disabled = !podcast.episodes.some((ep) => !ep.archived)
              redrawHtmlTableFooter(document.getElementById('data'), columnDefs)
            })
        }
      }

      return createButtonElement(onClickFn, iconNameFn(episode.archived), 'icon')
    }
  },
  {
    thText: 'No.',
    tdChildNode: (episode) => episode.number ? document.createTextNode(episode.number) : document.createTextNode('')
  },
  {
    thText: 'Episode',
    tdChildNode: (episode) => document.createTextNode(episode.title),
    tfText: () => `Total: ${podcast.episodes.length} episodes • ${countArchiveEpisodes(podcast)} archived • ${countUnarchiveEpisodes(podcast)} unplayed`
  },
  {
    thText: 'Published',
    tdChildNode: (episode) => document.createTextNode(moment(episode.pubDate).format('MMM DD, YYYY')),
    tdChildStyle: () => 'white-space: nowrap;'
  },
  {
    thText: 'Duration',
    tdChildNode: (episode) => document.createTextNode(moment.duration(episode.duration).format(customDurationTemplate)),
    tfText: () => calculateTotalTimeUnarchiveEpisodes(podcast).format(customDurationTemplate),
    tdChildStyle: () => 'white-space: nowrap;'
  },
  {
    thText: '',
    thStyle: 'sm-col',
    tdChildNode: (episode) => episode.url ? createButtonElement(() => window.open(episode.url), 'play_arrow', 'icon') : document.createTextNode('')
  }
]
const iconNameFn = (hideArchived) => !hideArchived ? 'visibility_off' : 'visibility'
getPodcastFromDB(db, podcastId)
  .then(async (pod) => {
    console.log('Loaded podcast from DB')
    const text = await fetchPodcastFeed(pod.feedUrl)
    return {
      text: text,
      podcast: pod
    }
  })
  .then((result) => {
    const feed = parsePodcastFeed(result.text)
    result.podcast = {
      ...result.podcast,
      ...feed.podcast
    }
    result.podcast.episodes = getSortedEpisodes(mergeArrays(result.podcast.episodes, feed.episodes, (e1, e2) => e1.guid == e2.guid))
    return savePodcastToDB(db, result.podcast)
  })
  .then((pod) => podcast = pod)
  .then(() => console.log('Fetched podcast\'s feed'))
  .then(() => {
    populatePodcastHeader(podcast)
    document.getElementById('archive-all-btn').disabled = !podcast.episodes.some((ep) => !ep.archived)
    setButtonStyle('hide-btn', iconNameFn(podcast.hideArchived))
    const filteredHiddenEps = podcast.hideArchived ? podcast.episodes.filter((ep) => !ep.archived) : podcast.episodes
    const filteredEps = filterEpisodesByTitle(filteredHiddenEps, document.getElementById('searchInput').value)
    populateHtmlTable(filteredEps, columnDefs)
    setButtonOnClick('website-btn', () => window.open(podcast.link))
    setButtonOnClick('rss-btn', () => window.open(`${podcast.feedUrl}`))
    setButtonOnClick('export-all-btn', () => exportAllEpisodes(podcast))
    setButtonOnClick('export-new-btn', () => {
      exportNewEpisodes(podcast)
      podcast.lastExportTimestamp = Date.now()
      savePodcastToDB(db, podcast)
        .then((pod) => podcast = pod)
        .then(() => console.log('Saved last export timestamp'))
    })

    setInputOnInput('searchInput', (event) => {
      const filteredHiddenEps = podcast.hideArchived ? podcast.episodes.filter((ep) => !ep.archived) : podcast.episodes
      const filteredEps = filterEpisodesByTitle(filteredHiddenEps, event.currentTarget.value)
      redrawHtmlTableBody(document.getElementById('data'), filteredEps, columnDefs)
    })

    setButtonOnClick('archive-all-btn', () => {
      const archivedPodcast = archiveAllEpisodes(podcast)
      savePodcastToDB(db, archivedPodcast)
        .then((pod) => podcast = pod)
        .then(() => console.log('Saved archive all state'))
        .then(() => redrawHtmlTableData(document.getElementById('data'), podcast.episodes, columnDefs))
      document.getElementById('archive-all-btn').disabled = true
    })

    setButtonOnClick('hide-btn', (event) => {
      const btnEl = event.currentTarget
      podcast.hideArchived = !podcast.hideArchived
      savePodcastToDB(db, podcast)
        .then((pod) => podcast = pod)
        .then(() => console.log('Saved hide archive state'))
        .then(() => {
          setButtonStyle(btnEl, iconNameFn(podcast.hideArchived))
          const filteredHiddenEps = podcast.hideArchived ? podcast.episodes.filter((ep) => !ep.archived) : podcast.episodes
          const filteredEps = filterEpisodesByTitle(filteredHiddenEps, document.getElementById('searchInput').value)
          redrawHtmlTableBody(document.getElementById('data'), filteredEps, columnDefs)
        })
    })
  })
