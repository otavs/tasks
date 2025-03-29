import { ClientRect, Modifier } from '@dnd-kit/core'

type Transform = {
  x: number
  y: number
  scaleX: number
  scaleY: number
}

export const restrictToParentElementY: Modifier = ({ containerNodeRect, draggingNodeRect, transform }) => {
  if (!draggingNodeRect || !containerNodeRect) {
    return transform
  }

  return restrictToBoundingRect(transform, draggingNodeRect, containerNodeRect)
}

function restrictToBoundingRect(transform: Transform, rect: ClientRect, boundingRect: ClientRect): Transform {
  const value = {
    ...transform,
  }

  if (rect.top + transform.y <= boundingRect.top) {
    value.y = boundingRect.top - rect.top
  } else if (rect.bottom + transform.y >= boundingRect.top + boundingRect.height) {
    value.y = boundingRect.top + boundingRect.height - rect.bottom
  }

  return value
}
