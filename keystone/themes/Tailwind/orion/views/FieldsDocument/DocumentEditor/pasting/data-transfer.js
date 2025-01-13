// jsdom doesn't provide a DataTransfer polyfill
// https://html.spec.whatwg.org/multipage/dnd.html#datatransfer
export class MyDataTransfer {
  #data = new Map()
  dropEffect = "none"
  effectAllowed = "none"
  setData(format, data) {
    this.#data.set(getNormalizedFormat(format), data)
  }
  clearData(format) {
    if (format === undefined) {
      this.#data.clear()
    } else {
      this.#data.delete(getNormalizedFormat(format))
    }
  }
  getData(format) {
    return this.#data.get(getNormalizedFormat(format)) || ""
  }
  get types() {
    return Object.freeze([...this.#data.keys()])
  }
  setDragImage() {
    throw new Error("DataTransfer#setDragImage is currently unimplemented")
  }
  get files() {
    throw new Error("DataTransfer#files is currently unimplemented")
  }
  get items() {
    throw new Error("DataTransfer#items is currently unimplemented")
  }
}

function getNormalizedFormat(format) {
  const lowercased = format.toLowerCase()
  if (lowercased === "text") {
    return "text/plain"
  }
  if (lowercased === "url" || lowercased === "text/uri-list") {
    throw new Error("text/uri-list is currently unimplemented")
  }
  return lowercased
}
