import { useState, useEffect } from 'react'
import { dbGetAll, dbAdd, dbRemove } from '../db'

export function useWishlist() {
  const [wishlist, setWishlist] = useState([])

  useEffect(() => {
    dbGetAll('wishlist').then(setWishlist)
  }, [])

  async function addToWishlist(game) {
    await dbAdd('wishlist', game)
    setWishlist(prev =>
      prev.some(g => g.id === game.id) ? prev : [game, ...prev]
    )
  }

  async function removeFromWishlist(id) {
    await dbRemove('wishlist', id)
    setWishlist(prev => prev.filter(g => g.id !== id))
  }

  function inWishlist(id) {
    return wishlist.some(g => g.id === id)
  }

  return { wishlist, addToWishlist, removeFromWishlist, inWishlist }
}
