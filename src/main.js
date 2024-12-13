import moment from 'moment'
import momentDurationFormatSetup from 'moment-duration-format'
import { openPodcastsDB, getAllPodcastsFromDB, savePodcastsToDB } from '@scripts/db'
import { setButtonOnClick, setButtonStyle, populateHtmlTable, setActiveFilters, filterTable, setInputOnInput, setInputOnChange, redrawHtmlTableData, createAnchorElement, createButtonElement, redrawHtmlTableFooter, redrawHtmlTableBody, createImageElement, getUniqueBackgroundColors } from '@scripts/dom'
import { filterPodcastsByTitle, customDurationTemplate, countUnarchiveEpisodes, calculateTotalTimeUnarchiveEpisodes, countUnarchiveEpisodesBetweenDurations, getSortedEpisodes } from '@scripts/features'
import { readFile, parseOpmlPodcastList } from '@scripts/opml'
import { applyColorScale } from '@scripts/color'
import { fetchPodcastFeed, parsePodcastFeed } from '@scripts/feed'
import { mergeArrays } from '@scripts/utils'

momentDurationFormatSetup(moment)
typeof moment.duration.fn.format === 'function'
typeof moment.duration.format === 'function'

const db = openPodcastsDB()
let podcasts = []
let activeFilters = sessionStorage.getItem('activeFilters') ? JSON.parse(sessionStorage.getItem('activeFilters')) : {}
let hideHidden = true

