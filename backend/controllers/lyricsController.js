const https = require('https')

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Resonance/1.0',
          Accept: 'application/json',
        },
      },
      (res) => {
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => {
          body += chunk
        })
        res.on('end', () => {
          const status = res.statusCode || 0
          try {
            const parsed = body ? JSON.parse(body) : null
            resolve({ status, data: parsed })
          }
          catch (err) {
            reject(new Error(`Failed to parse JSON (status ${status})`))
          }
        })
      }
    )

    req.on('error', reject)
    req.end()
  })
}

function bestMatch(records, durationSeconds) {
  if (!Array.isArray(records) || records.length === 0) return null

  const duration = Number(durationSeconds)
  const hasDuration = Number.isFinite(duration) && duration > 0

  if (!hasDuration) return records[0]

  let best = null
  let bestone = Number.POSITIVE_INFINITY

  for (const record of records) {
    const recDur = Number(record?.duration)
    if(!Number.isFinite(recDur)){
        continue;
    }
    const diff = Math.abs(recDur - duration)
    if (diff <= 2 && diff < bestone) {
      best = record
      bestone = diff
    }
  }

  return best || records[0]
}

//GET api

exports.getLyrics = async (req, res) => {
  try {
    const trackName = typeof req.query.track_name === 'string' ? req.query.track_name.trim() : ''
    const duration = req.query.duration

    if (!trackName) {
      return res.status(400).json({
        message: 'Track name is required',
      })
    }

    const url = `https://lrclib.net/api/search?q=${encodeURIComponent(trackName)}`
    const { status, data } = await getJson(url)

    if (status >= 400) {
      return res.status(status).json({
        message: 'Lyrics provider error',
        provider: 'lrclib',
      })
    }

    const best = bestMatch(data, duration)

    if (!best) {
      return res.status(404).json({
        message: 'Lyrics not found',
        provider: 'lrclib',
      })
    }

    return res.json({
      provider: 'lrclib',
      ...best,
    })
  } 
  catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch lyrics',
    })
  }
}
