import { describe, it, expect } from 'vitest';
import { sanitizeArticleHtml } from '../sanitize';

describe('sanitizeArticleHtml', () => {
  it('keeps allowed formatting, headings, lists, code and images', () => {
    const out = sanitizeArticleHtml('<h2>T</h2><p><strong>b</strong> <em>i</em></p><ul><li>x</li></ul><pre><code>c</code></pre><img src="https://cdn/x.png" alt="a">');
    expect(out).toContain('<h2>T</h2>');
    expect(out).toContain('<strong>b</strong>');
    expect(out).toContain('<li>x</li>');
    expect(out).toContain('<img');
    expect(out).toContain('src="https://cdn/x.png"');
  });

  it('drops scripts, styles, iframes and event handlers', () => {
    const out = sanitizeArticleHtml('<p>ok</p><script>evil()</script><iframe src="https://e"></iframe><p onclick="x()">c</p>');
    expect(out).toContain('<p>ok</p>');
    expect(out).not.toContain('script');
    expect(out).not.toContain('iframe');
    expect(out).not.toContain('onclick');
  });

  it('blocks non-https image schemes and javascript: links', () => {
    expect(sanitizeArticleHtml('<img src="http://x/a.png">')).not.toContain('src="http://');
    expect(sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
  });

  it('forces rel=noopener on links', () => {
    expect(sanitizeArticleHtml('<a href="https://x">x</a>')).toContain('rel="noopener noreferrer nofollow"');
  });
});
