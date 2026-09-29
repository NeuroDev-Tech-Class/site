/**
 * Sends a file straight to storage with the signed link the hub gave, reporting progress from 0 to 100. XHR rather
 * than fetch, because only XHR reports upload progress.
 */
export function putFile(url: string, headers: Record<string, string>, file: File, onProgress: (percent: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('PUT', url)
    for (const [name, value] of Object.entries(headers)) request.setRequestHeader(name, value)
    request.upload.onprogress = event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    request.onload = () => (request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`upload ${request.status}`)))
    request.onerror = () => reject(new Error('upload failed'))
    request.send(file)
  })
}
