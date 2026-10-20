document.addEventListener('DOMContentLoaded', () => {
  const article = document.querySelector('.post-content');
  const toc = document.querySelector('.toc');
  const tocBody = toc?.querySelector('.inner');
  const headingSelector = 'h1, h2, h3, h4, h5, h6';

  function jumpTo(heading) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    heading.scrollIntoView({
      behavior: reduced ? 'instant' : 'smooth',
      block: 'start',
      inline: 'nearest'
    });
    history.replaceState(null, '', '#' + encodeURIComponent(heading.id));
  }

  function rebuildToc() {
    if (!article || !tocBody) return;
    const headings = Array.from(article.querySelectorAll(headingSelector)).filter(heading => {
      if (heading.classList.contains('text-version-heading')) return false;
      const panel = heading.closest('.text-version');
      return !panel || (!panel.hidden && panel.dataset.missing !== 'true');
    });
    const nav = document.createElement('nav');
    nav.setAttribute('aria-label', '目次');
    const list = document.createElement('ul');
    nav.append(list);
    const stack = [{ level: 0, list, lastItem: null }];
    headings.forEach((heading, index) => {
      if (!heading.id) heading.id = `article-heading-${index}`;
      const level = Number(heading.tagName.slice(1));
      while (stack.length > 1 && level < stack[stack.length - 1].level) stack.pop();
      let current = stack[stack.length - 1];
      if (level > current.level && current.lastItem) {
        const childList = document.createElement('ul');
        current.lastItem.append(childList);
        current = { level, list: childList, lastItem: null };
        stack.push(current);
      } else if (!current.lastItem) {
        current.level = level;
      }
      const label = heading.cloneNode(true);
      label.querySelectorAll('rt, rp, .anchor').forEach(node => node.remove());
      const link = document.createElement('a');
      link.href = '#' + encodeURIComponent(heading.id);
      link.textContent = label.textContent.trim();
      link.addEventListener('click', event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        jumpTo(heading);
      });
      const item = document.createElement('li');
      item.append(link);
      current.list.append(item);
      current.lastItem = item;
    });
    tocBody.replaceChildren(nav);
    toc.hidden = headings.length === 0;
  }

  document.querySelectorAll('.text-versions').forEach((group, groupIndex) => {
    const panels = Array.from(group.children).filter(node => node.classList.contains('text-version'));
    const available = panels.filter(panel => panel.dataset.missing !== 'true');
    if (!available.length) return;
    const controls = document.createElement('div');
    controls.className = 'text-version-controls';
    const tabs = document.createElement('div');
    tabs.className = 'text-version-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', '文章の表示');
    controls.append(tabs);
    const buttons = [];
    panels.forEach((panel, index) => {
      const id = `text-version-${groupIndex}-${index}`;
      const button = document.createElement('button');
      button.type = 'button';
      button.id = `${id}-tab`;
      panel.id = id;
      // RenderString may give different versions identical heading IDs.
      panel.querySelectorAll(headingSelector).forEach((heading, headingIndex) => {
        heading.dataset.originalHeadingId = heading.id;
        heading.id = `${id}-heading-${headingIndex}`;
        const anchor = heading.querySelector('a.anchor');
        if (anchor) anchor.setAttribute('href', '#' + heading.id);
      });
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', id);
      button.textContent = panel.dataset.label;
      button.disabled = panel.dataset.missing === 'true';
      if (button.disabled) button.textContent += '（未収録）';
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', button.id);
      panel.tabIndex = 0;
      tabs.append(button);
      buttons.push(button);
      button.addEventListener('click', () => select(index));
      button.addEventListener('keydown', event => {
        const enabled = buttons.filter(item => !item.disabled);
        let target;
        const current = enabled.indexOf(button);
        if (event.key === 'ArrowRight') target = enabled[(current + 1) % enabled.length];
        if (event.key === 'ArrowLeft') target = enabled[(current - 1 + enabled.length) % enabled.length];
        if (event.key === 'Home') target = enabled[0];
        if (event.key === 'End') target = enabled[enabled.length - 1];
        if (target) {
          event.preventDefault();
          target.click();
          target.focus();
        }
      });
    });
    function select(selected) {
      panels.forEach((panel, index) => {
        const active = index === selected;
        panel.hidden = !active;
        buttons[index].setAttribute('aria-selected', String(active));
        buttons[index].tabIndex = active ? 0 : -1;
      });
      group.closest('.post-content')?.scrollTo({ left: 0, top: 0 });
      rebuildToc();
    }
    // Keep horizontal controls outside the vertically laid out article body.
    const content = group.closest('.post-content');
    if (content) content.before(controls);
    else group.before(controls);
    group.classList.add('text-versions-enhanced');
    let targetId = '';
    try { targetId = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { /* Invalid URL fragment. */ }
    const targetPanel = available.find(panel => Array.from(panel.querySelectorAll(headingSelector)).some(
      heading => heading.id === targetId || (targetId && heading.dataset.originalHeadingId === targetId)
    ));
    select(panels.indexOf(targetPanel || available[0]));
    if (targetPanel) {
      const heading = Array.from(targetPanel.querySelectorAll(headingSelector)).find(
        node => node.id === targetId || node.dataset.originalHeadingId === targetId
      );
      if (heading) requestAnimationFrame(() => jumpTo(heading));
    }
    window.addEventListener('hashchange', () => {
      let id;
      try { id = decodeURIComponent(window.location.hash.slice(1)); } catch (_) { return; }
      const panel = available.find(item => Array.from(item.querySelectorAll(headingSelector)).some(node => node.id === id));
      if (panel) {
        if (panel.hidden) select(panels.indexOf(panel));
        const heading = Array.from(panel.querySelectorAll(headingSelector)).find(node => node.id === id);
        if (heading) jumpTo(heading);
      }
    });
  });
});
