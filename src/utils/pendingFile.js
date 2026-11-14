// Inashikilia video iliyochaguliwa kwenye navbar hadi ukurasa wa Hariri uipokee
let pending = null

export function setPendingFile(file) {
  pending = file || null
}

export function getPendingFile() {
  return pending
}