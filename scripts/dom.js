function populateHtmlTable(list, columnDefs) {
  // Create table header
  const table = document.getElementById('data')
  table.innerHTML = ''
  const thead = document.createElement('thead')
  table.appendChild(thead)
  const trh = document.createElement('tr')
  thead.appendChild(trh)
  for (let columnDef of columnDefs) {
    const th = document.createElement('th')
    trh.appendChild(th)
    columnDef.thStyle ? th.className = columnDef.thStyle : null
    // Create header filter
    if (columnDef.thFilter) {
      const dropdown = document.createElement('div')
      dropdown.className = 'dropdown'
      dropdown.dataset['column'] = columnDef.thFilter
      th.appendChild(dropdown)
      
      const dropBtn = document.createElement('div')
      dropBtn.className = 'dropdown-button'
      dropBtn.textContent = columnDef.thText
      const span = document.createElement('span')
      span.className = 'material-symbols-outlined'
      span.textContent = 'arrow_drop_down'
      dropBtn.appendChild(span)
      dropdown.appendChild(dropBtn)

      const dropContent = document.createElement('div')
      dropContent.className = 'dropdown-content'
      dropdown.appendChild(dropContent)
    } else {
      th.appendChild(document.createTextNode(columnDef.thText))
    }
  }

  if (list) {
    // Create table body
    const tbody = document.createElement('tbody')
    table.appendChild(tbody)
    const trArr = createHtmlTableBodyRows(list, columnDefs)
    tbody.replaceChildren(...trArr)
  }

  // Create table footer
  if (columnDefs.some((columnDef) => columnDef.tfText)) {
    const tfoot = document.createElement('tfoot')
    table.appendChild(tfoot)
    const trf = document.createElement('tr')
    tfoot.appendChild(trf)
    for (let columnDef of columnDefs) {
      const td = document.createElement('td')
      columnDef.thText? td.dataset['label'] = columnDef.thText : null
      trf.appendChild(td)
      columnDef.tfText ? td.appendChild(document.createTextNode(columnDef.tfText())) : null
    }
  }
}

function createHtmlTableBodyRows(list, columnDef) {
  return list.map((item) => {
    const tr = document.createElement('tr')
    tr.id = 'row_' + item.guid
    for (let columnDef of columnDefs) {
      const td = document.createElement('td')
      columnDef.thText? td.dataset['label'] = columnDef.thText : null
      tr.appendChild(td)
      columnDef.tdChildStyle? td.style = columnDef.tdChildStyle(item) : null
      td.appendChild(columnDef.tdChildNode(item, tr))
    }
    return tr
  })
}

function redrawHtmlTableBody(table, list, columnDefs) {
  const tbody = table.querySelector('tbody')
  const newTrArray = createHtmlTableBodyRows(list, columnDefs)
  tbody.replaceChildren(...newTrArray)
}

function redrawHtmlTableFooter(table, columnDefs) {
  if (columnDefs.some((columnDef) => columnDef.tfText)) {
    const tfoot = table.querySelector('tfoot')
    const trf = tfoot.querySelector('tr')
    for (i=0; i<columnDefs.length; i++) {
      const columnDef = columnDefs[i]
      const td = trf.querySelectorAll('td')[i]
      columnDef.tfText ? td.firstChild.replaceWith(document.createTextNode(columnDef.tfText())) : null
    }
  }
}

function redrawHtmlTableData(table, list, columnDefs) {
  redrawHtmlTableBody(table, list, columnDefs)
  redrawHtmlTableFooter(table, columnDefs)
}

function createAnchorElement(text, href) {
  const linkEl = document.createElement('a')
  linkEl.href = href
  linkEl.appendChild(document.createTextNode(text))
  return linkEl
}

function createImageElement(src, alt, width) {
  const imgEl = document.createElement('img')
  imgEl.src = src
  imgEl.alt = alt
  width? imgEl.width = width : null
  return imgEl
}

function createButtonElement(onclickFn, iconName, className = '') {
  const buttonEl = document.createElement('button')
  buttonEl.onclick = onclickFn
  className? buttonEl.className = className : null

  const iconEl = document.createElement('span')
  iconEl.className = 'material-symbols-outlined'
  iconEl.innerHTML = iconName

  buttonEl.appendChild(iconEl)
  return buttonEl
}

function setButtonStyle(buttonEl, iconName, className = '') {
  buttonEl = (typeof buttonEl == 'string') ? document.getElementById(buttonEl) : buttonEl
  className? buttonEl.className = className : null
  const iconEl = buttonEl.querySelector('.material-symbols-outlined')
  iconEl.innerHTML = iconName
}

function setButtonOnClick(btnId, onclickFn) {
  let buttonEl = document.getElementById(btnId)
  buttonEl.onclick = onclickFn
}

function populatePodcastHeader(podcast) {
  const header = document.body.querySelector('header')
  let divImg = header.querySelector('.header-image')

  const image = createImageElement(podcast.image.url, podcast.image.title)
  divImg.appendChild(image)

  let title = header.querySelector('.header-title')
  title.innerHTML = podcast.title
}

function populateAlert(error) {
  let header = document.body.querySelector('header')
  header.innerHTML = `<article class="error">${error.message}<br/><a href="https://cors-anywhere.herokuapp.com/" alt="Request temporary access to CORS Anywhere">Request temporary access to CORS Anywhere</a></article>`

  let main = document.body.querySelector('main')
  main.innerHTML = ''
}

function setActiveFilters(activeFilters) {
  const dropbtns = document.querySelectorAll('.dropdown-button')
  dropbtns.forEach(dropbtn => (activeFilters[dropbtn.parentElement.dataset.column])? dropbtn.classList.add('active') : dropbtn.classList.remove('active'))
}

function filterTable(activeFilters) {
  const table = document.getElementById('data')
  const rows = table.querySelectorAll('tbody tr')
  rows.forEach(row => {
    let showRow = true
    for (const [column, color] of Object.entries(activeFilters)) {
      const bgColor = row.cells[column-1].style.backgroundColor
      if (Array.isArray(color)) {
        const anyEquals = color.some((c) => deepEqual(rgbStrToColor(bgColor), c))
        if (!anyEquals) {
          showRow = false
          break
        }
        // }
      } else if (!deepEqual(rgbStrToColor(bgColor), color)) {
        showRow = false
        break
      }
    }
    !showRow ? row.classList.add('hide') : row.classList.remove('hide')
  })
}

function getUniqueBackgroundColors(column) {
  const uniqueValues = new Set()
  const rows = document.getElementById('data').querySelectorAll('tbody tr');
  rows.forEach(row => uniqueValues.add(row.cells[column - 1].style.backgroundColor))
  return [...uniqueValues].map((c) => rgbStrToColor(c)).sort((c1, c2) => sortColors(c1, c2))
}