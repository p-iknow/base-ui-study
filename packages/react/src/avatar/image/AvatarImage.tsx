import { useIsoLayoutEffect } from '@base-ui-study/utils/useIsoLayoutEffect'
import { useStableCallback } from '@base-ui-study/utils/useStableCallback'
import * as React from 'react'
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps'
import { transitionStatusMapping } from '../../internals/stateAttributesMapping'
import type { BaseUIComponentProps } from '../../internals/types'
import { useOpenChangeComplete } from '../../internals/useOpenChangeComplete'
import type { TransitionStatus } from '../../internals/useTransitionStatus'
import { useTransitionStatus } from '../../internals/useTransitionStatus'
import { useRenderElement } from '../../internals/useRenderElement'
import type { AvatarRootState, ImageLoadingStatus } from '../root/AvatarRoot'
import { useAvatarRootContext } from '../root/AvatarRootContext'
import { avatarStateAttributesMapping } from '../root/stateAttributesMapping'
import { useImageLoadingStatus } from './useImageLoadingStatus'

const stateAttributesMapping: StateAttributesMapping<AvatarImage.State> = {
  ...avatarStateAttributesMapping,
  ...transitionStatusMapping,
}

export const AvatarImage = React.forwardRef(function AvatarImageComponent(
  componentProps: AvatarImage.Props,
  forwardedRef: React.ForwardedRef<HTMLImageElement>,
) {
  const {
    className: _className,
    onLoadingStatusChange,
    crossOrigin,
    referrerPolicy,
    render: _render,
    style: _style,
    ...elementProps
  } = componentProps

  const context = useAvatarRootContext()
  const imageLoadingStatus = useImageLoadingStatus(componentProps.src, {
    crossOrigin,
    referrerPolicy,
  })
  const isVisible = imageLoadingStatus === 'loaded'
  const { mounted, setMounted, transitionStatus } =
    useTransitionStatus(isVisible)
  const imageRef = React.useRef<HTMLImageElement | null>(null)

  const handleLoadingStatusChange = useStableCallback(
    (status: ImageLoadingStatus) => {
      onLoadingStatusChange?.(status)
      context.setImageLoadingStatus(status)
    },
  )

  useIsoLayoutEffect(() => {
    if (imageLoadingStatus !== 'idle') {
      handleLoadingStatusChange(imageLoadingStatus)
    }
  }, [imageLoadingStatus, handleLoadingStatusChange])

  useOpenChangeComplete({
    open: isVisible,
    ref: imageRef,
    onComplete() {
      if (!isVisible) {
        setMounted(false)
      }
    },
  })

  const state: AvatarImage.State = {
    imageLoadingStatus,
    transitionStatus,
  }

  return useRenderElement('img', componentProps, {
    enabled: mounted,
    state,
    ref: [forwardedRef, imageRef],
    props: {
      ...elementProps,
      crossOrigin,
      referrerPolicy,
    },
    stateAttributesMapping,
  })
})

export interface AvatarImageState extends AvatarRootState {
  transitionStatus: TransitionStatus
}

export interface AvatarImageProps extends BaseUIComponentProps<
  'img',
  AvatarImageState
> {
  onLoadingStatusChange?: (status: ImageLoadingStatus) => void
}

export namespace AvatarImage {
  export type Props = AvatarImageProps
  export type State = AvatarImageState
}
