import PouchDB from 'pouchdb-browser'
import { getSortedPodcasts } from '@scripts/features'
import { deepEqual } from '@scripts/utils'

export function openPodcastsDB() {
  const db = new PouchDB('PodcastsDB', { auto_compaction: true })

  db.info().then((info) => {
    console.log(`PodcastsDB info: ${JSON.stringify(info)}`)
  })

  return db
}

export function getAllPodcastsFromDB(db) {
  return db.allDocs({ include_docs: true })
    .then((result) => {
      const docs = result.rows.map((row) => row.doc)
      console.debug(`PodcastsDB allDocs: ${JSON.stringify(docs)}`)
      return getSortedPodcasts(docs)
    })
    .catch((err) => {
      console.error(`PodcastsDB getAllPodcastsFromDB: ${JSON.stringify(err)}`)
      return []
    })
}

export function savePodcastsToDB(db, podcasts) {
  console.debug(`Saving ${JSON.stringify(podcasts)}`)
  return db.allDocs({ include_docs: true })
    .then((result) => {
      const docs = result.rows.map((row) => row.doc)

      for (let pod of podcasts) {
        if (!docs.some((doc) => doc.guid == pod.guid)) {
          console.log(`Adding podcast: ${pod.title}`)
          console.debug(`New ${JSON.stringify(pod)}`)
        }
      }

      for (let doc of docs) {
        const podIdx = podcasts.findIndex((pod) => doc.guid == pod.guid)
        if (podIdx != -1) {
          if (deepEqual(podcasts[podIdx], doc)) {
            console.debug(`Unchanged podcast: ${doc.title}`)
            podcasts.splice(podIdx, 1)
          } else {
            console.log(`Updating podcast: ${doc.title}`)
            console.debug(`Old ${JSON.stringify(doc)}`)
            console.debug(`New ${JSON.stringify(podcasts[podIdx])}`)
            podcasts[podIdx] = {
              ...doc,
              ...podcasts[podIdx]
            }
          }
        } else {
          console.log(`Deleting podcast: ${doc.title}`)
          console.debug(`Old ${JSON.stringify(doc)}`)
          doc._deleted = true
          podcasts.push(doc)
        }
      }

      return db.bulkDocs(podcasts)
    })
    .then((result) => {
      console.log(`PodcastsDB bulkDocs: Saved ${result.length} podcasts`)
      return db.allDocs({ include_docs: true })
    })
    .then((result) => {
      const docs = result.rows.map((row) => row.doc)
      console.debug(`PodcastsDB allDocs: ${JSON.stringify(docs)}`)
      db.info().then((info) => {
        console.log(`PodcastsDB info: ${JSON.stringify(info)}`)
      })
      return getSortedPodcasts(docs)
    })
    .catch((err) => {
      console.error(`PodcastsDB savePodcastsToDB: ${JSON.stringify(err)}`)
      return []
    })
}

export function getPodcastFromDB(db, id) {
  return db.get(id)
    .then((result) => {
      console.debug(`PodcastsDB get: ${JSON.stringify(result)}`)
      return result
    })
    .catch((err) => {
      console.error(`PodcastsDB getPodcastFromDB: ${JSON.stringify(err)}`)
    })
}

export function savePodcastToDB(db, podcast) {
  console.debug(`Saving ${JSON.stringify(podcast)}`)
  return db.put(podcast)
    .then((result) => {
      console.log(`PodcastsDB put: Saved podcast #${result.id}`)
      return db.get(result.id)
    })
    .then((result) => {
      console.debug(`PodcastsDB get: ${JSON.stringify(result)}`)
      return result
    })
    .catch((err) => {
      console.error(`PodcastsDB savePodcastToDB: ${JSON.stringify(err)}`)
    })
}
