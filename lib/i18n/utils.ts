import { locales, type Locale, defaultLocale } from './config'
import zh from './dictionaries/zh.json'
import ru from './dictionaries/ru.json'

const dictionaries = {
  zh,
  ru,
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries[defaultLocale]
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]

  if (isValidLocale(potentialLocale)) {
    return potentialLocale
  }

  return defaultLocale
}

export function removeLocaleFromPathname(pathname: string, locale: Locale): string {
  if (pathname.startsWith(`/${locale}`)) {
    return pathname.slice(locale.length + 1) || '/'
  }
  return pathname
}

export function addLocaleToPathname(pathname: string, locale: Locale): string {
  if (locale === defaultLocale) {
    return pathname
  }
  return `/${locale}${pathname}`
}