const columnDefs = [
  {
    thText: '',
    thStyle: 'md-col',
    tdChildNode: (podcast) => podcast.image ? createImageElement(podcast.image.url, podcast.image.title) : document.createTextNode('')
  },
  {
    thText: 'Title',
    tdChildNode: (podcast) => createAnchorElement(podcast.title, `feed/?id=${podcast._id}`),
    tfText: () => `Total: ${podcasts.filter((pod) => !pod.hidden).length} podcasts`
  },
  {
    thText: '# Ep.',
    thStyle: 'sm-col',
    thFilter: 3,
    tdChildNode: (podcast) => document.createTextNode(countUnarchiveEpisodes(podcast)),
    tdChildStyle: (podcast) => {
      const count = countUnarchiveEpisodes(podcast)
      const allCounts = podcasts.map((pod) => countUnarchiveEpisodes(pod))
      return `text-align: center; ${applyColorScale(count, Math.min(...allCounts), Math.max(...allCounts) / 4)}`
    },
    tfText: () => podcasts.filter((pod) => !pod.hidden).reduce((acc, pod) => acc + countUnarchiveEpisodes(pod), 0)
  },
  {
    thText: 'Duration',
    thStyle: 'md-col',
    thFilter: 4,
    tdChildNode: (podcast) => document.createTextNode(calculateTotalTimeUnarchiveEpisodes(podcast).format(customDurationTemplate)),
    tdChildStyle: (podcast) => {
      const duration = calculateTotalTimeUnarchiveEpisodes(podcast).asMilliseconds()
      const durations = podcasts.map((pod) => calculateTotalTimeUnarchiveEpisodes(pod).asMilliseconds())
      return `text-align: center; white-space: nowrap; ${applyColorScale(duration, Math.min(...durations), Math.max(...durations) / 4)}`
    },
    tfText: () => moment.duration(podcasts.filter((pod) => !pod.hidden).reduce((acc, pod) => acc + calculateTotalTimeUnarchiveEpisodes(pod).asMilliseconds(), 0)).format(customDurationTemplate)
  },
  {
    thText: '< 10',
    thStyle: 'sm-col',
    thFilter: 5,
    tdChildNode: (podcast) => document.createTextNode(countUnarchiveEpisodesBetweenDurations(podcast, 0, 10)),
    tdChildStyle: (podcast) => {
      const count = countUnarchiveEpisodesBetweenDurations(podcast, 0, 10)
      const allCounts = podcasts.map((pod) => countUnarchiveEpisodesBetweenDurations(pod, 0, 10))
      return `text-align: center; ${applyColorScale(count, Math.min(...allCounts), Math.max(...allCounts) / 4)}`
    },
    tfText: () => podcasts.filter((pod) => !pod.hidden).reduce((acc, pod) => acc + countUnarchiveEpisodesBetweenDurations(pod, 0, 10), 0)
  },
  {
    thText: '< 20',
    thStyle: 'sm-col',
    thFilter: 6,
    tdChildNode: (podcast) => document.createTextNode(countUnarchiveEpisodesBetweenDurations(podcast, 10, 20)),
    tdChildStyle: (podcast) => {
      const count = countUnarchiveEpisodesBetweenDurations(podcast, 10, 20)
      const allCounts = podcasts.map((pod) => countUnarchiveEpisodesBetweenDurations(pod, 10, 20))
      return `text-align: center; ${applyColorScale(count, Math.min(...allCounts), Math.max(...allCounts) / 4)}`
    },
    tfText: () => podcasts.filter((pod) => !pod.hidden).reduce((acc, pod) => acc + countUnarchiveEpisodesBetweenDurations(pod, 10, 20), 0)
  },
  {
    thText: '< 30',
    thStyle: 'sm-col',
    thFilter: 7,
    tdChildNode: (podcast) => document.createTextNode(countUnarchiveEpisodesBetweenDurations(podcast, 20, 30)),
    tdChildStyle: (podcast) => {
      const count = countUnarchiveEpisodesBetweenDurations(podcast, 20, 30)
      const allCounts = podcasts.map((pod) => countUnarchiveEpisodesBetweenDurations(pod, 20, 30))
      return `text-align: center; ${applyColorScale(count, Math.min(...allCounts), Math.max(...allCounts) / 4)}`
    },
    tfText: () => podcasts.filter((pod) => !pod.hidden).reduce((acc, pod) => acc + countUnarchiveEpisodesBetweenDurations(pod, 20, 30), 0)
  },
  {
    thText: '< 40',
    thStyle: 'sm-col',
    thFilter: 8,
    tdChildNode: (podcast) => document.createTextNode(countUnarchiveEpisodesBetweenDurations(podcast, 30, 40)),
    tdChildStyle: (podcast) => {
      const count = countUnarchiveEpisodesBetweenDurations(podcast, 30, 40)
      const allCounts = podcasts.map((pod) => countUnarchiveEpisodesBetweenDurations(pod, 30, 40))
      return `text-align: center; ${applyColorScale(count, Math.min(...allCounts), Math.max(...allCounts) / 4)}`
    },
    tfText: () => podcasts.filter((pod) => !pod.hidden).reduce((acc, pod) => acc + countUnarchiveEpisodesBetweenDurations(pod, 30, 40), 0)
  },
  {
    thText: '< 50',
    thStyle: 'sm-col',
    thFilter: 9,
    tdChildNode: (podcast) => document.createTextNode(countUnarchiveEpisodesBetweenDurations(podcast, 40, 50)),
    tdChildStyle: (podcast) => {
      const count = countUnarchiveEpisodesBetweenDurations(podcast, 40, 50)
      const allCounts = podcasts.map((pod) => countUnarchiveEpisodesBetweenDurations(pod, 40, 50))
      return `text-align: center; ${applyColorScale(count, Math.min(...allCounts), Math.max(...allCounts) / 4)}`
    },
    tfText: () => podcasts.filter((pod) => !pod.hidden).reduce((acc, pod) => acc + countUnarchiveEpisodesBetweenDurations(pod, 40, 50), 0)
  },
  {
    thText: '< 60',
    thStyle: 'sm-col',
    thFilter: 10,
    tdChildNode: (podcast) => document.createTextNode(countUnarchiveEpisodesBetweenDurations(podcast, 50, 60)),
    tdChildStyle: (podcast) => {
      const count = countUnarchiveEpisodesBetweenDurations(podcast, 50, 60)
      const allCounts = podcasts.map((pod) => countUnarchiveEpisodesBetweenDurations(pod, 50, 60))
      return `text-align: center; ${applyColorScale(count, Math.min(...allCounts), Math.max(...allCounts) / 4)}`
    },
    tfText: () => podcasts.filter((pod) => !pod.hidden).reduce((acc, pod) => acc + countUnarchiveEpisodesBetweenDurations(pod, 50, 60), 0)
  },
  {
    thText: '> 60',
    thStyle: 'sm-col',
    thFilter: 11,
    tdChildNode: (podcast) => document.createTextNode(countUnarchiveEpisodesBetweenDurations(podcast, 60, 360)),
    tdChildStyle: (podcast) => {
      const count = countUnarchiveEpisodesBetweenDurations(podcast, 60, 360)
      const allCounts = podcasts.map((pod) => countUnarchiveEpisodesBetweenDurations(pod, 60, 360))
      return `text-align: center; ${applyColorScale(count, Math.min(...allCounts), Math.max(...allCounts) / 4)}`
    },
    tfText: () => podcasts.filter((pod) => !pod.hidden).reduce((acc, pod) => acc + countUnarchiveEpisodesBetweenDurations(pod, 60, 360), 0)
  },
  {
    thText: '',
    thStyle: 'sm-col',
    tdChildNode: (podcast) => createButtonElement(() => window.open(podcast.feedUrl), 'rss_feed', 'icon')
  },
  {
    thText: '',
    thStyle: 'sm-col',
    tdChildNode: (podcast, trEl) => {
      const iconNameFn = (isHidden) => (!isHidden) ? 'visibility_off' : 'visibility'
      podcast.hidden ? trEl.classList.add('disabled') : null

      const onClickFn = (event) => {
        const buttonEl = event.currentTarget
        const arrIndex = podcasts.findIndex((pod) => podcast.guid == pod.guid)
        if (arrIndex != -1) {
          podcasts[arrIndex].hidden = !podcasts[arrIndex].hidden
          savePodcastsToDB(db, podcasts)
            .then((pods) => podcasts = pods)
            .then(() => console.log('Saved hidden state'))
            .then(() => {
              setButtonStyle(buttonEl, iconNameFn(!podcast.hidden), 'icon')
              trEl.classList.toggle('disabled')
              redrawHtmlTableFooter(document.getElementById('data'), columnDefs)
            })
        }
      }

      return createButtonElement(onClickFn, iconNameFn(podcast.hidden), 'icon')
    }
  },
]

