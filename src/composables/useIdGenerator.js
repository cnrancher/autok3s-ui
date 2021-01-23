export default function useIdGnerator(start = 0) {
  let id = start
  const next = () => {
    return id++
  }
  const reset = () => {
    id = start
  }
  return {
    next,
    reset,
  }
}