import {onMounted, onBeforeUnmount, readonly, ref} from 'vue'
import 'xterm/css/xterm.css'

export const LOADING = 'loading'
export const INITIALIZING = 'Initializing'
export const DONE = 'done'

export default function useTerminal(domRef, onDataCallback, xtermConfig = {}) {
  let terminal = null
  let fitAddon = null
  const readyState = ref(LOADING)
  const clear = () => {
    terminal?.clear()
  }
  const focus = () => {
    terminal?.focus()
  }
  const write = (data) => {
    terminal?.write(data)
  }
  const fit = () => {
    fitAddon?.fit()
    return fitAddon?.proposeDimensions()
  }

  const setupTerminal = async () => {
    readyState.value = LOADING
    const docStyle = getComputedStyle(document.querySelector('body'));
    const xterm = await import('xterm');
    const [fitA, webgl, weblinks, search] = await Promise.all([
      import('xterm-addon-fit'),
      import('xterm-addon-webgl'),
      import('xterm-addon-web-links'),
      import('xterm-addon-search'),
    ])
    terminal = new xterm.Terminal({
      theme: {
        background: docStyle.getPropertyValue('--terminal-bg').trim(),
        cursor:     docStyle.getPropertyValue('--terminal-cursor').trim(),
        selection:  docStyle.getPropertyValue('--terminal-selection').trim(),
        foreground: docStyle.getPropertyValue('--terminal-text').trim()
      },
      ...xtermConfig,
    });
    readyState.value = INITIALIZING
    fitAddon = new fitA.FitAddon();
    const searchAddon = new search.SearchAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(searchAddon);
    terminal.loadAddon(new weblinks.WebLinksAddon());
    terminal.open(domRef.value);
    let webglAddon = null
    try {
      webglAddon = new webgl.WebglAddon()
    } catch (e) {
      console.error('xterm webglAddon: ', e)
    }
    if (webglAddon) {
      terminal.loadAddon(webglAddon);
    }
    terminal.onData((input) => {
      onDataCallback?.(input)
    })
    readyState.value = DONE
  }
  onMounted(() => {
    setupTerminal()
  })
  onBeforeUnmount(() => {
    terminal?.dispose()
  })

  return {
    clear,
    focus,
    write,
    fit,
    readyState: readonly(readyState)
  }
}