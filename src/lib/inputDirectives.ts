/** Selects the text inside a text node when the node is focused */
export function selectTextOnFocus(node: HTMLInputElement) {
  
  const handleFocus = (event: FocusEvent) => {
    if (node && typeof node.select === 'function') { 
      node.select()
    } else {
      console.error('invalid node for selectTextOnFocus', node)
    }
  }
  
  node.addEventListener('focus', handleFocus)
  
  return {
    destroy() {
      node.removeEventListener('focus', handleFocus)
    }
  }
}

/** Blurs the node when Escape is pressed */
export function blurOnEscape(node: HTMLInputElement) {
  
  const handleKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && node && typeof node.blur === 'function') node.blur()
  }
  
  node.addEventListener('keydown', handleKey)
  
  return {
    destroy() {
      node.removeEventListener('keydown', handleKey)
    }
  }
}