document.addEventListener('DOMContentLoaded', () => {
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
    }
    // Keep horizontal controls outside the vertically laid out article body.
    const content = group.closest('.post-content');
    if (content) content.before(controls);
    else group.before(controls);
    group.classList.add('text-versions-enhanced');
    select(panels.indexOf(available[0]));
  });
});
