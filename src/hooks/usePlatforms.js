import { useState, useEffect } from 'react'
import { dbGetAll, dbAdd, dbRemove } from '../db'

export function usePlatforms() {
  const [platforms, setPlatforms] = useState([])

  useEffect(() => {
    dbGetAll('platforms').then(setPlatforms)
  }, [])

  async function addPlatform(platform) {
    await dbAdd('platforms', platform)
    setPlatforms(prev => prev.some(p => p.id === platform.id) ? prev : [platform, ...prev])
  }

  async function removePlatform(id) {
    await dbRemove('platforms', id)
    setPlatforms(prev => prev.filter(p => p.id !== id))
  }

  function hasPlatform(id) {
    return platforms.some(p => p.id === id)
  }

  return { platforms, addPlatform, removePlatform, hasPlatform }
}
