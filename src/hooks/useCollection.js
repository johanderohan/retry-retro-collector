import { useState, useEffect } from 'react'
import { dbGetAll, dbAdd, dbRemove } from '../db'

export function useCollection() {
  const [collection, setCollection] = useState([])

  useEffect(() => {
    dbGetAll('collection').then(setCollection)
  }, [])

  async function addGame(game) {
    await dbAdd('collection', game)
    setCollection(prev =>
      prev.some(g => g.id === game.id) ? prev : [game, ...prev]
    )
  }

  async function removeGame(id) {
    await dbRemove('collection', id)
    setCollection(prev => prev.filter(g => g.id !== id))
  }

  async function updateGame(game) {
    await dbAdd('collection', game)
    setCollection(prev => prev.map(g => g.id === game.id ? game : g))
  }

  function hasGame(id) {
    return collection.some(g => g.id === id)
  }

  return { collection, addGame, removeGame, updateGame, hasGame }
}