const iconNameFn = (hideHidden) => !hideHidden ? 'visibility_off' : 'visibility'
getAllPodcastsFromDB(db)
  .then((pods) => podcasts = pods)
  .then(() => console.log('Loaded all podcasts from DB'))
  .then(() => {
    setButtonStyle('hide-btn', iconNameFn(hideHidden))
    const filteredHiddenPods = hideHidden ? podcasts.filter((pod) => !pod.hidden) : podcasts
    const filteredPods = filterPodcastsByTitle(filteredHiddenPods, document.getElementById('searchInput').value)
    populateHtmlTable(filteredPods, columnDefs)
  })
  .then(() => setActiveFilters(activeFilters))
  .then(() => filterTable(activeFilters))
  .then(() => document.querySelectorAll('.dropdown-button').forEach(dropBtn => dropBtn.addEventListener('click', (event) => {
    const dropContent = event.currentTarget.parentElement.querySelector('.dropdown-content')
    dropContent.classList.toggle('show')
    if (dropContent.children.length == 0) {
      const column = dropContent.parentElement.dataset.column
      const colors = getUniqueBackgroundColors(column)

      let option = document.createElement('a')
      option.innerHTML = 'All'
      option.addEventListener('click', () => onClickDropdownLink(dropContent, () => delete activeFilters[column]))
      dropContent.appendChild(option);

      option = document.createElement('a')
      option.innerHTML = '≠0'
      option.addEventListener('click', () => onClickDropdownLink(dropContent, () => activeFilters[column] = colors.filter((c) => c.r != 255 || c.g != 255 || c.b != 255)))
      dropContent.appendChild(option);

      colors.forEach(color => {
        option = document.createElement('a')
        option.style.backgroundColor = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`
        option.innerHTML = '<br/>'
        option.addEventListener('click', () => onClickDropdownLink(dropContent, () => activeFilters[column] = color))
        dropContent.appendChild(option);
      })
    }
  })))

setInputOnInput('searchInput', (event) => {
  const filteredHiddenPods = hideHidden ? podcasts.filter((pod) => !pod.hidden) : podcasts
  const filteredPods = filterPodcastsByTitle(filteredHiddenPods, event.currentTarget.value)
  redrawHtmlTableBody(document.getElementById('data'), filteredPods, columnDefs)
  filterTable(activeFilters)
})

setButtonOnClick('hide-btn', (event) => {
  const btnEl = event.currentTarget
  hideHidden = !hideHidden
  setButtonStyle(btnEl, iconNameFn(hideHidden))
  const filteredHiddenPods = hideHidden ? podcasts.filter((pod) => !pod.hidden) : podcasts
  const filteredPods = filterPodcastsByTitle(filteredHiddenPods, document.getElementById('searchInput').value)
  redrawHtmlTableBody(document.getElementById('data'), filteredPods, columnDefs)
})

setButtonOnClick('refresh-btn', () => {
  const refreshIcon = document.querySelector('#refresh-btn .material-symbols-outlined')
  refreshIcon.classList.add('spinning')
  Promise.all(podcasts.map(async (pod) => {
    const text = await fetchPodcastFeed(pod.feedUrl)
    return {
      text: text,
      podcast: pod
    }
  }))
    .then((results) => {
      const refreshPods = []
      for (let result of results) {
        const feed = parsePodcastFeed(result.text)
        const newPod = {
          ...result.podcast,
          ...feed.podcast
        }
        newPod.episodes = getSortedEpisodes(mergeArrays(result.podcast.episodes, feed.episodes, (e1, e2) => e1.guid == e2.guid))
        refreshPods.push(newPod)
      }
      return refreshPods
    })
    .then((pods) => savePodcastsToDB(db, pods))
    .then((pods) => podcasts = pods)
    .then(() => console.log('Refreshed all podcast\'s feeds'))
    .then(() => {
      const filteredHiddenPods = hideHidden ? podcasts.filter((pod) => !pod.hidden) : podcasts
      const filteredPods = filterPodcastsByTitle(filteredHiddenPods, document.getElementById('searchInput').value)
      redrawHtmlTableData(document.getElementById('data'), filteredPods, columnDefs)
    })
    .then(() => filterTable(activeFilters))
    .then(() => refreshIcon.classList.remove('spinning'))
})

setInputOnChange('loadOpml', () => {
  readFile((text) => {
    const opmlPodcasts = parseOpmlPodcastList(text)
    const opmlMergedWithBd = opmlPodcasts.map((opml) => ({
      ...podcasts.find((pod) => pod.guid == opml.guid),
      ...opml
    }))
    savePodcastsToDB(db, opmlMergedWithBd)
      .then((pods) => podcasts = pods)
      .then(() => console.log('Loaded podcasts from OPML file'))
      .then(() => {
        const filteredHiddenPods = hideHidden ? podcasts.filter((pod) => !pod.hidden) : podcasts
        const filteredPods = filterPodcastsByTitle(filteredHiddenPods, document.getElementById('searchInput').value)
        redrawHtmlTableData(document.getElementById('data'), filteredPods, columnDefs)
      })
      .then(() => filterTable(activeFilters))
  })
})

function onClickDropdownLink(dropContent, activeFiltersFn) {
  activeFiltersFn()
  sessionStorage.setItem('activeFilters', JSON.stringify(activeFilters))
  filterTable(activeFilters)
  setActiveFilters(activeFilters)
  dropContent.classList.toggle('show')
}
