/**
 * Load locally-hosted MathJax only when a document actually contains LaTeX.
 * Resolving locally avoids an otherwise unnecessary request to a global CDN.
 */
let mathJaxLoad: Promise<void> | null = null;

export function ensureMathJax(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  const loaded = (window as Window & { MathJax?: { typesetPromise?: Function } }).MathJax;
  if (loaded?.typesetPromise) return Promise.resolve();
  if (mathJaxLoad) return mathJaxLoad;
  mathJaxLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = '/mathjax/tex-mml-chtml.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Locally hosted MathJax could not load'));
    document.head.appendChild(script);
  }).catch(error => {
    mathJaxLoad = null;
    throw error;
  });
  return mathJaxLoad;
}
