import * as React from 'react'
import type { BaseUIComponentProps } from '../../internals/types'
import { useRenderElement } from '../../internals/useRenderElement'
import { AvatarRootContext } from './AvatarRootContext'
import { avatarStateAttributesMapping } from './stateAttributesMapping'

export type ImageLoadingStatus = 'idle' | 'loading' | 'loaded' | 'error'

export const AvatarRoot = React.forwardRef(function AvatarRootComponent(
  componentProps: AvatarRoot.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    className: _className,
    render: _render,
    style: _style,
    ...elementProps
  } = componentProps
  const [imageLoadingStatus, setImageLoadingStatus] =
    React.useState<ImageLoadingStatus>('idle')

  const state: AvatarRoot.State = {
    imageLoadingStatus,
  }

  const contextValue = React.useMemo(
    () => ({
      imageLoadingStatus,
      setImageLoadingStatus,
    }),
    [imageLoadingStatus],
  )

  const element = useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: avatarStateAttributesMapping,
  })

  return (
    <AvatarRootContext.Provider value={contextValue}>
      {element}
    </AvatarRootContext.Provider>
  )
})

export interface AvatarRootState {
  imageLoadingStatus: ImageLoadingStatus
}

export interface AvatarRootProps extends BaseUIComponentProps<
  'span',
  AvatarRootState
> {}

export namespace AvatarRoot {
  export type Props = AvatarRootProps
  export type State = AvatarRootState
}
