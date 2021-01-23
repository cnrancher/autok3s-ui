export function stringify(err) {
  if (typeof err === 'string') {
    return err
  }
  return err?.response?.data?.message ?? err?.message ?? err
}