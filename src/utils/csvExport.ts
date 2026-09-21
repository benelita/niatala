/**
 * Export data to CSV file
 */
export function downloadCSV(data: any[], filename: string, columns?: string[]) {
  if (data.length === 0) {
    alert('Aucune donnée à exporter')
    return
  }

  // Use first row keys if columns not specified
  const keys = columns || Object.keys(data[0])

  // Create CSV header
  const header = keys.map(key => `"${key}"`).join(',')

  // Create CSV rows
  const rows = data.map(row => {
    return keys.map(key => {
      const value = row[key]
      if (value === null || value === undefined) return '""'
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`
      return `"${value}"`
    }).join(',')
  })

  // Combine header and rows
  const csv = [header, ...rows].join('\n')

  // Create blob and download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
