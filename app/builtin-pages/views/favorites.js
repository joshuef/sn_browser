/*
This uses the beakerBookmarks APIs, which is exposed by webview-preload to all sites loaded over the beaker: protocol
*/

import * as yo from 'yo-yo'
import co from 'co'
import * as editSiteModal from '../com/modals/edit-site' 

// constants
// =

const FEEDBACK_FORM_URL = 'https://docs.google.com/forms/d/1bzALt_JzmM_N8B3aK29epE7_VIyZMe0QsCXh3LqPY2I/viewform'

// globals
// =

// bookmarks, cached in memory
var bookmarks = []


// exported API
// =

export function setup () {
}

export function show () {
  document.title = 'New tab'
  co(function*() {
    // get the bookmarks, ordered by # of views
    bookmarks = yield beakerBookmarks.list()
    bookmarks = bookmarks || []
    render()
  })
}

export function hide () {
}

// rendering
// =

function render () {
  const renderRow = (row, i) => row.isEditing ? renderRowEditing(row, i) : renderRowDefault(row, i)

  const renderRowEditing = (row, i) => yo`<div class="ll-row ll-row-is-editing" data-row=${i}>
    <span class="ll-link">
      <div class="ll-inputs">
        <input name="title" value=${row.editTitle} onkeyup=${onKeyUp(i)} />
        <input name="url" value=${row.editUrl} onkeyup=${onKeyUp(i)} />
      </div>
    </div>
  </div>`

  const renderRowDefault = (row, i) => yo`<div class="ll-row" data-row=${i}>
    <a class="ll-link" href=${row.url} title=${row.title}>
      <img class="favicon" src=${'beaker-favicon:'+row.url} />
      <span class="ll-title">${row.title}</span>
    </a>
    <div class="ll-actions">
      <span class="icon icon-pencil" onclick=${onClickEdit(i)} title="Edit bookmark"></span>
      <span class="icon icon-cancel" onclick=${onClickDelete(i)} title="Delete bookmark"></span>
    </div>
  </div>`

  // optional help text
  var helpEl = ''
  if (bookmarks.length === 0) {
    helpEl = yo`<div class="ll-help">
      <span class="icon icon-info-circled"></span> Add bookmarks to fill this page
    </div>`
  }

  // render the top 9 big, the rest small
  yo.update(document.querySelector('#el-content'), yo`<div class="pane" id="el-content">
    <div class="welcome">
      <a class="btn" onclick=${onClickShareFiles}><span class="icon icon-share"></span> Share Files</a>
      <a class="btn" onclick=${onClickCreateSite}><span class="icon icon-docs"></span> Create a Website</a>
    </div>
    <div class="favorites links-list">
      <div class="ll-heading">
        Favorites
        <small class="ll-heading-right">
          <a href=${FEEDBACK_FORM_URL} title="Send feedback"><span class="icon icon-megaphone"></span> Send Feedback</a>
          <a href="https://github.com/pfrazee/beaker/issues" title="Report Bug"><span class="icon icon-attention"></span> Report Bug</a>
          <a href="https://beakerbrowser.com/docs/" title="Get Help"><span class="icon icon-lifebuoy"></span> Help</a>
        </small>
      </div>
      ${bookmarks.map(renderRow)}
      ${helpEl}
    </div>
  </div>`)
}

// event handlers
// =

function onClickEdit (i) {
  return e => {
    e.preventDefault()
    e.stopPropagation()

    // capture initial value
    bookmarks[i].editTitle = bookmarks[i].title
    bookmarks[i].editUrl = bookmarks[i].url

    // enter edit-mode
    bookmarks[i].isEditing = true
    render()
    document.querySelector(`[data-row="${i}"] input`).focus()
  }
}

function onKeyUp (i) {
  return e => {
    // enter-key
    if (e.keyCode == 13) {
      // capture the old url
      var oldUrl = bookmarks[i].url

      // update values
      bookmarks[i].title = document.querySelector(`[data-row="${i}"] [name="title"]`).value
      bookmarks[i].url = document.querySelector(`[data-row="${i}"] [name="url"]`).value

      // exit edit-mode
      bookmarks[i].isEditing = false
      render()

      // save in backend
      beakerBookmarks.changeTitle(oldUrl, bookmarks[i].title)
      beakerBookmarks.changeUrl(oldUrl, bookmarks[i].url)
    }

    // escape-key
    else if (e.keyCode == 27) {
      // exit edit-mode
      bookmarks[i].isEditing = false
      render()
    }

    // all else
    else {
      // update edit values
      if (e.target.name == 'title')
        bookmarks[i].editTitle = e.target.value
      if (e.target.name == 'url')
        bookmarks[i].editUrl = e.target.value
    }

  }
}

function onClickDelete (i) {
  return e => {
    e.preventDefault()
    e.stopPropagation()
    
    // delete bookmark
    var b = bookmarks[i]
    bookmarks.splice(i, 1)
    beakerBookmarks.remove(b.url)
    render()
  }
}

function onClickShareFiles (e) {
  editSiteModal.create({}, { title: 'New Files Archive', onSubmit: opts => {
    datInternalAPI.createNewArchive(opts).then(key => {
      window.location = 'view-dat://' + key
    })
  }})
}

function onClickCreateSite (e) {
  editSiteModal.create({}, { title: 'New Website', onSubmit: opts => {
    opts.useNewSiteTemplate = true
    datInternalAPI.createNewArchive(opts).then(key => {
      window.location = 'dat://' + key
    })
  }})
}