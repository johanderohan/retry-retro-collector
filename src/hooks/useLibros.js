import { useState, useEffect } from 'react'
import { dbGetAll, dbAdd, dbRemove } from '../db'

export function useLibros() {
  const [libros, setLibros] = useState([])

  useEffect(() => {
    dbGetAll('libros').then(setLibros)
  }, [])

  async function addLibro(libro) {
    await dbAdd('libros', libro)
    setLibros(prev => prev.some(l => l.id === libro.id) ? prev : [libro, ...prev])
  }

  async function removeLibro(id) {
    await dbRemove('libros', id)
    setLibros(prev => prev.filter(l => l.id !== id))
  }

  return { libros, addLibro, removeLibro }
}
