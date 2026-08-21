import bcrypt from 'bcryptjs'

export function bcryptHash(password: string, rounds = 10): string {
  const r = Math.min(15, Math.max(4, rounds | 0))
  return bcrypt.hashSync(password, r)
}

export function bcryptCompare(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}
