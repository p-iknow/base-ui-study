import { useTimeout } from '@base-ui-study/utils/useTimeout'
import * as React from 'react'
import type { BaseUIComponentProps } from '../../internals/types'
import { useRenderElement } from '../../internals/useRenderElement'
import type { AvatarRootState } from '../root/AvatarRoot'
import { useAvatarRootContext } from '../root/AvatarRootContext'
import { avatarStateAttributesMapping } from '../root/stateAttributesMapping'

export const AvatarFallback = React.forwardRef(function AvatarFallbackComponent(
  componentProps: AvatarFallback.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const {
    className: _className,
    delay,
    render: _render,
    style: _style,
    ...elementProps
  } = componentProps
  const { imageLoadingStatus } = useAvatarRootContext()
  const [delayPassed, setDelayPassed] = React.useState(delay === undefined)
  const timeout = useTimeout()

  React.useEffect(() => {
    if (delay === undefined) {
      setDelayPassed(true)
      return timeout.clear
    }

    setDelayPassed(false)
    timeout.start(delay, () => setDelayPassed(true))
    return timeout.clear
  }, [delay, timeout])

  const state: AvatarFallback.State = {
    imageLoadingStatus,
  }

  return useRenderElement('span', componentProps, {
    enabled: imageLoadingStatus !== 'loaded' && delayPassed,
    state,
    ref: forwardedRef,
    props: elementProps,
    stateAttributesMapping: avatarStateAttributesMapping,
  })
})

export interface AvatarFallbackState extends AvatarRootState {}

export interface AvatarFallbackProps extends BaseUIComponentProps<
  'span',
  AvatarFallbackState
> {
  delay?: number
}

export namespace AvatarFallback {
  export type Props = AvatarFallbackProps
  export type State = AvatarFallbackState
}
