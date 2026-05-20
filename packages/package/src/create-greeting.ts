export interface CreateGreetingOptions {
  name: string
  greeting?: string
}

export function createGreeting({ greeting = 'Hello', name }: CreateGreetingOptions): string {
  return `${greeting}, ${name}!`
}
