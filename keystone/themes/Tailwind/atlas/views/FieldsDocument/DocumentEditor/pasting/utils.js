// a v important note
// marks in the markdown ast/html are represented quite differently to how they are in slate
// if you had the markdown **something https://keystonejs.com something**
// the bold node is the parent of the link node
// but in slate, marks are only represented on text nodes

const currentlyActiveMarks = new Set()
const currentlyDisabledMarks = new Set()
let currentLink = null

export function addMarkToChildren(mark, cb) {
  const wasPreviouslyActive = currentlyActiveMarks.has(mark)
  currentlyActiveMarks.add(mark)
  try {
    return cb()
  } finally {
    if (!wasPreviouslyActive) {
      currentlyActiveMarks.delete(mark)
    }
  }
}

export function setLinkForChildren(href, cb) {
  // we'll only use the outer link
  if (currentLink !== null) {
    return cb()
  }
  currentLink = href
  try {
    return cb()
  } finally {
    currentLink = null
  }
}

export function addMarksToChildren(marks, cb) {
  const marksToRemove = new Set()
  for (const mark of marks) {
    if (!currentlyActiveMarks.has(mark)) {
      marksToRemove.add(mark)
    }
    currentlyActiveMarks.add(mark)
  }
  try {
    return cb()
  } finally {
    for (const mark of marksToRemove) {
      currentlyActiveMarks.delete(mark)
    }
  }
}

export function forceDisableMarkForChildren(mark, cb) {
  const wasPreviouslyDisabled = currentlyDisabledMarks.has(mark)
  currentlyDisabledMarks.add(mark)
  try {
    return cb()
  } finally {
    if (!wasPreviouslyDisabled) {
      currentlyDisabledMarks.delete(mark)
    }
  }
}

export function getInlineNodes(text) {
  const node = { text }
  for (const mark of currentlyActiveMarks) {
    if (!currentlyDisabledMarks.has(mark)) {
      node[mark] = true
    }
  }
  if (currentLink !== null) {
    return [
      { text: "" },
      { type: "link", href: currentLink, children: [node] },
      { text: "" }
    ]
  }
  return [node]
}
