import { useIsoLayoutEffect } from '@base-ui-study/utils/useIsoLayoutEffect'
import * as React from 'react'
import type { ImageLoadingStatus } from '../root/AvatarRoot'

interface UseImageLoadingStatusOptions {
  crossOrigin?: React.ImgHTMLAttributes<HTMLImageElement>['crossOrigin']
  referrerPolicy?: React.HTMLAttributeReferrerPolicy
}

export function useImageLoadingStatus(
  src: string | undefined,
  { crossOrigin, referrerPolicy }: UseImageLoadingStatusOptions = {},
): ImageLoadingStatus {
  const [loadingStatus, setLoadingStatus] =
    React.useState<ImageLoadingStatus>('idle')

  useIsoLayoutEffect(() => {
    if (!src) {
      setLoadingStatus('error')
      return undefined
    }

    let isMounted = true
    const image = new window.Image()

    const updateStatus = (status: ImageLoadingStatus) => () => {
      if (isMounted) {
        setLoadingStatus(status)
      }
    }

    setLoadingStatus('loading')
    image.onload = updateStatus('loaded')
    image.onerror = updateStatus('error')

    if (referrerPolicy) {
      image.referrerPolicy = referrerPolicy
    }

    image.crossOrigin = crossOrigin ?? null
    image.src = src

    if (image.complete) {
      setLoadingStatus(image.naturalWidth > 0 ? 'loaded' : 'error')
    }

    return () => {
      isMounted = false
    }
  }, [src, crossOrigin, referrerPolicy])

  return loadingStatus
}
